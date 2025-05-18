import { Injectable, BadRequestException, UnauthorizedException, NotFoundException, Inject, forwardRef } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { User, UserDocument } from '../users/schemas/user.schema';
import { CreateAdminDto, UpdateAdminProfileDto } from './dto/admin-auth.dto';
import { UsersService } from '../users/users.service';
import { CampaignsService } from '../campaigns/campaigns.service';
import { EventsService } from '../events/events.service';

@Injectable()
export class AdminService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private usersService: UsersService,
    private jwtService: JwtService,
    private configService: ConfigService,
    @Inject(forwardRef(() => EventsService)) private readonly eventsService: EventsService,
    @Inject(forwardRef(() => CampaignsService)) private readonly campaignsService: CampaignsService,
  ) {
    // Tạo Super Admin khi khởi động app
    this.createSuperAdmin();
  }

  private async createSuperAdmin() {
    try {
      const email = this.configService.get<string>('SUPER_ADMIN_EMAIL');
      
      if (!email) {
        console.error('Thiếu SUPER_ADMIN_EMAIL trong file .env');
        return;
      }
      
      const existingSuperAdmin = await this.usersService.findByEmail(email);

      if (!existingSuperAdmin) {
        const name = this.configService.get<string>('SUPER_ADMIN_NAME');
        const phone = this.configService.get<string>('SUPER_ADMIN_PHONE');
        const password = this.configService.get<string>('SUPER_ADMIN_PASSWORD');
        
        if (!name || !phone || !password) {
          console.error('Thiếu thông tin SUPER_ADMIN trong file .env');
          return;
        }
        
        // Mật khẩu sẽ được hash bởi pre-save middleware trong UserSchema
        // Không cần phải hash trước khi tạo
        const superAdmin = {
          name,
          email,
          phone,
          password, // Middleware pre-save sẽ tự động hash password
          role: 'superadmin',
          isVerified: true,
          isActive: true,
        };

        const createdSuperAdmin = await this.usersService.create(superAdmin as any);
        console.log('Super Admin đã được tạo thành công:');
      } else {
        console.log('Super Admin đã tồn tại trong hệ thống');
      }
    } catch (error) {
      console.error('Lỗi khi tạo Super Admin:', error);
    }
  }

  async validateAdmin(email: string, password: string): Promise<any> {
    const user = await this.usersService.findByEmail(email);
    
    if (!user) {
      return null;
    }

    if (user.role !== 'admin' && user.role !== 'superadmin') {
      return null;
    }

    if (user.isBanned || user.isDeleted) {
      throw new UnauthorizedException('Tài khoản không hợp lệ');
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
    };
  }

  async login(user: any) {
    const payload = { email: user.email, sub: user._id, role: user.role };
    
    // Admin token với thời gian ngắn hơn
    const accessToken = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('JWT_SECRET'),
      expiresIn: this.configService.get<string>('JWT_ADMIN_EXPIRATION'),
    });

    const refreshToken = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      expiresIn: this.configService.get<string>('JWT_ADMIN_REFRESH_EXPIRATION'),
    });

    // Lưu refresh token vào database
    if (user._id) {
      await this.usersService.setRefreshToken(user._id.toString(), refreshToken);
    }

    return {
      accessToken,
      refreshToken,
      user: {
        _id: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    };
  }

  async refreshToken(userId: string, refreshToken: string) {
    const user = await this.usersService.findOne(userId);
    
    if (!user || user.refreshToken !== refreshToken || (user.role !== 'admin' && user.role !== 'superadmin')) {
      throw new UnauthorizedException('Refresh token không hợp lệ');
    }

    const payload = { email: user.email, sub: user._id, role: user.role };
    
    const accessToken = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('JWT_SECRET'),
      expiresIn: this.configService.get<string>('JWT_ADMIN_EXPIRATION'),
    });

    return {
      accessToken,
    };
  }

  async logout(userId: string): Promise<void> {
    await this.usersService.setRefreshToken(userId, null);
  }

  async createAdmin(createAdminDto: CreateAdminDto, creatorRole: string): Promise<UserDocument> {
    // Chỉ superadmin mới có thể tạo tài khoản admin khác
    if (creatorRole !== 'superadmin') {
      throw new UnauthorizedException('Bạn không có quyền tạo tài khoản admin');
    }

    const { email } = createAdminDto;
    
    const existingUser = await this.usersService.findByEmail(email);
    
    if (existingUser) {
      throw new BadRequestException('Email đã được sử dụng');
    }

    const adminUser = {
      ...createAdminDto,
      role: 'admin',
      isVerified: true,
      isActive: true,
    };

    return this.usersService.create(adminUser);
  }

  async getAllAdmins(): Promise<UserDocument[]> {
    return this.userModel.find({ 
      isDeleted: false 
    }).exec();
  }

  async removeAdmin(adminId: string, requestingUserRole: string): Promise<void> {
    const admin = await this.usersService.findOne(adminId);
    
    // Kiểm tra nếu đang cố gắng xóa SuperAdmin
    if (admin.role === 'superadmin') {
      throw new UnauthorizedException('Không thể xóa tài khoản Super Admin');
    }
    
    // Chỉ SuperAdmin mới có quyền xóa Admin
    if (requestingUserRole !== 'superadmin') {
      throw new UnauthorizedException('Bạn không có quyền xóa tài khoản admin');
    }
    
    await this.usersService.remove(adminId);
  }

  async getAdminProfile(userId: string) {
    const admin = await this.usersService.findOne(userId);
    
    if (!admin || (admin.role !== 'admin' && admin.role !== 'superadmin')) {
      return null;
    }
    
    return {
      _id: admin._id,
      name: admin.name,
      email: admin.email,
      role: admin.role,
      phone: admin.phone,
    };
  }

  async updateAdminProfile(userId: string, updateProfileDto: UpdateAdminProfileDto) {
    console.log('updateAdminProfile called with:', { userId, updateProfileDto });
    
    const admin = await this.usersService.findOne(userId);
    console.log('Admin found:', admin ? { id: admin._id, email: admin.email, role: admin.role } : 'Not found');
    
    if (!admin || (admin.role !== 'admin' && admin.role !== 'superadmin')) {
      throw new UnauthorizedException('Không có quyền truy cập');
    }
    
    // Cập nhật thông tin admin
    try {
      const updatedAdmin = await this.usersService.update(userId, {
        name: updateProfileDto.name,
        email: updateProfileDto.email,
        phone: updateProfileDto.phone,
      });
      
      console.log('Admin updated successfully:', { 
        id: updatedAdmin._id, 
        name: updatedAdmin.name,
        email: updatedAdmin.email
      });
      
      return {
        _id: updatedAdmin._id,
        name: updatedAdmin.name,
        email: updatedAdmin.email,
        role: updatedAdmin.role,
        phone: updatedAdmin.phone,
      };
    } catch (error) {
      console.error('Error updating admin profile:', error);
      throw error;
    }
  }

  async changeAdminPassword(userId: string, currentPassword: string, newPassword: string) {
    try {
      console.log('Đang xử lý đổi mật khẩu cho admin:', userId);
      
      const admin = await this.usersService.findOne(userId);
      
      if (!admin || (admin.role !== 'admin' && admin.role !== 'superadmin')) {
        throw new UnauthorizedException('Không có quyền truy cập');
      }
      
      // Kiểm tra mật khẩu hiện tại
      const isValidPassword = await bcrypt.compare(currentPassword, admin.password);
      
      if (!isValidPassword) {
        return {
          success: false,
          message: 'Mật khẩu hiện tại không đúng',
        };
      }
      
      // Kiểm tra mật khẩu mới phải khác mật khẩu cũ
      const isSamePassword = await bcrypt.compare(newPassword, admin.password);
      if (isSamePassword) {
        return {
          success: false,
          message: 'Mật khẩu mới không được trùng với mật khẩu hiện tại',
        };
      }
      
      // Kiểm tra độ dài mật khẩu mới
      if (newPassword.length < 6) {
        return {
          success: false,
          message: 'Mật khẩu mới phải có ít nhất 6 ký tự',
        };
      }
      
      // Hash mật khẩu
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(newPassword, salt);
      
      // Sử dụng phương thức resetUserPassword thay vì update trực tiếp
      // Phương thức này được thiết kế đặc biệt cho việc đặt lại mật khẩu
      await this.usersService.resetUserPassword(userId, hashedPassword);
      
      // Kiểm tra lại mật khẩu mới sau khi lưu
      const updatedAdmin = await this.usersService.findOne(userId);
      
      // Kiểm tra ngay mật khẩu mới sau khi cập nhật để xác nhận
      const verifyNewPassword = await bcrypt.compare(newPassword, updatedAdmin.password);
      
      if (!verifyNewPassword) {
        console.error('Lỗi: Mật khẩu mới không thể xác thực sau khi lưu!');
        return {
          success: false,
          message: 'Lỗi cập nhật mật khẩu, không thể xác thực mật khẩu mới',
        };
      }
      
      console.log('Đã cập nhật mật khẩu thành công cho admin:', userId);
      
      return {
        success: true,
        message: 'Cập nhật mật khẩu thành công',
      };
    } catch (error) {
      console.error('Lỗi khi đổi mật khẩu admin:', error);
      throw error;
    }
  }

  // Phương thức kiểm tra sản phẩm trong Event và Campaign
  async checkProductsInPromotions(productIds: string[]): Promise<any[]> {
    if (!productIds || productIds.length === 0) {
      throw new BadRequestException('Danh sách productIds không được trống');
    }

    const result: Array<{
      productId: string;
      inEvent: boolean;
      eventId?: string;
      eventName?: string;
      inCampaign: boolean;
      campaignId?: string;
      campaignName?: string;
    }> = [];

    // Lấy tất cả Event đang hoạt động
    const activeEvents = await this.eventsService.findActive();
    
    // Lấy tất cả Campaign đang hoạt động
    const activeCampaigns = await this.campaignsService.getActiveCampaigns();

    // Tạo map để lưu thông tin Event và Campaign chứa sản phẩm
    const productEventMap = new Map<string, { eventId: string; eventName: string }>();
    const productCampaignMap = new Map<string, { campaignId: string; campaignName: string }>();

    // Kiểm tra sản phẩm trong Event
    activeEvents.forEach(event => {
      if (event && event.products) {
        event.products.forEach(product => {
          if (product && product.productId) {
            const productIdStr = product.productId.toString();
            if (event._id) {
              productEventMap.set(productIdStr, {
                eventId: event._id.toString(),
                eventName: event.title || 'Không có tên'
              });
            }
          }
        });
      }
    });

    // Kiểm tra sản phẩm trong Campaign
    activeCampaigns.forEach(campaign => {
      if (campaign && campaign.products) {
        campaign.products.forEach(product => {
          if (product && product.productId) {
            const productIdStr = product.productId.toString();
            if (campaign._id) {
              productCampaignMap.set(productIdStr, {
                campaignId: campaign._id.toString(),
                campaignName: campaign.title || 'Không có tên'
              });
            }
          }
        });
      }
    });

    // Kiểm tra từng sản phẩm
    for (const productId of productIds) {
      const inEvent = productEventMap.has(productId);
      const inCampaign = productCampaignMap.has(productId);
      
      const productCheck: {
        productId: string;
        inEvent: boolean;
        eventId?: string;
        eventName?: string;
        inCampaign: boolean;
        campaignId?: string;
        campaignName?: string;
      } = {
        productId,
        inEvent,
        inCampaign
      };
      
      // Thêm thông tin Event nếu sản phẩm thuộc về Event
      if (inEvent) {
        const eventInfo = productEventMap.get(productId);
        if (eventInfo) {
          productCheck.eventId = eventInfo.eventId;
          productCheck.eventName = eventInfo.eventName;
        }
      }
      
      // Thêm thông tin Campaign nếu sản phẩm thuộc về Campaign
      if (inCampaign) {
        const campaignInfo = productCampaignMap.get(productId);
        if (campaignInfo) {
          productCheck.campaignId = campaignInfo.campaignId;
          productCheck.campaignName = campaignInfo.campaignName;
        }
      }
      
      result.push(productCheck);
    }

    return result;
  }
} 