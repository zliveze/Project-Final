import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards, Req } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { ProfileService } from '../services/profile.service';
import { UpdateProfileDto } from '../dto/profile.dto';
import { AddressDto } from '../dto/address.dto';
import { UserDocument } from '../schemas/user.schema';

@Controller('users/profile')
@UseGuards(JwtAuthGuard)
export class ProfileController {
  constructor(private readonly profileService: ProfileService) {}

  // Lấy thông tin người dùng đăng nhập
  @Get()
  async getProfile(@Req() req): Promise<UserDocument> {
    return this.profileService.getProfile(req.user._id);
  }

  // Cập nhật thông tin người dùng
  @Patch()
  async updateProfile(
    @Req() req,
    @Body() updateProfileDto: UpdateProfileDto,
  ): Promise<UserDocument> {
    return this.profileService.updateProfile(req.user._id, updateProfileDto);
  }

  // API quản lý địa chỉ
  @Post('addresses')
  async addAddress(
    @Req() req,
    @Body() addressDto: AddressDto,
  ): Promise<UserDocument> {
    return this.profileService.addAddress(req.user._id, addressDto);
  }

  @Patch('addresses/:addressId')
  async updateAddress(
    @Req() req,
    @Param('addressId') addressId: string,
    @Body() addressDto: AddressDto,
  ): Promise<UserDocument> {
    return this.profileService.updateAddress(req.user._id, addressId, addressDto);
  }

  @Delete('addresses/:addressId')
  async deleteAddress(
    @Req() req,
    @Param('addressId') addressId: string,
  ): Promise<UserDocument> {
    return this.profileService.deleteAddress(req.user._id, addressId);
  }

  @Patch('addresses/:addressId/default')
  async setDefaultAddress(
    @Req() req,
    @Param('addressId') addressId: string,
  ): Promise<UserDocument> {
    return this.profileService.setDefaultAddress(req.user._id, addressId);
  }

  // API quản lý wishlist
  @Get('wishlist')
  async getWishlist(@Req() req): Promise<string[]> {
    return this.profileService.getWishlist(req.user._id);
  }

  @Post('wishlist')
  async addToWishlist(
    @Req() req,
    @Body('productId') productId: string,
  ): Promise<UserDocument> {
    return this.profileService.addToWishlist(req.user._id, productId);
  }

  @Delete('wishlist/:productId')
  async removeFromWishlist(
    @Req() req,
    @Param('productId') productId: string,
  ): Promise<UserDocument> {
    return this.profileService.removeFromWishlist(req.user._id, productId);
  }
} 