import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { UsersService } from '../../users/users.service';

@Injectable()
export class JwtAdminStrategy extends PassportStrategy(Strategy, 'jwt-admin') {
  constructor(
    private configService: ConfigService,
    private usersService: UsersService,
  ) {
    const secretKey = configService.get<string>('JWT_SECRET');
    if (!secretKey) {
      throw new Error('JWT_SECRET is not defined in environment variables');
    }
    
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: secretKey,
    });
  }

  async validate(payload: any) {
    const user = await this.usersService.findOne(payload.sub);
    
    if (!user || user.isBanned || user.isDeleted) {
      throw new UnauthorizedException('Người dùng không hợp lệ');
    }
    
    // Kiểm tra xem người dùng có phải là admin hoặc superadmin không
    if (payload.role !== 'admin' && payload.role !== 'superadmin') {
      throw new UnauthorizedException('Không có quyền admin');
    }

    return {
      userId: payload.sub,
      email: payload.email,
      role: payload.role,
    };
  }
} 