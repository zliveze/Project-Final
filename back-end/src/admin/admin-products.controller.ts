import { Body, Controller, Get, HttpCode, Param, Post, Query, UseGuards, Put, Delete } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAdminAuthGuard } from '../auth/guards/jwt-admin-auth.guard';
import { CurrentUser } from '../common/decorators/user.decorator';
import { AdminService } from './admin.service';

@ApiTags('Admin Products')
@Controller('admin/products')
export class AdminProductsController {
  constructor(private readonly adminService: AdminService) {}

  @UseGuards(JwtAdminAuthGuard)
  @Post('check-promotions')
  @HttpCode(200)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Kiểm tra sản phẩm trong Event và Campaign (Admin only)' })
  @ApiResponse({ status: 200, description: 'Trả về thông tin các sản phẩm trong Event và Campaign' })
  @ApiResponse({ status: 401, description: 'Không có quyền truy cập' })
  async checkProductsInPromotions(
    @Body() body: { productIds: string[] },
    @CurrentUser() user: any,
  ) {
    if (!user || (user.role !== 'admin' && user.role !== 'superadmin')) {
      return {
        success: false,
        message: 'Không có quyền truy cập'
      };
    }
    
    try {
      const results = await this.adminService.checkProductsInPromotions(body.productIds);
      return results; // Trả về trực tiếp kết quả dạng mảng
    } catch (error) {
      console.error('Lỗi khi kiểm tra sản phẩm trong promotions:', error);
      return [];
    }
  }
} 