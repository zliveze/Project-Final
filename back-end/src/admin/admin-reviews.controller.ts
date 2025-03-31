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
} from '@nestjs/common';
import { ReviewsService } from '../reviews/reviews.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/user.decorator';
import { Review, ReviewDocument } from '../reviews/schemas/review.schema';
import { Document, Types } from 'mongoose';

@Controller('admin/reviews')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin', 'superadmin')
export class AdminReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  // Lấy tất cả đánh giá với phân trang và lọc
  @Get()
  async findAll(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('status') status?: string,
    @Query('rating') rating?: number,
    @Query('userId') userId?: string,
  ) {
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
        };
      }),
      totalItems,
      totalPages,
      currentPage: page,
      itemsPerPage: limit,
    };
  }

  // Lấy đánh giá theo ID
  @Get(':id')
  async findOne(@Param('id') id: string) {
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
    };
  }

  // Lấy tất cả đánh giá của một người dùng
  @Get('user/:userId')
  async findByUser(
    @Param('userId') userId: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('status') status?: string,
    @Query('rating') rating?: number,
  ) {
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
        };
      }),
      totalItems,
      totalPages,
      currentPage: page,
      itemsPerPage: limit,
    };
  }

  // Cập nhật trạng thái đánh giá
  @Patch(':id/status')
  async updateStatus(
    @Param('id') id: string,
    @Body('status') status: 'pending' | 'approved' | 'rejected',
  ) {
    const review = await this.reviewsService.updateStatus(id, status);
    const reviewDoc = review as ReviewDocument;
    
    return {
      reviewId: reviewDoc._id.toString(),
      status: reviewDoc.status,
      message: `Đã cập nhật trạng thái đánh giá thành ${status}`
    };
  }

  // Xóa đánh giá (xóa cứng)
  @Delete(':id')
  @HttpCode(204)
  async remove(@Param('id') id: string) {
    await this.reviewsService.hardDelete(id);
  }

  // Lấy thống kê đánh giá
  @Get('stats/count')
  async getReviewStats() {
    const counts = await this.reviewsService.countByStatus();
    return {
      total: counts.total,
      pending: counts.pending,
      approved: counts.approved,
      rejected: counts.rejected,
    };
  }
} 