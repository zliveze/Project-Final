import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MailerService } from '@nestjs-modules/mailer';

@Injectable()
export class MailService {
  private readonly frontendUrl: string;
  private readonly logger = new Logger(MailService.name);

  constructor(
    private mailerService: MailerService,
    private configService: ConfigService,
  ) {
    this.frontendUrl = this.configService.get<string>('CLIENT_URL') || 'https://project-final-livid.vercel.app';
    this.logger.log(`Mail service initialized with frontend URL: ${this.frontendUrl}`);
    this.logger.log(`Email config: ${this.configService.get<string>('EMAIL_USER')}`);
  }

  /**
   * Gửi email xác nhận đăng ký
   */
  async sendVerificationEmail(email: string, token: string): Promise<void> {
    const verificationUrl = `${this.frontendUrl}/auth/verify-email?token=${token}`;
    this.logger.log(`Sending verification email to ${email} with URL: ${verificationUrl}`);

    try {
      await this.mailerService.sendMail({
        to: email,
        subject: 'Xác nhận đăng ký tài khoản Yumin Beauty',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #ffffff;">
            <div style="text-align: center; padding: 20px 0;">
              <div style="color: #e91e63; font-size: 24px; font-weight: bold;">YUMIN BEAUTY</div>
            </div>
            <div style="padding: 20px; line-height: 1.5;">
              <h2>Xin chào!</h2>
              <p>Cảm ơn bạn đã đăng ký tài khoản tại Yumin Beauty.</p>
              <p>Vui lòng nhấp vào nút bên dưới để xác minh địa chỉ email của bạn:</p>
              <p style="text-align: center;">
                <a href="${verificationUrl}" style="background-color: #e91e63; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">
                  Xác minh email
                </a>
              </p>
              <p>Hoặc bạn có thể sao chép liên kết này vào trình duyệt: ${verificationUrl}</p>
              <p>Liên kết này sẽ hết hạn sau 24 giờ.</p>
              <p>Nếu bạn không đăng ký tài khoản tại Yumin Beauty, vui lòng bỏ qua email này.</p>
            </div>
            <div style="text-align: center; padding: 20px; font-size: 12px; color: #999;">
              <p>© 2023 Yumin Beauty. Tất cả các quyền được bảo lưu.</p>
              <p>Địa chỉ: 123 Đường ABC, Quận XYZ, TP.HCM, Việt Nam</p>
            </div>
          </div>
        `,
      });
      this.logger.log(`Verification email sent successfully to ${email}`);
    } catch (error) {
      this.logger.error(`Failed to send verification email to ${email}:`, error);
      throw error;
    }
  }

  /**
   * Gửi email đặt lại mật khẩu
   */
  async sendResetPasswordEmail(email: string, token: string): Promise<void> {
    const resetUrl = `${this.frontendUrl}/auth/reset-password?token=${token}`;
    this.logger.log(`Sending reset password email to ${email} with URL: ${resetUrl}`);

    try {
      await this.mailerService.sendMail({
        to: email,
        subject: 'Đặt lại mật khẩu tài khoản Yumin Beauty',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #ffffff;">
            <div style="text-align: center; padding: 20px 0;">
              <div style="color: #e91e63; font-size: 24px; font-weight: bold;">YUMIN BEAUTY</div>
            </div>
            <div style="padding: 20px; line-height: 1.5;">
              <h2>Xin chào!</h2>
              <p>Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản của bạn.</p>
              <p>Vui lòng nhấp vào nút bên dưới để đặt lại mật khẩu:</p>
              <p style="text-align: center;">
                <a href="${resetUrl}" style="background-color: #e91e63; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">
                  Đặt lại mật khẩu
                </a>
              </p>
              <p>Hoặc bạn có thể sao chép liên kết này vào trình duyệt: ${resetUrl}</p>
              <p>Liên kết này sẽ hết hạn sau 1 giờ.</p>
              <p>Nếu bạn không thực hiện yêu cầu này, vui lòng bỏ qua email này và đảm bảo rằng bạn vẫn có thể truy cập vào tài khoản của mình.</p>
            </div>
            <div style="text-align: center; padding: 20px; font-size: 12px; color: #999;">
              <p>© 2023 Yumin Beauty. Tất cả các quyền được bảo lưu.</p>
              <p>Địa chỉ: 123 Đường ABC, Quận XYZ, TP.HCM, Việt Nam</p>
            </div>
          </div>
        `,
      });
      this.logger.log(`Reset password email sent successfully to ${email}`);
    } catch (error) {
      this.logger.error(`Failed to send reset password email to ${email}:`, error);
      throw error;
    }
  }

  /**
   * Gửi email thông báo đơn hàng
   */
  async sendOrderConfirmation(email: string, orderData: any): Promise<void> {
    this.logger.log(`Sending order confirmation email to ${email}`);

    try {
      await this.mailerService.sendMail({
        to: email,
        subject: 'Xác nhận đơn hàng - Yumin Beauty',
        html: `
          <h1>Cảm ơn bạn đã đặt hàng!</h1>
          <p>Chúng tôi đã nhận được đơn hàng của bạn.</p>
          <p>Mã đơn hàng: <strong>${orderData.orderNumber || orderData._id}</strong></p>
          <p>Trân trọng,<br>Đội ngũ Yumin Beauty</p>
        `,
      });
      this.logger.log(`Order confirmation email sent successfully to ${email}`);
    } catch (error) {
      this.logger.error(`Failed to send order confirmation email to ${email}:`, error);
      throw error;
    }
  }
} 