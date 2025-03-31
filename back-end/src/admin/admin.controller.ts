import { Body, Controller, Delete, Get, HttpCode, Param, Post, UseGuards, Put, UnauthorizedException } from '@nestjs/common';
import { AdminService } from './admin.service';
import { AdminLoginDto, AdminRefreshTokenDto, CreateAdminDto, UpdateAdminProfileDto, ChangePasswordDto } from './dto/admin-auth.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { JwtRefreshAuthGuard } from '../auth/guards/jwt-refresh-auth.guard';
import { CurrentUser } from '../common/decorators/user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { User, UserDocument } from '../users/schemas/user.schema';

@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Post('auth/login')
  @HttpCode(200)
  async login(@Body() adminLoginDto: AdminLoginDto) {
    const user = await this.adminService.validateAdmin(
      adminLoginDto.email,
      adminLoginDto.password,
    );

    if (!user) {
      return { 
        success: false,
        message: 'Email hoặc mật khẩu không đúng' 
      };
    }

    return this.adminService.login(user);
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  @HttpCode(200)
  async getProfile(@CurrentUser() user: any) {
    if (!user || (user.role !== 'admin' && user.role !== 'superadmin')) {
      return null;
    }
    const adminProfile = await this.adminService.getAdminProfile(user.userId);
    return adminProfile;
  }

  @UseGuards(JwtRefreshAuthGuard)
  @Post('auth/refresh')
  @HttpCode(200)
  async refresh(@CurrentUser() user: any, @Body() refreshTokenDto: AdminRefreshTokenDto) {
    return this.adminService.refreshToken(user.userId, refreshTokenDto.refreshToken);
  }

  @UseGuards(JwtAuthGuard)
  @Post('auth/logout')
  @HttpCode(200)
  async logout(@CurrentUser('userId') userId: string) {
    await this.adminService.logout(userId);
    return { message: 'Đăng xuất thành công' };
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('superadmin')
  @Post('users')
  async createAdmin(
    @Body() createAdminDto: CreateAdminDto,
    @CurrentUser('role') role: string,
  ): Promise<UserDocument> {
    return this.adminService.createAdmin(createAdminDto, role);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'superadmin')
  @Get('users')
  async getAllAdmins(): Promise<UserDocument[]> {
    return this.adminService.getAllAdmins();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('superadmin')
  @Delete('users/:id')
  async removeAdmin(
    @Param('id') id: string,
    @CurrentUser('role') role: string,
  ): Promise<{ message: string }> {
    await this.adminService.removeAdmin(id, role);
    return { message: 'Admin đã được xóa thành công' };
  }

  @UseGuards(JwtAuthGuard)
  @Put('profile')
  @HttpCode(200)
  async updateProfile(
    @CurrentUser() user: any,
    @Body() updateProfileDto: UpdateAdminProfileDto,
  ) {
    if (!user || (user.role !== 'admin' && user.role !== 'superadmin')) {
      return {
        success: false,
        message: 'Unauthorized'
      };
    }
    
    const updatedAdmin = await this.adminService.updateAdminProfile(user.userId, updateProfileDto);
    return {
      success: true,
      message: 'Cập nhật thông tin thành công',
      user: updatedAdmin
    };
  }

  @UseGuards(JwtAuthGuard)
  @Put('profile/change-password')
  @HttpCode(200)
  async changePassword(
    @CurrentUser() user: any,
    @Body() changePasswordDto: ChangePasswordDto,
  ) {
    try {
      if (!user || (user.role !== 'admin' && user.role !== 'superadmin')) {
        return {
          success: false,
          message: 'Unauthorized'
        };
      }
      
      const result = await this.adminService.changeAdminPassword(
        user.userId, 
        changePasswordDto.currentPassword,
        changePasswordDto.newPassword
      );
      
      return result;
    } catch (error) {
      console.error('Lỗi xử lý đổi mật khẩu admin:', error);
      
      if (error instanceof UnauthorizedException) {
        return {
          success: false,
          message: error.message || 'Không có quyền truy cập'
        };
      }
      
      return {
        success: false,
        message: 'Đã xảy ra lỗi khi cập nhật mật khẩu'
      };
    }
  }
} 