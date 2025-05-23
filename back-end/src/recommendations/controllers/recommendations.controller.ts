import {
  Controller,
  Get,
  Param,
  Query,
  UseGuards,
  Request,
  Post,
  Body,
} from '@nestjs/common';
import { RecommendationsService } from '../services/recommendations.service';
import { UserActivityService } from '../services/user-activity.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { ApiTags, ApiOperation, ApiParam, ApiQuery } from '@nestjs/swagger';
import { LogSearchDto, ProductFilterDto } from '../dto/recommendation.dto';

@ApiTags('recommendations')
@Controller('recommendations')
export class RecommendationsController {
  constructor(
    private readonly recommendationsService: RecommendationsService,
    private readonly userActivityService: UserActivityService,
  ) {}

  @ApiOperation({ summary: 'Lấy gợi ý sản phẩm cá nhân hóa cho người dùng' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @UseGuards(JwtAuthGuard)
  @Get('personalized')
  async getPersonalizedRecommendations(
    @Request() req,
    @Query('limit') limit?: number,
  ) {
    const userId = req.user.userId;
    const recommendations = await this.recommendationsService.getPersonalizedRecommendations(
      userId,
      limit || 10,
    );
    return { recommendations };
  }

  @ApiOperation({ summary: 'Lấy sản phẩm tương tự với sản phẩm hiện tại' })
  @ApiParam({ name: 'productId', type: String })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @Get('similar/:productId')
  async getSimilarProducts(
    @Param('productId') productId: string,
    @Query('limit') limit?: number,
  ) {
    const products = await this.recommendationsService.getSimilarProducts(
      productId,
      limit || 8,
    );
    return { products };
  }

  @ApiOperation({ summary: 'Lấy sản phẩm dựa trên từ khóa tìm kiếm' })
  @ApiQuery({ name: 'query', type: String })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @Get('search')
  async getProductsBySearchQuery(
    @Query('query') query: string,
    @Request() req,
    @Query('limit') limit?: number,
  ) {
    // Lưu hoạt động tìm kiếm nếu người dùng đã đăng nhập
    if (req.user?.userId) {
      await this.userActivityService.logSearch(req.user.userId, query);
    }

    const products = await this.recommendationsService.getProductsBySearchQuery(
      query,
      limit || 10,
    );
    return { products };
  }

  @ApiOperation({ summary: 'Lấy sản phẩm phổ biến' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @Get('popular')
  async getPopularProducts(@Query('limit') limit?: number) {
    const popularProducts = await this.recommendationsService.getPopularProducts(
      limit || 10,
    );
    return { popularProducts };
  }

  @ApiOperation({ summary: 'Ghi lại hoạt động xem sản phẩm' })
  @UseGuards(JwtAuthGuard)
  @Post('log/view/:productId')
  async logProductView(
    @Request() req,
    @Param('productId') productId: string,
    @Body() body: { timeSpent?: number; variantId?: string },
  ) {
    const userId = req.user.userId;
    await this.userActivityService.logProductView(
      userId,
      productId,
      body.timeSpent,
      body.variantId,
    );
    return { success: true };
  }

  @ApiOperation({ summary: 'Ghi lại hoạt động click vào sản phẩm' })
  @UseGuards(JwtAuthGuard)
  @Post('log/click/:productId')
  async logProductClick(
    @Request() req,
    @Param('productId') productId: string,
    @Body() body: { variantId?: string },
  ) {
    const userId = req.user.userId;
    await this.userActivityService.logProductClick(
      userId,
      productId,
      body.variantId,
    );
    return { success: true };
  }

  @ApiOperation({ summary: 'Ghi lại hoạt động thêm sản phẩm vào giỏ hàng' })
  @UseGuards(JwtAuthGuard)
  @Post('log/add-to-cart/:productId')
  async logAddToCart(
    @Request() req,
    @Param('productId') productId: string,
    @Body() body: { variantId?: string },
  ) {
    const userId = req.user.userId;
    await this.userActivityService.logAddToCart(
      userId,
      productId,
      body.variantId,
    );
    return { success: true };
  }

  @ApiOperation({ summary: 'Ghi lại hoạt động mua sản phẩm' })
  @UseGuards(JwtAuthGuard)
  @Post('log/purchase/:productId')
  async logPurchase(
    @Request() req,
    @Param('productId') productId: string,
    @Body() body: { variantId?: string },
  ) {
    const userId = req.user.userId;
    await this.userActivityService.logPurchase(
      userId,
      productId,
      body.variantId,
    );
    return { success: true };
  }

  @ApiOperation({ summary: 'Ghi lại hoạt động tìm kiếm' })
  @UseGuards(JwtAuthGuard)
  @Post('log/search')
  async logSearch(
    @Request() req,
    @Body() body: LogSearchDto,
  ) {
    const userId = req.user.userId;
    await this.userActivityService.logSearch(userId, body.searchQuery);
    return { success: true };
  }

  @ApiOperation({ summary: 'Ghi lại hoạt động sử dụng bộ lọc' })
  @UseGuards(JwtAuthGuard)
  @Post('log/filter')
  async logFilterUse(
    @Request() req,
    @Body() filters: ProductFilterDto,
  ) {
    const userId = req.user.userId;
    await this.userActivityService.logFilterUse(userId, filters);
    return { success: true };
  }

  @ApiOperation({ summary: 'Lấy lịch sử tìm kiếm của người dùng' })
  @UseGuards(JwtAuthGuard)
  @Get('history/search')
  async getUserSearchHistory(@Request() req, @Query('limit') limit?: number) {
    const userId = req.user.userId;
    const searchHistory = await this.userActivityService.getUserSearchHistory(
      userId,
      limit || 10,
    );
    return { searchHistory };
  }

  @ApiOperation({ summary: 'Lấy sản phẩm đã xem gần đây' })
  @UseGuards(JwtAuthGuard)
  @Get('history/viewed')
  async getRecentlyViewedProducts(
    @Request() req,
    @Query('limit') limit?: number,
  ) {
    const userId = req.user.userId;
    const productIds = await this.userActivityService.getRecentlyViewedProducts(
      userId,
      limit || 10,
    );
    return { productIds };
  }
}
