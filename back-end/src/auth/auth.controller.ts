import { Body, Controller, Get, HttpCode, Post, Req, UseGuards, Logger, Res, Query } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto, LoginDto, ForgotPasswordDto, ResetPasswordDto, RefreshTokenDto, VerifyEmailDto, GoogleAuthDto, ResendVerificationDto } from './dto/auth.dto';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { JwtRefreshAuthGuard } from './guards/jwt-refresh-auth.guard';
import { GoogleAuthGuard } from './guards/google-auth.guard';
import { CurrentUser } from '../common/decorators/user.decorator';
import { Request, Response } from 'express';
import { ConfigService } from '@nestjs/config';

// Mở rộng interface Request để thêm thuộc tính user
interface RequestWithUser extends Request {
  user: any;
}

@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);
  private readonly clientUrl: string;
  
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService
  ) {
    this.clientUrl = this.configService.get<string>('CLIENT_URL') || 'http://localhost:3000';
  }

  @Post('register')
  async register(@Body() registerDto: RegisterDto) {
    const user = await this.authService.register(registerDto);
    return {
      message: 'Đăng ký thành công! Vui lòng kiểm tra email để xác minh tài khoản.',
      userId: user._id,
    };
  }

  @UseGuards(LocalAuthGuard)
  @Post('login')
  @HttpCode(200)
  async login(@Req() req: RequestWithUser) {
    return this.authService.login(req.user);
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  @HttpCode(200)
  async logout(@CurrentUser('userId') userId: string) {
    await this.authService.logout(userId);
    return { message: 'Đăng xuất thành công' };
  }

  @UseGuards(JwtRefreshAuthGuard)
  @Post('refresh')
  @HttpCode(200)
  async refreshToken(@CurrentUser() user: any) {
    return this.authService.refreshToken(
      user.userId,
      user.refreshToken,
    );
  }

  @Post('forgot-password')
  @HttpCode(200)
  async forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto) {
    await this.authService.forgotPassword(forgotPasswordDto);
    return {
      message: 'Nếu email của bạn đã đăng ký, chúng tôi sẽ gửi hướng dẫn đặt lại mật khẩu.',
    };
  }

  @Post('reset-password')
  @HttpCode(200)
  async resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
    await this.authService.resetPassword(resetPasswordDto);
    return { message: 'Đặt lại mật khẩu thành công!' };
  }

  @Get('verify-email')
  async verifyEmail(@Query('token') token: string) {
    await this.authService.verifyEmail(token);
    return { message: 'Xác minh email thành công!' };
  }

  // Khởi tạo quá trình xác thực Google
  @Get('google/login')
  @UseGuards(GoogleAuthGuard)
  googleLogin() {
    // Passport sẽ tự động chuyển hướng đến Google
    return { message: 'Google authentication initiated' };
  }

  // Callback URL sau khi xác thực Google
  @Get('callback/google')
  @UseGuards(GoogleAuthGuard)
  googleCallback(@Req() req: RequestWithUser, @Res() res: Response) {
    this.logger.log('Google callback received');
    
    // Tạo và trả về các token như đăng nhập thông thường
    const { accessToken, refreshToken, user } = req.user;
    
    // Redirect về frontend với token (trong thực tế nên dùng cách bảo mật hơn)
    const redirectUrl = `${this.clientUrl}/auth/google-callback?accessToken=${accessToken}&refreshToken=${refreshToken}&user=${encodeURIComponent(JSON.stringify(user))}`;
    return res.redirect(redirectUrl);
  }

  // Phương thức thay thế khi không sử dụng OAuth trực tiếp
  @Post('google')
  async googleAuth(@Body() googleAuthDto: GoogleAuthDto) {
    this.logger.log(`LƯU Ý: Chức năng demo đang được sử dụng thay vì OAuth thực tế với Google`);
    this.logger.log(`Nhận yêu cầu đăng nhập Google với token: ${googleAuthDto.token.substring(0, 10)}...`);
    
    try {
      // DEMO MODE: Trong thực tế, chúng ta sẽ xác minh token với Google API
      const result = await this.authService.registerWithGoogle({
        // Dữ liệu mẫu cho tài khoản demo
        email: 'example@gmail.com',
        name: 'Google User (Demo)',
        googleId: googleAuthDto.token, // Sử dụng token làm ID tạm thời
      });
      
      this.logger.log('Đăng nhập bằng tài khoản Google demo thành công');
      return result;
    } catch (error) {
      this.logger.error(`Đăng nhập Google thất bại: ${error.message}`);
      throw error;
    }
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  getProfile(@CurrentUser() user: any) {
    return user;
  }

  @Post('resend-verification')
  @HttpCode(200)
  async resendVerification(@Body() resendVerificationDto: ResendVerificationDto) {
    await this.authService.resendVerification(resendVerificationDto.email);
    return {
      message: 'Nếu email của bạn đã đăng ký, chúng tôi sẽ gửi hướng dẫn xác minh.',
    };
  }
} 