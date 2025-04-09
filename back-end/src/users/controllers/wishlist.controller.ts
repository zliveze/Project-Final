import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  Req,
  UseGuards,
  NotFoundException,
  BadRequestException
} from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { WishlistService } from '../services/wishlist.service';
import { UserDocument } from '../schemas/user.schema';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { ProductResponseDto } from '../../products/dto';

@ApiTags('Wishlist')
@Controller('users/wishlist')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class WishlistController {
  constructor(private readonly wishlistService: WishlistService) {}

  @Get()
  @ApiOperation({ summary: 'Lấy danh sách sản phẩm yêu thích chi tiết' })
  @ApiResponse({
    status: 200,
    description: 'Danh sách sản phẩm yêu thích với thông tin chi tiết',
    type: [ProductResponseDto]
  })
  async getWishlistItems(@Req() req): Promise<ProductResponseDto[]> {
    try {
      // Check if user ID exists in the request
      if (!req.user) {
        throw new BadRequestException('Không tìm thấy thông tin người dùng');
      }

      // Get user ID from either userId or _id property
      const userId = req.user.userId || req.user._id;
      if (!userId) {
        throw new BadRequestException('Không tìm thấy ID người dùng');
      }

      console.log('Getting wishlist for user ID:', userId);
      return this.wishlistService.getWishlistItems(userId);
    } catch (error) {
      console.error('Error in getWishlistItems controller:', error);
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException('Không thể lấy danh sách yêu thích: ' + error.message);
    }
  }

  @Post('add')
  @ApiOperation({ summary: 'Thêm sản phẩm vào danh sách yêu thích' })
  @ApiResponse({
    status: 200,
    description: 'Sản phẩm đã được thêm vào danh sách yêu thích'
  })
  async addToWishlist(
    @Req() req,
    @Body('productId') productId: string,
  ): Promise<{ message: string; user: UserDocument }> {
    if (!productId) {
      throw new BadRequestException('productId là bắt buộc');
    }

    // Check if user ID exists in the request
    if (!req.user) {
      throw new BadRequestException('Không tìm thấy thông tin người dùng');
    }

    // Get user ID from either userId or _id property
    const userId = req.user.userId || req.user._id;
    if (!userId) {
      throw new BadRequestException('Không tìm thấy ID người dùng');
    }

    try {
      console.log('Adding product to wishlist for user ID:', userId, 'Product ID:', productId);
      const user = await this.wishlistService.addToWishlist(userId, productId);
      return {
        message: 'Đã thêm sản phẩm vào danh sách yêu thích',
        user
      };
    } catch (error) {
      console.error('Error in addToWishlist controller:', error);
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException('Không thể thêm vào danh sách yêu thích: ' + error.message);
    }
  }

  @Delete('remove/:productId')
  @ApiOperation({ summary: 'Xóa sản phẩm khỏi danh sách yêu thích' })
  @ApiResponse({
    status: 200,
    description: 'Sản phẩm đã được xóa khỏi danh sách yêu thích'
  })
  async removeFromWishlist(
    @Req() req,
    @Param('productId') productId: string,
  ): Promise<{ message: string; user: UserDocument }> {
    // Check if user ID exists in the request
    if (!req.user) {
      throw new BadRequestException('Không tìm thấy thông tin người dùng');
    }

    // Get user ID from either userId or _id property
    const userId = req.user.userId || req.user._id;
    if (!userId) {
      throw new BadRequestException('Không tìm thấy ID người dùng');
    }

    try {
      console.log('Removing product from wishlist for user ID:', userId, 'Product ID:', productId);
      const user = await this.wishlistService.removeFromWishlist(userId, productId);
      return {
        message: 'Đã xóa sản phẩm khỏi danh sách yêu thích',
        user
      };
    } catch (error) {
      console.error('Error in removeFromWishlist controller:', error);
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException('Không thể xóa khỏi danh sách yêu thích: ' + error.message);
    }
  }

  @Delete('clear')
  @ApiOperation({ summary: 'Xóa toàn bộ danh sách yêu thích' })
  @ApiResponse({
    status: 200,
    description: 'Danh sách yêu thích đã được xóa'
  })
  async clearWishlist(@Req() req): Promise<{ message: string; user: UserDocument }> {
    // Check if user ID exists in the request
    if (!req.user) {
      throw new BadRequestException('Không tìm thấy thông tin người dùng');
    }

    // Get user ID from either userId or _id property
    const userId = req.user.userId || req.user._id;
    if (!userId) {
      throw new BadRequestException('Không tìm thấy ID người dùng');
    }

    try {
      console.log('Clearing wishlist for user ID:', userId);
      const user = await this.wishlistService.clearWishlist(userId);
      return {
        message: 'Đã xóa toàn bộ danh sách yêu thích',
        user
      };
    } catch (error) {
      console.error('Error in clearWishlist controller:', error);
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException('Không thể xóa danh sách yêu thích: ' + error.message);
    }
  }
}
