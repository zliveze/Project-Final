import { Injectable, Logger, UnauthorizedException, InternalServerErrorException, HttpException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, Profile, StrategyOptions } from 'passport-google-oauth20';
import { ConfigService } from '@nestjs/config';
import { AuthService } from '../auth.service';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  private readonly logger = new Logger(GoogleStrategy.name);
  
  constructor(
    private readonly configService: ConfigService,
    private readonly authService: AuthService,
  ) {
    const clientID = configService.get<string>('GOOGLE_CLIENT_ID') || '';
    const clientSecret = configService.get<string>('GOOGLE_CLIENT_SECRET') || '';
    const callbackURL = configService.get<string>('GOOGLE_CALLBACK_URL') || '';
    
    // In ra URL callback để debug
    console.log('Google OAuth Callback URL:', callbackURL);
    
    const options: StrategyOptions = {
      clientID,
      clientSecret,
      callbackURL,
      scope: ['email', 'profile'],
    };
    super(options);
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: Profile,
    done: (err: Error | null, user?: any, info?: any) => void,
  ): Promise<void> {
    this.logger.log(`[GoogleStrategy] Validate method reached. Profile Display Name: ${profile.displayName}, Email: ${profile.emails ? profile.emails[0]?.value : 'N/A'}`);
    try {
      const { name, emails, photos } = profile;

      if (!emails || emails.length === 0 || !emails[0].value) {
        this.logger.error('[GoogleStrategy] Google profile missing email.');
        return done(new UnauthorizedException('Google profile missing email'));
      }

      const userPayload = {
        email: emails[0].value,
        name: name?.givenName && name?.familyName
          ? `${name.givenName} ${name.familyName}`
          : profile.displayName || 'Google User',
        picture: photos && photos.length > 0 ? photos[0].value : undefined,
        googleId: profile.id,
        // accessToken, // Không nên lưu accessToken của Google vào user object lâu dài
      };

      this.logger.log(`[GoogleStrategy] User payload to be processed: ${JSON.stringify(userPayload)}`);
      const result = await this.authService.registerWithGoogle(userPayload);
      this.logger.log(`[GoogleStrategy] AuthService.registerWithGoogle successful. Result: ${JSON.stringify(result)}`);
      // `result` từ `authService.registerWithGoogle` nên là { accessToken, refreshToken, user }
      done(null, result); 
    } catch (error: any) {
      this.logger.error(`[GoogleStrategy] Error in Google validation: ${error.message}`, error.stack);
      if (error instanceof HttpException) {
        done(error);
      } else {
        // Tạo một lỗi chung hơn nếu không phải là HttpException đã biết
        done(new InternalServerErrorException(error.message || 'Error processing Google authentication via strategy'));
      }
    }
  }
}
