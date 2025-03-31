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
import { ReviewsService } from './reviews.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/user.decorator';

@Controller('reviews')
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  // Lấy danh sách đánh giá (không yêu cầu đăng nhập)
  @Get()
  async findAll(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('status') status?: string,
    @Query('rating') rating?: number,
    @Query('userId') userId?: string,
  ) {
    return this.reviewsService.findAll(page, limit, status, rating, userId);
  }

  // Lấy đánh giá theo ID
  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.reviewsService.findOne(id);
  }

  // Lấy đánh giá theo userID (phải đăng nhập)
  @UseGuards(JwtAuthGuard)
  @Get('user/me')
  async findMyReviews(
    @CurrentUser('userId') userId: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('status') status?: string,
    @Query('rating') rating?: number,
  ) {
    return this.reviewsService.findAll(page, limit, status, rating, userId);
  }

  // Lấy đánh giá của một người dùng cụ thể (admin có thể xem của bất kỳ ai)
  @UseGuards(JwtAuthGuard)
  @Get('user/:userId')
  async findUserReviews(
    @Param('userId') userId: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('status') status?: string,
    @Query('rating') rating?: number,
    @CurrentUser('role') role?: string,
    @CurrentUser('userId') currentUserId?: string,
  ) {
    // Nếu không phải admin và đang cố xem đánh giá của người khác
    if (role !== 'admin' && role !== 'superadmin' && userId !== currentUserId) {
      throw new UnauthorizedException('Bạn không có quyền xem đánh giá của người dùng khác');
    }
    
    return this.reviewsService.findAll(page, limit, status, rating, userId);
  }

  // Lấy đánh giá theo productId
  @Get('product/:productId')
  async findByProduct(
    @Param('productId') productId: string,
    @Query('status') status: string = 'approved',
  ) {
    return this.reviewsService.findAllByProduct(productId, status);
  }

  // Tạo đánh giá mới (phải đăng nhập)
  @UseGuards(JwtAuthGuard)
  @Post()
  async create(@Body() createReviewDto: any, @CurrentUser('userId') userId: string) {
    // Đảm bảo userId trong đánh giá là của người dùng hiện tại
    createReviewDto.userId = userId;
    
    return this.reviewsService.create(createReviewDto);
  }

  // Cập nhật đánh giá (phải đăng nhập và là chủ của đánh giá)
  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateReviewDto: any,
    @CurrentUser('userId') userId: string,
    @CurrentUser('role') role: string,
  ) {
    const review = await this.reviewsService.findOne(id);
    
    // Kiểm tra quyền: phải là chủ đánh giá hoặc admin
    if (review.userId.toString() !== userId && role !== 'admin' && role !== 'superadmin') {
      throw new UnauthorizedException('Bạn không có quyền chỉnh sửa đánh giá này');
    }
    
    return this.reviewsService.update(id, updateReviewDto);
  }

  // Xóa đánh giá (phải đăng nhập và là chủ của đánh giá hoặc là admin)
  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  @HttpCode(204)
  async remove(
    @Param('id') id: string,
    @CurrentUser('userId') userId: string,
    @CurrentUser('role') role: string,
  ) {
    const review = await this.reviewsService.findOne(id);
    
    // Kiểm tra quyền: phải là chủ đánh giá hoặc admin
    if (review.userId.toString() !== userId && role !== 'admin' && role !== 'superadmin') {
      throw new UnauthorizedException('Bạn không có quyền xóa đánh giá này');
    }
    
    // Admin có thể xóa hoàn toàn, người dùng thường chỉ xóa mềm
    if (role === 'admin' || role === 'superadmin') {
      await this.reviewsService.hardDelete(id);
    } else {
      await this.reviewsService.softDelete(id);
    }
  }

  // Cập nhật trạng thái đánh giá (chỉ dành cho admin)
  @UseGuards(JwtAuthGuard)
  @Patch(':id/status')
  async updateStatus(
    @Param('id') id: string,
    @Body('status') status: 'pending' | 'approved' | 'rejected',
    @CurrentUser('role') role: string,
  ) {
    if (role !== 'admin' && role !== 'superadmin') {
      throw new UnauthorizedException('Bạn không có quyền cập nhật trạng thái đánh giá');
    }
    
    return this.reviewsService.updateStatus(id, status);
  }

  // Thích một đánh giá
  @UseGuards(JwtAuthGuard)
  @Post(':id/like')
  async likeReview(@Param('id') id: string) {
    return this.reviewsService.likeReview(id);
  }

  // Bỏ thích một đánh giá
  @UseGuards(JwtAuthGuard)
  @Post(':id/unlike')
  async unlikeReview(@Param('id') id: string) {
    return this.reviewsService.unlikeReview(id);
  }

  // Lấy thống kê đánh giá theo trạng thái
  @Get('stats/count')
  async getReviewCounts(
    @Query('status') status?: string,
    @Query('rating') rating?: number,
    @Query('userId') userId?: string,
  ) {
    return this.reviewsService.countByStatus(status, rating, userId);
  }

  // Lấy điểm trung bình của sản phẩm
  @Get('stats/rating/:productId')
  async getAverageRating(@Param('productId') productId: string) {
    return {
      average: await this.reviewsService.getAverageRating(productId),
      distribution: await this.reviewsService.getRatingDistribution(productId),
    };
  }
} 