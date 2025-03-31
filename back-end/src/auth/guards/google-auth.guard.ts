import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class GoogleAuthGuard extends AuthGuard('google') {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Kích hoạt xác thực Passport
    const result = (await super.canActivate(context)) as boolean;
    
    // Lấy request từ context
    const request = context.switchToHttp().getRequest();
    
    // Gọi phương thức logIn của Passport để thiết lập session
    await super.logIn(request);
    
    return result;
  }
} 