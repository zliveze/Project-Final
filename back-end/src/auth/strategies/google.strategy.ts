import { Injectable, Logger } from '@nestjs/common';
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
    done: (err: Error | null, user: any, info?: any) => void,
  ): Promise<void> {
    try {
      this.logger.log(`Validating Google profile for: ${profile.displayName}`);
      
      const { name, emails, photos } = profile;
      
      if (!emails || emails.length === 0) {
        return done(new Error('Google profile missing email'), undefined);
      }
      
      const user = {
        email: emails[0].value,
        name: name?.givenName && name?.familyName 
          ? `${name.givenName} ${name.familyName}`
          : profile.displayName || 'Google User',
        picture: photos && photos.length > 0 ? photos[0].value : undefined,
        googleId: profile.id,
        accessToken,
      };

      // Sử dụng service để đăng ký/đăng nhập người dùng
      const result = await this.authService.registerWithGoogle(user);
      done(null, result);
    } catch (error) {
      this.logger.error(`Error in Google validation: ${error.message}`);
      done(error as Error, undefined);
    }
  }
} 