import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  HttpCode,
  NotFoundException,
  BadRequestException,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { ReviewsService } from '../reviews/reviews.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/user.decorator';
import { Review, ReviewDocument } from '../reviews/schemas/review.schema';
import { Document, Types } from 'mongoose';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiQuery } from '@nestjs/swagger';

@ApiTags('Admin/Reviews')
@Controller('admin/reviews')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin', 'superadmin')
@ApiBearerAuth()
export class AdminReviewsController {
  private readonly logger = new Logger(AdminReviewsController.name);

  constructor(private readonly reviewsService: ReviewsService) {}

  // Lấy tất cả đánh giá với phân trang và lọc
  @Get()
  @ApiOperation({ summary: 'Lấy danh sách đánh giá (Admin)' })
  @ApiResponse({ status: 200, description: 'Trả về danh sách đánh giá có phân trang' })
  @ApiQuery({ name: 'page', required: false, description: 'Trang hiện tại', type: Number })
  @ApiQuery({ name: 'limit', required: false, description: 'Số lượng đánh giá mỗi trang', type: Number })
  @ApiQuery({ name: 'status', required: false, description: 'Trạng thái đánh giá (pending, approved, rejected)', type: String })
  @ApiQuery({ name: 'rating', required: false, description: 'Đánh giá sao (1-5)', type: Number })
  @ApiQuery({ name: 'userId', required: false, description: 'ID của người dùng', type: String })
  async findAll(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('status') status?: string,
    @Query('rating') rating?: number,
    @Query('userId') userId?: string,
  ) {
    try {
      const { reviews, totalItems, totalPages } = await this.reviewsService.findAll(
        page,
        limit,
        status,
        rating ? parseInt(rating.toString()) : undefined,
        userId
      );

      return {
        reviews: reviews.map(review => {
          const reviewDoc = review as ReviewDocument;
          return {
            reviewId: reviewDoc._id.toString(),
            productId: reviewDoc.productId.toString(),
            variantId: reviewDoc.variantId ? reviewDoc.variantId.toString() : null,
            userId: reviewDoc.userId.toString(),
            productName: reviewDoc.productName,
            productImage: reviewDoc.productImage,
            rating: reviewDoc.rating,
            content: reviewDoc.content,
            images: reviewDoc.images,
            likes: reviewDoc.likes,
            status: reviewDoc.status,
            date: reviewDoc.createdAt,
            verified: reviewDoc.verified,
            isEdited: reviewDoc.isEdited || false,
          };
        }),
        totalItems,
        totalPages,
        currentPage: page,
        itemsPerPage: limit,
      };
    } catch (error) {
      this.logger.error(`Lỗi khi lấy danh sách đánh giá: ${error.message}`, error.stack);
      throw error;
    }
  }

  // Lấy thống kê đánh giá - Chuyển lên trước route :id để ưu tiên xử lý
  @Get('stats/count')
  @ApiOperation({ summary: 'Lấy thống kê đánh giá (Admin)' })
  @ApiResponse({ status: 200, description: 'Trả về thống kê đánh giá' })
  async getReviewStats() {
    try {
      const counts = await this.reviewsService.countByStatus();
      return {
        total: counts.total,
        pending: counts.pending,
        approved: counts.approved,
        rejected: counts.rejected,
      };
    } catch (error) {
      this.logger.error(`Lỗi khi lấy thống kê đánh giá: ${error.message}`, error.stack);
      throw error;
    }
  }

  // Thêm route xử lý riêng cho /admin/reviews/stats để tránh xung đột với route param :id
  @Get('stats')
  @ApiOperation({ summary: 'Redirect đến trang thống kê đánh giá (Admin)' })
  @ApiResponse({ status: 200, description: 'Trả về thống kê đánh giá' })
  async getReviewStatsRedirect() {
    try {
      return this.getReviewStats();
    } catch (error) {
      this.logger.error(`Lỗi khi lấy thống kê đánh giá (redirect): ${error.message}`, error.stack);
      throw error;
    }
  }

  // Lấy đánh giá theo ID
  @Get(':id')
  @ApiOperation({ summary: 'Lấy chi tiết đánh giá theo ID (Admin)' })
  @ApiResponse({ status: 200, description: 'Trả về chi tiết đánh giá' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy đánh giá' })
  @ApiParam({ name: 'id', description: 'ID của đánh giá' })
  async findOne(@Param('id') id: string) {
    try {
      const review = await this.reviewsService.findOne(id);
      const reviewDoc = review as ReviewDocument;

      return {
        reviewId: reviewDoc._id.toString(),
        productId: reviewDoc.productId.toString(),
        variantId: reviewDoc.variantId ? reviewDoc.variantId.toString() : null,
        userId: reviewDoc.userId.toString(),
        productName: reviewDoc.productName,
        productImage: reviewDoc.productImage,
        rating: reviewDoc.rating,
        content: reviewDoc.content,
        images: reviewDoc.images,
        likes: reviewDoc.likes,
        status: reviewDoc.status,
        date: reviewDoc.createdAt,
        verified: reviewDoc.verified,
        isEdited: reviewDoc.isEdited || false,
      };
    } catch (error) {
      this.logger.error(`Lỗi khi lấy chi tiết đánh giá: ${error.message}`, error.stack);
      throw error;
    }
  }

  // Lấy tất cả đánh giá của một người dùng
  @Get('user/:userId')
  @ApiOperation({ summary: 'Lấy danh sách đánh giá của một người dùng (Admin)' })
  @ApiResponse({ status: 200, description: 'Trả về danh sách đánh giá của người dùng có phân trang' })
  @ApiParam({ name: 'userId', description: 'ID của người dùng' })
  @ApiQuery({ name: 'page', required: false, description: 'Trang hiện tại', type: Number })
  @ApiQuery({ name: 'limit', required: false, description: 'Số lượng đánh giá mỗi trang', type: Number })
  @ApiQuery({ name: 'status', required: false, description: 'Trạng thái đánh giá (pending, approved, rejected)', type: String })
  @ApiQuery({ name: 'rating', required: false, description: 'Đánh giá sao (1-5)', type: Number })
  async findByUser(
    @Param('userId') userId: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('status') status?: string,
    @Query('rating') rating?: number,
  ) {
    try {
      const { reviews, totalItems, totalPages } = await this.reviewsService.findAll(
        page,
        limit,
        status,
        rating ? parseInt(rating.toString()) : undefined,
        userId
      );

      return {
        reviews: reviews.map(review => {
          const reviewDoc = review as ReviewDocument;
          return {
            reviewId: reviewDoc._id.toString(),
            productId: reviewDoc.productId.toString(),
            variantId: reviewDoc.variantId ? reviewDoc.variantId.toString() : null,
            productName: reviewDoc.productName,
            productImage: reviewDoc.productImage,
            rating: reviewDoc.rating,
            content: reviewDoc.content,
            images: reviewDoc.images,
            likes: reviewDoc.likes,
            status: reviewDoc.status,
            date: reviewDoc.createdAt,
            verified: reviewDoc.verified,
            isEdited: reviewDoc.isEdited || false,
          };
        }),
        totalItems,
        totalPages,
        currentPage: page,
        itemsPerPage: limit,
      };
    } catch (error) {
      this.logger.error(`Lỗi khi lấy đánh giá của người dùng: ${error.message}`, error.stack);
      throw error;
    }
  }

  // Cập nhật trạng thái đánh giá
  @Patch(':id/status')
  @ApiOperation({ summary: 'Cập nhật trạng thái đánh giá (Admin)' })
  @ApiResponse({ status: 200, description: 'Trạng thái đánh giá đã được cập nhật thành công' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy đánh giá' })
  @ApiParam({ name: 'id', description: 'ID của đánh giá' })
  async updateStatus(
    @Param('id') id: string,
    @Body('status') status: 'pending' | 'approved' | 'rejected',
  ) {
    try {
      const review = await this.reviewsService.updateStatus(id, status);
      const reviewDoc = review as ReviewDocument;

      return {
        reviewId: reviewDoc._id.toString(),
        status: reviewDoc.status,
        message: `Đã cập nhật trạng thái đánh giá thành ${status}`
      };
    } catch (error) {
      this.logger.error(`Lỗi khi cập nhật trạng thái đánh giá: ${error.message}`, error.stack);
      throw error;
    }
  }

  // Xóa đánh giá (xóa cứng)
  @Delete(':id')
  @HttpCode(204)
  @ApiOperation({ summary: 'Xóa đánh giá (Admin)' })
  @ApiResponse({ status: 204, description: 'Đánh giá đã được xóa thành công' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy đánh giá' })
  @ApiParam({ name: 'id', description: 'ID của đánh giá' })
  async remove(@Param('id') id: string) {
    try {
      await this.reviewsService.hardDelete(id);
    } catch (error) {
      this.logger.error(`Lỗi khi xóa đánh giá: ${error.message}`, error.stack);
      throw error;
    }
  }
}