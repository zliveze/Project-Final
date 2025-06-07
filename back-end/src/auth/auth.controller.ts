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
    this.clientUrl = this.configService.get<string>('CLIENT_URL') || 'https://project-final-livid.vercel.app';
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
  googleLogin(@Query('redirect_uri') redirectUri: string, @Req() req: any) {
    // Lưu redirect_uri vào session để sử dụng sau khi xác thực
    if (redirectUri) {
      if (req.session) {
        (req.session as any).redirectUri = redirectUri;
        this.logger.log(`Saving redirect URI to session: ${redirectUri}`);
      } else {
        this.logger.warn('Session not available, cannot save redirect URI');
      }
    }

    // Passport sẽ tự động chuyển hướng đến Google
    return { message: 'Google authentication initiated' };
  }

  // Callback URL sau khi xác thực Google
  @Get('callback/google')
  @UseGuards(GoogleAuthGuard)
  async googleCallback(@Req() req: RequestWithUser, @Res() res: Response) {
    this.logger.log('[AuthController] Google callback reached.');
    try {
      this.logger.debug(`[AuthController] User from Google Strategy (req.user): ${JSON.stringify(req.user)}`);

      // Kiểm tra kỹ hơn dữ liệu từ req.user
      // GoogleStrategy#validate sẽ gọi done(null, result)
      // result từ authService.registerWithGoogle là { accessToken, refreshToken, user }
      if (!req.user || !req.user.accessToken || !req.user.user || !req.user.user._id) {
        this.logger.error('[AuthController] Google callback failed: Invalid user data received from strategy or missing user._id.');
        this.logger.debug(`[AuthController] Received req.user: ${JSON.stringify(req.user)}`);
        // Không redirect mà trả lỗi trực tiếp để frontend có thể xử lý
        return res.status(500).json({ message: 'Lỗi xử lý xác thực Google: Dữ liệu người dùng không hợp lệ.' });
      }

      // Lấy redirect_uri từ session nếu có
      // CẢNH BÁO: Session trên Vercel có thể không đáng tin cậy với MemoryStore.
      // Cân nhắc sử dụng state parameter hoặc một cơ chế khác để truyền redirect URI.
      let redirectUrlFromSession: string | undefined;
      if (req.session && (req.session as any).redirectUri) {
        redirectUrlFromSession = (req.session as any).redirectUri;
        this.logger.log(`[AuthController] Using redirect URI from session: ${redirectUrlFromSession}`);
        // Xóa redirect_uri khỏi session sau khi sử dụng
        delete (req.session as any).redirectUri;
      } else {
        this.logger.log('[AuthController] No redirect URI found in session.');
      }
      
      // Sử dụng clientUrl từ configService làm URL redirect mặc định nếu không có từ session
      // Hoặc nếu redirectUrlFromSession không hợp lệ (ví dụ: không phải là URL được cho phép)
      // Điều này cần một logic kiểm tra URL an toàn hơn trong thực tế.
      const defaultRedirectBaseUrl = this.configService.get<string>('CLIENT_URL_GOOGLE_CALLBACK') || `${this.clientUrl}/auth/google-callback`;
      const redirectBaseUrl = redirectUrlFromSession || defaultRedirectBaseUrl;

      this.logger.log(`[AuthController] Base redirect URL determined: ${redirectBaseUrl}`);

      const { accessToken, refreshToken, user } = req.user;
      const finalRedirectUrl = `${redirectBaseUrl}?accessToken=${accessToken}&refreshToken=${refreshToken}&user=${encodeURIComponent(JSON.stringify(user))}`;

      this.logger.log(`[AuthController] Redirecting to: ${finalRedirectUrl}`);
      return res.redirect(finalRedirectUrl);

    } catch (error: any) {
      this.logger.error(`[AuthController] Error in googleCallback: ${error.message}`, error.stack);
      // Trả lỗi chung cho client
      // Có thể tùy chỉnh response lỗi dựa trên loại lỗi
      if (error.response && error.status) {
         return res.status(error.status).json(error.response);
      }
      return res.status(500).json({ message: 'Lỗi máy chủ nội bộ khi xử lý callback Google.' });
    }
  }

  // Phương thức thay thế khi không sử dụng OAuth trực tiếp (giữ nguyên)
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
