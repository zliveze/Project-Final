import { Controller, Post, Body, UseGuards, Req, Get, Patch, Param, Delete } from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard'; // Import JwtAuthGuard
import { ProfileService } from '../../services/profile.service'; // Corrected path
import { AddressDto } from '../../dto/address.dto'; // Corrected path
import { UpdateProfileDto } from '../../dto/profile.dto'; // Corrected path
import { Request } from 'express'; // Import Request for typing
import { UserDocument } from '../../schemas/user.schema'; // Corrected path

// Helper interface for Request object after authentication
interface AuthenticatedRequest extends Request {
  user: {
    userId: string; // Hoặc _id tùy thuộc vào payload của JWT và cách guard xử lý
  };
}

@Controller('profile')
@UseGuards(JwtAuthGuard) // Áp dụng guard cho tất cả các route trong controller này
export class ProfileController {
  constructor(private readonly profileService: ProfileService) {}

  // GET /profile - Lấy thông tin profile người dùng hiện tại
  @Get()
  async getProfile(@Req() req: AuthenticatedRequest): Promise<UserDocument> {
    const userId = req.user.userId;
    return this.profileService.getProfile(userId);
  }

  // PATCH /profile - Cập nhật thông tin profile người dùng hiện tại
  @Patch()
  async updateProfile(
    @Req() req: AuthenticatedRequest,
    @Body() updateProfileDto: UpdateProfileDto,
  ): Promise<UserDocument> {
    const userId = req.user.userId;
    return this.profileService.updateProfile(userId, updateProfileDto);
  }

  // POST /profile/addresses - Thêm địa chỉ mới
  @Post('addresses')
  async addAddress(
    @Req() req: AuthenticatedRequest,
    @Body() addressDto: AddressDto,
  ): Promise<UserDocument> {
    const userId = req.user.userId;
    // Loại bỏ addressId nếu client gửi lên (vì backend sẽ tự tạo _id)
    const { addressId, ...newAddressData } = addressDto;
    return this.profileService.addAddress(userId, newAddressData as AddressDto);
  }

  // PATCH /profile/addresses/:addressId - Cập nhật địa chỉ
  @Patch('addresses/:addressId')
  async updateAddress(
    @Req() req: AuthenticatedRequest,
    @Param('addressId') addressId: string,
    @Body() addressDto: AddressDto,
  ): Promise<UserDocument> {
    const userId = req.user.userId;
    // Loại bỏ addressId khỏi body nếu có, vì nó đã có trong param
    const { addressId: bodyAddressId, ...updateData } = addressDto;
    return this.profileService.updateAddress(userId, addressId, updateData as AddressDto);
  }

  // DELETE /profile/addresses/:addressId - Xóa địa chỉ
  @Delete('addresses/:addressId')
  async deleteAddress(
    @Req() req: AuthenticatedRequest,
    @Param('addressId') addressId: string,
  ): Promise<UserDocument> {
    const userId = req.user.userId;
    return this.profileService.deleteAddress(userId, addressId);
  }

  // POST /profile/addresses/:addressId/default - Đặt địa chỉ làm mặc định
  @Post('addresses/:addressId/default')
  async setDefaultAddress(
    @Req() req: AuthenticatedRequest,
    @Param('addressId') addressId: string,
  ): Promise<UserDocument> {
    const userId = req.user.userId;
    return this.profileService.setDefaultAddress(userId, addressId);
  }

  // GET /profile/wishlist - Lấy wishlist
  @Get('wishlist')
  async getWishlist(@Req() req: AuthenticatedRequest): Promise<string[]> {
    const userId = req.user.userId;
    return this.profileService.getWishlist(userId);
  }

  // POST /profile/wishlist/:productId - Thêm vào wishlist
  @Post('wishlist/:productId')
  async addToWishlist(
    @Req() req: AuthenticatedRequest,
    @Param('productId') productId: string,
  ): Promise<UserDocument> {
    const userId = req.user.userId;
    return this.profileService.addToWishlist(userId, productId);
  }

  // DELETE /profile/wishlist/:productId - Xóa khỏi wishlist
  @Delete('wishlist/:productId')
  async removeFromWishlist(
    @Req() req: AuthenticatedRequest,
    @Param('productId') productId: string,
  ): Promise<UserDocument> {
    const userId = req.user.userId;
    return this.profileService.removeFromWishlist(userId, productId);
  }
}
