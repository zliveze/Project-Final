import { Injectable, Logger } from '@nestjs/common';
import { PassportSerializer } from '@nestjs/passport';
import { UsersService } from '../users/users.service';
import { UserDocument } from '../users/schemas/user.schema';

@Injectable()
export class SessionSerializer extends PassportSerializer {
  private readonly logger = new Logger(SessionSerializer.name);

  constructor(private readonly usersService: UsersService) {
    super();
  }

  serializeUser(user: any, done: (err: Error | null, id?: any) => void): void {
    // Đối với Google OAuth, 'user' ở đây là object { accessToken, refreshToken, user: actualUserObject }
    // Chúng ta chỉ muốn serialize actualUserObject._id
    const actualUser = user.user || user; // Xử lý cả trường hợp user trực tiếp hoặc user lồng trong object
    
    if (!actualUser || !actualUser._id) {
      this.logger.error('SessionSerializer - serializeUser: User or User ID is missing.', JSON.stringify(user));
      return done(new Error('User or User ID is missing for serialization.'), null);
    }
    
    this.logger.log(`SessionSerializer - Serializing user ID: ${actualUser._id}`);
    done(null, actualUser._id.toString()); // Chỉ lưu ID vào session
  }

  async deserializeUser(userId: string, done: (err: Error | null, payload?: UserDocument | null) => void): Promise<void> {
    this.logger.log(`SessionSerializer - Deserializing user ID: ${userId}`);
    try {
      // Sửa findById thành findOne vì UsersService có findOne(id)
      const user = await this.usersService.findOne(userId); 
      if (!user) {
        this.logger.warn(`SessionSerializer - deserializeUser: User not found with ID: ${userId}`);
        return done(null, null); // Hoặc new Error('User not found') tùy theo logic mong muốn
      }
      // Trả về đối tượng user đầy đủ (nhưng không có password hay các thông tin nhạy cảm khác nếu cần)
      // UsersService.findById nên trả về user đã được chọn lọc các trường cần thiết
      done(null, user);
    } catch (error: any) {
      this.logger.error(`SessionSerializer - deserializeUser: Error finding user: ${error.message}`, error.stack);
      done(error, null);
    }
  }
}
