import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '../../common/decorators/public.decorator';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext) {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // Nếu endpoint được đánh dấu là public, không cần xác thực
    if (isPublic) {
      return true;
    }

    // Nếu không phải public, tiếp tục với xác thực JWT
    return super.canActivate(context);
  }
}

// Export mặc định để đảm bảo module có thể được import bởi các file khác
export default JwtAuthGuard; 