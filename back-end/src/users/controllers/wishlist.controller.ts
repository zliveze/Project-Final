import { Controller, Post, Delete, Body, UseGuards, Req, Get, BadRequestException } from '@nestjs/common'; // Added BadRequestException
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { WishlistService } from '../services/wishlist.service';
import { AddToWishlistDto, RemoveFromWishlistDto } from '../dto/add-to-wishlist.dto';
import { UserDocument } from '../schemas/user.schema'; // Import UserDocument if needed for return type
import { AuthenticatedRequest } from '../../common/interfaces/authenticated-request.interface'; // Interface for request with user

@Controller('profile/wishlist') // Changed route to /profile/wishlist for clarity
@UseGuards(JwtAuthGuard) // Apply auth guard to the whole controller
export class WishlistController {
  constructor(private readonly wishlistService: WishlistService) {}

  @Get()
  async getWishlist(@Req() req: AuthenticatedRequest): Promise<any[]> { // Return type updated
    // Assuming JWT payload has 'userId' field after validation
    const userId = req.user.userId;
    if (!userId) {
        throw new BadRequestException('Không tìm thấy thông tin người dùng trong yêu cầu.');
    }
    return this.wishlistService.getWishlist(userId);
  }

  @Post()
  async addToWishlist(
    @Req() req: AuthenticatedRequest,
    @Body() addToWishlistDto: AddToWishlistDto,
  ): Promise<UserDocument> { // Return UserDocument or a simpler success message/object
    console.log('WishlistController.addToWishlist called with:', addToWishlistDto);

    // Validate inputs
    if (!addToWishlistDto.productId) {
      console.error('productId is missing in request body');
      throw new BadRequestException('productId is required');
    }

    // variantId is now optional for products without variants

    const userId = req.user.userId;
    if (!userId) {
        throw new BadRequestException('Không tìm thấy thông tin người dùng trong yêu cầu.');
    }

    console.log('Calling wishlistService.addToWishlist with:', { userId, productId: addToWishlistDto.productId, variantId: addToWishlistDto.variantId });

    try {
      // Correctly passing 3 arguments
      const result = await this.wishlistService.addToWishlist(userId, addToWishlistDto.productId, addToWishlistDto.variantId);
      console.log('Wishlist item added successfully');
      return result;
    } catch (error) {
      console.error('Error in WishlistController.addToWishlist:', error);
      throw error;
    }
  }

  // Using DELETE with body is sometimes debated. Query parameters might be an alternative.
  // Example with query params: @Delete() async removeFromWishlist(@Req() req: AuthenticatedRequest, @Query('productId') productId: string, @Query('variantId') variantId: string)
  @Delete()
  async removeFromWishlist(
    @Req() req: AuthenticatedRequest,
    @Body() removeFromWishlistDto: RemoveFromWishlistDto, // Keep using body for consistency for now
  ): Promise<UserDocument> { // Return UserDocument or a simpler success message/object
    const userId = req.user.userId;
     if (!userId) {
        throw new BadRequestException('Không tìm thấy thông tin người dùng trong yêu cầu.');
    }
    // Correctly passing 3 arguments
    return this.wishlistService.removeFromWishlist(userId, removeFromWishlistDto.productId, removeFromWishlistDto.variantId);
  }
}
