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
  ForbiddenException,
  UseInterceptors,
  UploadedFiles,
} from '@nestjs/common';
import { ReviewsService } from './reviews.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/user.decorator';
import { CreateReviewDto, UpdateReviewDto, QueryReviewDto } from './dto';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiBody, ApiConsumes } from '@nestjs/swagger';
import { FilesInterceptor } from '@nestjs/platform-express';
import { CloudinaryService } from '../cloudinary/cloudinary.service';

@ApiTags('Reviews')
@Controller('reviews')
export class ReviewsController {
  private readonly logger = new Logger(ReviewsController.name);

  constructor(
    private readonly reviewsService: ReviewsService,
    private readonly cloudinaryService: CloudinaryService
  ) {}

  // Lấy danh sách đánh giá (không yêu cầu đăng nhập)
  @Get()
  @ApiOperation({ summary: 'Lấy danh sách đánh giá' })
  @ApiResponse({ status: 200, description: 'Trả về danh sách đánh giá có phân trang' })
  async findAll(
    @Query() queryDto: QueryReviewDto
  ) {
    try {
      const { page = 1, limit = 10, status, rating, userId, sortBy = 'createdAt', sortOrder = 'desc' } = queryDto;
      return this.reviewsService.findAll(page, limit, status, rating, userId);
    } catch (error) {
      this.logger.error(`Lỗi khi lấy danh sách đánh giá: ${error.message}`, error.stack);
      throw error;
    }
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

  // Lấy đánh giá theo ID - Di chuyển xuống dưới để tránh xung đột với /user/me và /user/:userId
  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.reviewsService.findOne(id);
  }

  // Upload ảnh đánh giá lên Cloudinary
  @UseGuards(JwtAuthGuard)
  @Post('upload-images')
  @UseInterceptors(FilesInterceptor('reviewImages', 5))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload ảnh đánh giá' })
  @ApiResponse({ status: 201, description: 'Ảnh đã được upload thành công' })
  @ApiResponse({ status: 400, description: 'Lỗi khi upload ảnh' })
  @ApiBearerAuth()
  async uploadReviewImages(@UploadedFiles() files: Express.Multer.File[]) {
    try {
      if (!files || files.length === 0) {
        throw new BadRequestException('Không có file nào được upload');
      }

      const uploadedImages = await this.reviewsService.uploadReviewImages(files);
      return { success: true, images: uploadedImages };
    } catch (error) {
      this.logger.error(`Lỗi khi upload ảnh đánh giá: ${error.message}`, error.stack);
      throw new BadRequestException(`Không thể upload ảnh: ${error.message}`);
    }
  }

  // Tạo đánh giá mới (phải đăng nhập)
  @UseGuards(JwtAuthGuard)
  @Post()
  @UseInterceptors(FilesInterceptor('reviewImages', 5))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Tạo đánh giá mới' })
  @ApiResponse({ status: 201, description: 'Đánh giá đã được tạo thành công' })
  @ApiResponse({ status: 400, description: 'Dữ liệu không hợp lệ' })
  @ApiResponse({ status: 403, description: 'Người dùng chưa mua sản phẩm hoặc đã đánh giá rồi' })
  @ApiBearerAuth()
  async create(
    @Body() body: any,
    @CurrentUser('userId') userId: string,
    @UploadedFiles() files?: Express.Multer.File[]
  ) {
    try {
      this.logger.debug(`Nhận dữ liệu đánh giá: ${JSON.stringify(body)}`);

      // Tạo đối tượng CreateReviewDto từ dữ liệu nhận được
      const createReviewDto = new CreateReviewDto();

      // Đảm bảo userId trong đánh giá là của người dùng hiện tại
      createReviewDto.userId = userId;

      // Lấy các trường từ body
      createReviewDto.productId = body.productId;
      createReviewDto.rating = parseInt(body.rating, 10);
      createReviewDto.content = body.content;

      // Các trường tùy chọn
      if (body.variantId) createReviewDto.variantId = body.variantId;
      if (body.orderId) createReviewDto.orderId = body.orderId;
      if (body.productName) createReviewDto.productName = body.productName;
      if (body.productImage) createReviewDto.productImage = body.productImage;

      // Xử lý hình ảnh nếu có trong body (từ client gửi lên)
      if (body.images) {
        try {
          createReviewDto.images = Array.isArray(body.images)
            ? body.images
            : JSON.parse(body.images);
        } catch (e) {
          this.logger.error(`Lỗi khi parse images: ${e.message}`);
          createReviewDto.images = [];
        }
      }

      this.logger.debug(`Đã tạo DTO: ${JSON.stringify(createReviewDto)}`);

      // Kiểm tra xem người dùng đã mua sản phẩm với trạng thái hoàn thành chưa
      const hasPurchased = await this.reviewsService.checkUserPurchasedProduct(userId, createReviewDto.productId);
      if (!hasPurchased) {
        throw new ForbiddenException('Bạn cần mua sản phẩm và nhận hàng thành công trước khi đánh giá');
      }

      // Kiểm tra xem người dùng đã đánh giá sản phẩm này chưa
      const hasReviewed = await this.reviewsService.checkUserReviewedProduct(userId, createReviewDto.productId);
      if (hasReviewed) {
        throw new BadRequestException('Bạn đã đánh giá sản phẩm này rồi');
      }

      // Gọi service để tạo đánh giá, truyền thêm files để upload
      return this.reviewsService.create(createReviewDto, files);
    } catch (error) {
      this.logger.error(`Lỗi khi tạo đánh giá: ${error.message}`, error.stack);
      throw error;
    }
  }

  // Cập nhật đánh giá (phải đăng nhập và là chủ của đánh giá)
  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  @UseInterceptors(FilesInterceptor('reviewImages', 5))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Cập nhật đánh giá' })
  @ApiResponse({ status: 200, description: 'Đánh giá đã được cập nhật thành công' })
  @ApiResponse({ status: 400, description: 'Dữ liệu không hợp lệ' })
  @ApiResponse({ status: 403, description: 'Không có quyền cập nhật đánh giá này' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy đánh giá' })
  @ApiBearerAuth()
  async update(
    @Param('id') id: string,
    @Body() updateReviewDto: UpdateReviewDto,
    @CurrentUser('userId') userId: string,
    @CurrentUser('role') role: string,
    @UploadedFiles() files?: Express.Multer.File[]
  ) {
    try {
      const review = await this.reviewsService.findOne(id);

      // Kiểm tra quyền: phải là chủ đánh giá hoặc admin
      if (review.userId.toString() !== userId && role !== 'admin' && role !== 'superadmin') {
        throw new UnauthorizedException('Bạn không có quyền chỉnh sửa đánh giá này');
      }

      // Nếu là admin, cho phép cập nhật trạng thái
      if (role === 'admin' || role === 'superadmin') {
        return this.reviewsService.update(id, updateReviewDto, undefined, files);
      }

      // Nếu là người dùng thường, chỉ cho phép cập nhật nội dung, rating và hình ảnh
      const allowedFields: UpdateReviewDto = {
        rating: updateReviewDto.rating,
        content: updateReviewDto.content,
        images: updateReviewDto.images
      };

      return this.reviewsService.update(id, allowedFields, userId, files);
    } catch (error) {
      this.logger.error(`Lỗi khi cập nhật đánh giá: ${error.message}`, error.stack);
      throw error;
    }
  }

  // Xóa đánh giá (phải đăng nhập và là chủ của đánh giá hoặc là admin)
  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  @HttpCode(204)
  @ApiOperation({ summary: 'Xóa đánh giá' })
  @ApiResponse({ status: 204, description: 'Đánh giá đã được xóa thành công' })
  @ApiResponse({ status: 403, description: 'Không có quyền xóa đánh giá này' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy đánh giá' })
  @ApiBearerAuth()
  async remove(
    @Param('id') id: string,
    @CurrentUser('userId') userId: string,
    @CurrentUser('role') role: string,
  ) {
    try {
      const review = await this.reviewsService.findOne(id);

      // Kiểm tra quyền: phải là chủ đánh giá hoặc admin
      if (review.userId.toString() !== userId && role !== 'admin' && role !== 'superadmin') {
        throw new UnauthorizedException('Bạn không có quyền xóa đánh giá này');
      }

      // Admin có thể xóa hoàn toàn, người dùng thường chỉ xóa mềm
      if (role === 'admin' || role === 'superadmin') {
        await this.reviewsService.hardDelete(id);
      } else {
        await this.reviewsService.softDelete(id, userId);
      }
    } catch (error) {
      this.logger.error(`Lỗi khi xóa đánh giá: ${error.message}`, error.stack);
      throw error;
    }
  }

  // Cập nhật trạng thái đánh giá (chỉ dành cho admin)
  @UseGuards(JwtAuthGuard)
  @Patch(':id/status')
  @ApiOperation({ summary: 'Cập nhật trạng thái đánh giá (Admin)' })
  @ApiResponse({ status: 200, description: 'Trạng thái đánh giá đã được cập nhật thành công' })
  @ApiResponse({ status: 403, description: 'Không có quyền cập nhật trạng thái đánh giá' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy đánh giá' })
  @ApiBearerAuth()
  async updateStatus(
    @Param('id') id: string,
    @Body('status') status: 'pending' | 'approved' | 'rejected',
    @CurrentUser('role') role: string,
  ) {
    try {
      if (role !== 'admin' && role !== 'superadmin') {
        throw new UnauthorizedException('Bạn không có quyền cập nhật trạng thái đánh giá');
      }

      const updatedReview = await this.reviewsService.updateStatus(id, status);

      // Nếu đánh giá được phê duyệt, cập nhật thống kê đánh giá trong sản phẩm
      if (status === 'approved') {
        await this.reviewsService.updateProductReviewStats(updatedReview.productId.toString());
      }

      return updatedReview;
    } catch (error) {
      this.logger.error(`Lỗi khi cập nhật trạng thái đánh giá: ${error.message}`, error.stack);
      throw error;
    }
  }

  // Thích một đánh giá
  @UseGuards(JwtAuthGuard)
  @Post(':id/like')
  @ApiOperation({ summary: 'Thích một đánh giá' })
  @ApiResponse({ status: 200, description: 'Đã thích đánh giá thành công' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy đánh giá' })
  @ApiBearerAuth()
  async likeReview(@Param('id') id: string) {
    try {
      return this.reviewsService.likeReview(id);
    } catch (error) {
      this.logger.error(`Lỗi khi thích đánh giá: ${error.message}`, error.stack);
      throw error;
    }
  }

  // Bỏ thích một đánh giá
  @UseGuards(JwtAuthGuard)
  @Post(':id/unlike')
  @ApiOperation({ summary: 'Bỏ thích một đánh giá' })
  @ApiResponse({ status: 200, description: 'Đã bỏ thích đánh giá thành công' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy đánh giá' })
  @ApiBearerAuth()
  async unlikeReview(@Param('id') id: string) {
    try {
      return this.reviewsService.unlikeReview(id);
    } catch (error) {
      this.logger.error(`Lỗi khi bỏ thích đánh giá: ${error.message}`, error.stack);
      throw error;
    }
  }

  // Lấy thống kê đánh giá theo trạng thái
  @Get('stats/count')
  @ApiOperation({ summary: 'Lấy thống kê đánh giá theo trạng thái' })
  @ApiResponse({ status: 200, description: 'Trả về thống kê đánh giá' })
  async getReviewCounts(
    @Query('status') status?: string,
    @Query('rating') rating?: number,
    @Query('userId') userId?: string,
  ) {
    try {
      return this.reviewsService.countByStatus(status, rating, userId);
    } catch (error) {
      this.logger.error(`Lỗi khi lấy thống kê đánh giá: ${error.message}`, error.stack);
      throw error;
    }
  }

  // Lấy điểm trung bình của sản phẩm
  @Get('stats/rating/:productId')
  @ApiOperation({ summary: 'Lấy điểm trung bình và phân phối đánh giá của sản phẩm' })
  @ApiResponse({ status: 200, description: 'Trả về điểm trung bình và phân phối đánh giá' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy sản phẩm' })
  async getAverageRating(@Param('productId') productId: string) {
    try {
      return {
        average: await this.reviewsService.getAverageRating(productId),
        distribution: await this.reviewsService.getRatingDistribution(productId),
      };
    } catch (error) {
      this.logger.error(`Lỗi khi lấy điểm trung bình đánh giá: ${error.message}`, error.stack);
      throw error;
    }
  }

  // Kiểm tra xem người dùng đã mua sản phẩm và có thể đánh giá không
  @UseGuards(JwtAuthGuard)
  @Get('check-can-review/:productId')
  @ApiOperation({ summary: 'Kiểm tra xem người dùng có thể đánh giá sản phẩm không' })
  @ApiResponse({ status: 200, description: 'Trả về kết quả kiểm tra' })
  @ApiBearerAuth()
  async checkCanReview(
    @Param('productId') productId: string,
    @CurrentUser('userId') userId: string,
  ) {
    try {
      const hasPurchased = await this.reviewsService.checkUserPurchasedProduct(userId, productId);
      const hasReviewed = await this.reviewsService.checkUserReviewedProduct(userId, productId);

      return {
        canReview: hasPurchased && !hasReviewed,
        hasPurchased,
        hasReviewed
      };
    } catch (error) {
      this.logger.error(`Lỗi khi kiểm tra khả năng đánh giá: ${error.message}`, error.stack);
      throw error;
    }
  }
}
