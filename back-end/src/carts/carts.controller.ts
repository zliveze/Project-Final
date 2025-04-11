// back-end/src/carts/carts.controller.ts
import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  Req,
  HttpCode,
  HttpStatus,
  // ParseUUIDPipe, // Or custom MongoIdPipe if preferred - Using custom below
} from '@nestjs/common';
import { CartsService } from './carts.service';
import { AddToCartDto } from './dto/add-to-cart.dto';
import { UpdateCartItemDto } from './dto/update-cart-item.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'; // Assuming JWT guard path
import { AuthenticatedRequest } from '../common/interfaces/authenticated-request.interface'; // Interface to get user from req
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { Cart } from './schemas/cart.schema'; // Import Cart schema for response type documentation
import { MongoIdValidationPipe } from '../common/pipes/mongo-id-validation.pipe.js'; // Add .js extension

@ApiTags('Carts (User)') // Group endpoints under 'Carts (User)' tag in Swagger
@ApiBearerAuth() // Indicate that endpoints require Bearer token authentication
@UseGuards(JwtAuthGuard) // Protect all routes in this controller with JWT authentication
@Controller('carts') // Base path for cart endpoints: /carts
export class CartsController {
  constructor(private readonly cartsService: CartsService) {}

  @Get()
  @ApiOperation({ summary: 'Lấy giỏ hàng của người dùng hiện tại' })
  @ApiResponse({ status: 200, description: 'Trả về giỏ hàng của người dùng.', type: Cart }) // Document response type
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  async getCart(@Req() req: AuthenticatedRequest): Promise<Cart> {
    // req.user should contain the authenticated user payload (including userId)
    const userId = req.user.userId;
    return this.cartsService.getCart(userId);
  }

  @Post('items')
  @ApiOperation({ summary: 'Thêm một sản phẩm vào giỏ hàng' })
  @ApiResponse({ status: 201, description: 'Sản phẩm đã được thêm vào giỏ hàng.', type: Cart })
  @ApiResponse({ status: 400, description: 'Dữ liệu không hợp lệ hoặc không đủ hàng tồn kho.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 404, description: 'Sản phẩm hoặc biến thể không tồn tại.' })
  @HttpCode(HttpStatus.CREATED) // Set response code to 201 Created
  async addItemToCart(
    @Req() req: AuthenticatedRequest,
    @Body() addToCartDto: AddToCartDto,
  ): Promise<Cart> {
    // --- ADD LOGGING ---
    console.log(`[CartsController] addItemToCart called with DTO:`, addToCartDto);
    console.log(`[CartsController] User ID from request:`, req.user?.userId);
    // --- END LOGGING ---
    const userId = req.user.userId;
    // --- ADD LOGGING BEFORE SERVICE CALL ---
    console.log(`[CartsController] Calling cartsService.addItemToCart for userId: ${userId}`);
    // --- END LOGGING ---
    return this.cartsService.addItemToCart(userId, addToCartDto);
  }

  @Patch('items/:variantId')
  @ApiOperation({ summary: 'Cập nhật số lượng của một sản phẩm trong giỏ hàng' })
  @ApiParam({ name: 'variantId', description: 'ID của biến thể sản phẩm cần cập nhật', type: String })
  @ApiResponse({ status: 200, description: 'Số lượng sản phẩm đã được cập nhật.', type: Cart })
  @ApiResponse({ status: 400, description: 'Dữ liệu không hợp lệ hoặc không đủ hàng tồn kho.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 404, description: 'Giỏ hàng hoặc sản phẩm không tồn tại trong giỏ hàng.' })
  async updateCartItem(
    @Req() req: AuthenticatedRequest,
    @Param('variantId', MongoIdValidationPipe) variantId: string, // Use custom pipe
    @Body() updateCartItemDto: UpdateCartItemDto,
  ): Promise<Cart> {
    const userId = req.user.userId;
    return this.cartsService.updateCartItem(userId, variantId, updateCartItemDto);
  }

  @Delete('items/:variantId')
  @ApiOperation({ summary: 'Xóa một sản phẩm khỏi giỏ hàng' })
  @ApiParam({ name: 'variantId', description: 'ID của biến thể sản phẩm cần xóa', type: String })
  @ApiResponse({ status: 200, description: 'Sản phẩm đã được xóa khỏi giỏ hàng.', type: Cart })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 404, description: 'Giỏ hàng hoặc sản phẩm không tồn tại trong giỏ hàng.' })
  @HttpCode(HttpStatus.OK) // Can also use 204 No Content if not returning the cart
  async removeItemFromCart(
    @Req() req: AuthenticatedRequest,
    @Param('variantId', MongoIdValidationPipe) variantId: string, // Use custom pipe
  ): Promise<Cart> {
    const userId = req.user.userId;
    return this.cartsService.removeItemFromCart(userId, variantId);
  }

  @Delete()
  @ApiOperation({ summary: 'Xóa toàn bộ giỏ hàng của người dùng' })
  @ApiResponse({ status: 200, description: 'Giỏ hàng đã được xóa.', type: Cart }) // Or 204 No Content
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @HttpCode(HttpStatus.OK) // Or HttpStatus.NO_CONTENT
  async clearCart(@Req() req: AuthenticatedRequest): Promise<Cart> {
    const userId = req.user.userId;
    return this.cartsService.clearCart(userId);
  }
}
