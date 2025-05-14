import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards, Req, Logger } from '@nestjs/common';
import { JwtAuthGuard } from '../../../auth/guards/jwt-auth.guard';
import { ProfileService } from '../../services/profile.service';
import { WishlistService } from '../../services/wishlist.service';
import { UpdateProfileDto } from '../../dto/profile.dto';
import { AddressDto } from '../../dto/address.dto';
import { UserDocument } from '../../schemas/user.schema';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';

@ApiTags('User Profile')
@ApiBearerAuth()
@Controller('users/profile')
@UseGuards(JwtAuthGuard)
export class UserProfileController {
  private readonly logger = new Logger(UserProfileController.name);

  constructor(
    private readonly profileService: ProfileService,
    private readonly wishlistService: WishlistService,
  ) {}

  // Lấy thông tin người dùng đăng nhập
  @Get()
  @ApiOperation({ summary: 'Lấy thông tin profile người dùng' })
  async getProfile(@Req() req): Promise<UserDocument> {
    return this.profileService.getProfile(req.user.userId);
  }

  // Cập nhật thông tin người dùng
  @Patch()
  @ApiOperation({ summary: 'Cập nhật thông tin profile người dùng' })
  async updateProfile(
    @Req() req,
    @Body() updateProfileDto: UpdateProfileDto,
  ): Promise<UserDocument> {
    return this.profileService.updateProfile(req.user.userId, updateProfileDto);
  }

  // API quản lý địa chỉ
  @Post('addresses')
  @ApiOperation({ summary: 'Thêm địa chỉ mới' })
  async addAddress(
    @Req() req,
    @Body() addressDto: AddressDto,
  ): Promise<UserDocument> {
    return this.profileService.addAddress(req.user.userId, addressDto);
  }

  @Patch('addresses/:addressId')
  @ApiOperation({ summary: 'Cập nhật địa chỉ' })
  async updateAddress(
    @Req() req,
    @Param('addressId') addressId: string,
    @Body() addressDto: AddressDto,
  ): Promise<UserDocument> {
    return this.profileService.updateAddress(req.user.userId, addressId, addressDto);
  }

  @Delete('addresses/:addressId')
  @ApiOperation({ summary: 'Xóa địa chỉ' })
  async deleteAddress(
    @Req() req,
    @Param('addressId') addressId: string,
  ): Promise<UserDocument> {
    return this.profileService.deleteAddress(req.user.userId, addressId);
  }

  @Patch('addresses/:addressId/default')
  @ApiOperation({ summary: 'Đặt địa chỉ mặc định' })
  async setDefaultAddress(
    @Req() req,
    @Param('addressId') addressId: string,
  ): Promise<UserDocument> {
    return this.profileService.setDefaultAddress(req.user.userId, addressId);
  }

  // API quản lý wishlist
  @Get('wishlist')
  @ApiOperation({ summary: 'Lấy danh sách sản phẩm yêu thích' })
  async getWishlist(@Req() req): Promise<any[]> {
    return this.wishlistService.getWishlist(req.user.userId);
  }

  @Post('wishlist')
  @ApiOperation({ summary: 'Thêm sản phẩm vào danh sách yêu thích' })
  async addToWishlist(
    @Req() req,
    @Body('productId') productId: string,
    @Body('variantId') variantId: string,
  ): Promise<UserDocument> {
    return this.wishlistService.addToWishlist(req.user.userId, productId, variantId);
  }

  @Delete('wishlist/:productId')
  @ApiOperation({ summary: 'Xóa sản phẩm khỏi danh sách yêu thích' })
  async removeFromWishlist(
    @Req() req,
    @Param('productId') productId: string,
    @Body('variantId') variantId: string,
  ): Promise<UserDocument> {
    return this.wishlistService.removeFromWishlist(req.user.userId, productId, variantId);
  }
}
