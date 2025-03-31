import { Injectable, BadRequestException, UnauthorizedException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { UsersService } from '../users/users.service';
import { User, UserDocument } from '../users/schemas/user.schema';
import { RegisterDto, ForgotPasswordDto, ResetPasswordDto } from './dto/auth.dto';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { MailService } from '../common/mail/mail.service';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private usersService: UsersService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private mailService: MailService,
  ) {}

  async validateUser(email: string, password: string): Promise<any> {
    const user = await this.usersService.findByEmail(email);
    
    if (!user) {
      return null;
    }

    if (user.isBanned) {
      throw new UnauthorizedException('Tài khoản của bạn đã bị khóa');
    }

    if (user.isDeleted) {
      throw new UnauthorizedException('Tài khoản không tồn tại');
    }

    // Kiểm tra xác minh email
    if (!user.isVerified) {
      throw new UnauthorizedException('Vui lòng xác minh email của bạn trước khi đăng nhập');
    }

    const isValidPassword = await bcrypt.compare(password, user.password);
    
    if (!isValidPassword) {
      return null;
    }

    // Cập nhật trạng thái đăng nhập
    if (user._id) {
      await this.usersService.update(user._id.toString(), { isActive: true });
    }

    return {
      _id: user._id,
      email: user.email,
      name: user.name,
      role: user.role,
      isVerified: user.isVerified,
    };
  }

  async login(user: any) {
    const payload = { email: user.email, sub: user._id, role: user.role };
    
    const accessToken = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('JWT_SECRET'),
      expiresIn: this.configService.get<string>('JWT_EXPIRATION'),
    });

    const refreshToken = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      expiresIn: this.configService.get<string>('JWT_REFRESH_EXPIRATION'),
    });

    // Lưu refresh token vào database
    await this.usersService.setRefreshToken(user._id, refreshToken);

    return {
      accessToken,
      refreshToken,
      user: {
        _id: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
        isVerified: user.isVerified,
      },
    };
  }

  async register(registerDto: RegisterDto): Promise<UserDocument> {
    const { email } = registerDto;
    
    const existingUser = await this.usersService.findByEmail(email);
    
    if (existingUser) {
      throw new BadRequestException('Email đã được sử dụng');
    }

    // Tạo token xác minh email
    const verificationToken = crypto.randomBytes(32).toString('hex');
    
    const createUserDto: CreateUserDto = {
      ...registerDto,
      role: 'user', // Mặc định role là user
    };

    const newUser = await this.usersService.create({
      ...createUserDto,
      isVerified: false,
      verificationToken,
      verificationExpires: new Date(Date.now() + 86400000), // 24 giờ
    } as any);

    // Gửi email xác minh
    await this.mailService.sendVerificationEmail(newUser.email, verificationToken);

    return newUser;
  }

  async refreshToken(userId: string, refreshToken: string) {
    const user = await this.usersService.findOne(userId);
    
    if (!user || user.refreshToken !== refreshToken) {
      throw new UnauthorizedException('Refresh token không hợp lệ');
    }

    const payload = { email: user.email, sub: user._id, role: user.role };
    
    const accessToken = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('JWT_SECRET'),
      expiresIn: this.configService.get<string>('JWT_EXPIRATION'),
    });

    return {
      accessToken,
    };
  }

  async logout(userId: string): Promise<void> {
    // Cập nhật trạng thái và xóa refresh token
    await this.usersService.update(userId, { isActive: false });
    await this.usersService.setRefreshToken(userId, null);
  }

  async forgotPassword(forgotPasswordDto: ForgotPasswordDto): Promise<void> {
    const { email } = forgotPasswordDto;
    this.logger.log(`Received forgot password request for email: ${email}`);
    
    try {
      const user = await this.usersService.findByEmail(email);

      // Không tiết lộ liệu email có tồn tại hay không vì lý do bảo mật
      // Nhưng chỉ tiếp tục xử lý nếu người dùng tồn tại
      if (user) {
        this.logger.log(`User found for email: ${email}`);
        
        // Tạo token ngẫu nhiên
        const resetPasswordToken = crypto.randomBytes(32).toString('hex');
        const resetPasswordExpires = new Date(Date.now() + 3600000); // 1 giờ

        // Lưu token vào database
        await this.usersService.setResetPasswordToken(
          user._id.toString(),
          resetPasswordToken,
          resetPasswordExpires,
        );
        this.logger.log(`Reset password token saved for user: ${user._id}`);

        // Gửi email reset password
        try {
          await this.mailService.sendResetPasswordEmail(user.email, resetPasswordToken);
          this.logger.log(`Reset password email sent to: ${email}`);
        } catch (emailError) {
          this.logger.error(`Error sending reset password email: ${emailError.message}`, emailError.stack);
          // Không throw lỗi ra ngoài để không tiết lộ thông tin user
        }
      } else {
        this.logger.log(`No user found for email: ${email}`);
      }
    } catch (error) {
      this.logger.error(`Error in forgot password process: ${error.message}`, error.stack);
      // Không throw lỗi ra ngoài để không tiết lộ thông tin user
    }
  }

  async resetPassword(resetPasswordDto: ResetPasswordDto): Promise<void> {
    const { token, password } = resetPasswordDto;

    // Tìm user với token và token chưa hết hạn
    const user = await this.usersService.findUserByResetToken(token);

    if (!user) {
      throw new BadRequestException('Token không hợp lệ hoặc đã hết hạn');
    }

    // Hash mật khẩu mới
    const salt = await bcrypt.genSalt();
    const hashedPassword = await bcrypt.hash(password, salt);

    // Cập nhật mật khẩu và xóa token
    await this.usersService.resetUserPassword(user._id.toString(), hashedPassword);
  }

  async verifyEmail(token: string): Promise<void> {
    const user = await this.usersService.findByVerificationToken(token);
    
    if (!user) {
      throw new BadRequestException('Token xác minh không hợp lệ hoặc đã hết hạn');
    }
    
    await this.usersService.verifyEmail(user._id.toString());
  }

  async registerWithGoogle(googleData: any): Promise<any> {
    const { email, name, googleId, picture } = googleData;
    
    if (!email) {
      throw new Error('Email is required for Google authentication');
    }
    
    let user = await this.usersService.findByEmail(email);
    
    if (!user) {
      // Tạo user mới nếu chưa tồn tại
      // Tạo một mật khẩu ngẫu nhiên vì Mongoose schema có thể yêu cầu password
      const randomPassword = Math.random().toString(36).slice(-10);
      
      user = await this.usersService.create({
        email,
        name,
        googleId,
        isVerified: true, // Google đã xác minh email
        role: 'user',
        avatar: picture, // Sử dụng avatar từ Google
        password: randomPassword, // Đặt mật khẩu ngẫu nhiên
        phone: '', // Thêm trường phone trống
      });
    } else if ((!user.googleId || user.googleId !== googleId) && user._id) {
      // Cập nhật googleId nếu user đã tồn tại nhưng chưa liên kết với Google
      // hoặc liên kết với tài khoản Google khác
      user = await this.usersService.update(user._id.toString(), { 
        googleId,
        avatar: picture || user.avatar,
      });
    }

    // Login user
    const authResult = this.login({
      _id: user._id,
      email: user.email,
      name: user.name,
      role: user.role,
    });

    return authResult;
  }

  async resendVerification(email: string): Promise<void> {
    this.logger.log(`Received resend verification request for email: ${email}`);
    
    try {
      const user = await this.usersService.findByEmail(email);

      // Không tiết lộ liệu email có tồn tại hay không vì lý do bảo mật
      // Nhưng chỉ tiếp tục xử lý nếu người dùng tồn tại và chưa xác minh
      if (user && !user.isVerified) {
        this.logger.log(`User found for email: ${email} and is not verified yet`);
        
        // Tạo token mới
        const verificationToken = crypto.randomBytes(32).toString('hex');
        const verificationExpires = new Date(Date.now() + 86400000); // 24 giờ

        // Cập nhật token trong database
        await this.usersService.update(user._id.toString(), {
          verificationToken,
          verificationExpires,
        });
        
        this.logger.log(`Verification token updated for user: ${user._id}`);

        // Gửi email xác minh mới
        try {
          await this.mailService.sendVerificationEmail(user.email, verificationToken);
          this.logger.log(`Verification email resent to: ${email}`);
        } catch (emailError) {
          this.logger.error(`Error sending verification email: ${emailError.message}`, emailError.stack);
          // Không throw lỗi ra ngoài để không tiết lộ thông tin user
        }
      } else {
        this.logger.log(`No user found for email: ${email} or user is already verified`);
      }
    } catch (error) {
      this.logger.error(`Error in resend verification process: ${error.message}`, error.stack);
      // Không throw lỗi ra ngoài để không tiết lộ thông tin user
    }
  }
} 