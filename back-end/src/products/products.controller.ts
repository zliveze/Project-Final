import { Controller, Get, Post, Body, Param, Query, UseGuards, Logger, Req, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { ProductsService } from './products.service';
import {
  QueryProductDto,
  ProductResponseDto,
  PaginatedProductsResponseDto,
  LightProductResponseDto,
  LightProductDto,
  SkinTypesResponseDto,
  ConcernsResponseDto
} from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RecommendationsService } from '../recommendations/services/recommendations.service';
import { UserActivityService } from '../recommendations/services/user-activity.service';

@ApiTags('Products')
@Controller('products')
export class ProductsController {
  private readonly logger = new Logger(ProductsController.name);

  constructor(
    private readonly productsService: ProductsService,
    private readonly recommendationsService: RecommendationsService,
    private readonly userActivityService: UserActivityService
  ) {}

  @Get()
  @ApiOperation({ summary: 'Get all products with filtering and pagination' })
  @ApiResponse({
    status: 200,
    description: 'Returns paginated products',
    type: PaginatedProductsResponseDto
  })
  async findAll(@Query() queryDto: QueryProductDto, @Request() req): Promise<PaginatedProductsResponseDto> {
    // Ghi lại hoạt động sử dụng bộ lọc nếu người dùng đã đăng nhập
    if (req.user?.userId && (
      queryDto.minPrice || queryDto.maxPrice || queryDto.categoryId ||
      queryDto.brandId || queryDto.tags || queryDto.skinTypes || queryDto.concerns
    )) {
      const filters = {};

      if (queryDto.minPrice || queryDto.maxPrice) {
        filters['price'] = {
          min: queryDto.minPrice ? Number(queryDto.minPrice) : undefined,
          max: queryDto.maxPrice ? Number(queryDto.maxPrice) : undefined,
        };
      }

      if (queryDto.categoryId) {
        filters['categoryIds'] = [queryDto.categoryId];
      }

      if (queryDto.brandId) {
        filters['brandIds'] = [queryDto.brandId];
      }

      if (queryDto.tags) {
        const tagsArray = queryDto.tags.split(',').map(tag => tag.trim());
        filters['tags'] = tagsArray;
      }

      if (queryDto.skinTypes) {
        const skinTypesArray = queryDto.skinTypes.split(',').map(type => type.trim());
        filters['skinType'] = skinTypesArray;
      }

      if (queryDto.concerns) {
        const concernsArray = queryDto.concerns.split(',').map(concern => concern.trim());
        filters['concerns'] = concernsArray;
      }

      this.userActivityService.logFilterUse(req.user.userId, filters);
    }

    return this.productsService.findAll(queryDto);
  }

  @Get('light')
  @ApiOperation({ summary: 'Get all products with minimal data for faster loading' })
  @ApiResponse({
    status: 200,
    description: 'Returns paginated light products',
    type: LightProductResponseDto
  })
  async findAllLight(@Query() queryDto: QueryProductDto): Promise<LightProductResponseDto> {
    return this.productsService.findAllLight(queryDto);
  }

  @Get('recommended')
  @ApiOperation({ summary: 'Get recommended products' })
  @ApiResponse({
    status: 200,
    description: 'Returns recommended products',
    type: LightProductResponseDto
  })
  async getRecommended(@Query() queryDto: QueryProductDto): Promise<LightProductResponseDto> {
    this.logger.log('Request received for recommended products');
    // Lấy sản phẩm gợi ý thông minh hơn, không chỉ sản phẩm mới
    // Ưu tiên: Bestseller > Đánh giá cao > Sản phẩm mới > Bán chạy
    return this.productsService.findAllLight({
      ...queryDto,
      sortBy: 'reviews.averageRating', // Sắp xếp theo đánh giá
      sortOrder: 'desc',   // Cao nhất trước
      limit: queryDto.limit || 20 // Mặc định lấy 20 sản phẩm nếu không có limit
    });
  }

  @UseGuards(JwtAuthGuard)
  @Get('personalized')
  @ApiOperation({ summary: 'Get personalized product recommendations for the current user' })
  @ApiResponse({
    status: 200,
    description: 'Returns personalized recommended products',
    type: LightProductResponseDto
  })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async getPersonalizedRecommendations(
    @Request() req,
    @Query('limit') limit?: number,
  ): Promise<LightProductResponseDto> {
    this.logger.log('Request received for personalized recommendations');

    const products = await this.recommendationsService.getPersonalizedRecommendations(
      req.user.userId,
      limit || 20,
    );

    // Format the response to match LightProductResponseDto
    const formattedProducts = products.map(p => ({
      _id: (p as any)._id?.toString(),
      name: p.name,
      slug: p.slug,
      sku: p.sku,
      price: p.price,
      currentPrice: p.currentPrice || p.price,
      imageUrl: p.images?.find(img => img.isPrimary)?.url || (p.images?.[0]?.url || ''),
      brandId: p.brandId?.toString(),
      flags: p.flags,
      status: p.status,
      reviews: p.reviews
    }));

    return {
      products: formattedProducts as LightProductDto[],
      total: formattedProducts.length,
      page: 1,
      limit: limit || 20,
      totalPages: 1
    };
  }

  @Get('similar/:productId')
  @ApiOperation({ summary: 'Get similar products based on the current product' })
  @ApiResponse({
    status: 200,
    description: 'Returns similar products',
    type: LightProductResponseDto
  })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async getSimilarProducts(
    @Param('productId') productId: string,
    @Query('limit') limit?: number,
    @Request() req?,
  ): Promise<LightProductResponseDto> {
    this.logger.log(`Request received for similar products to: ${productId}`);

    // Ghi lại hoạt động click vào sản phẩm nếu người dùng đã đăng nhập
    if (req?.user?.userId) {
      this.userActivityService.logProductClick(req.user.userId, productId);
    }

    const products = await this.recommendationsService.getSimilarProducts(
      productId,
      limit || 20,
    );

    // Format the response to match LightProductResponseDto
    const formattedProducts = products.map(p => ({
      _id: (p as any)._id?.toString(),
      name: p.name,
      slug: p.slug,
      sku: p.sku,
      price: p.price,
      currentPrice: p.currentPrice || p.price,
      imageUrl: p.images?.find(img => img.isPrimary)?.url || (p.images?.[0]?.url || ''),
      brandId: p.brandId?.toString(),
      flags: p.flags,
      status: p.status,
      reviews: p.reviews
    }));

    return {
      products: formattedProducts as LightProductDto[],
      total: formattedProducts.length,
      page: 1,
      limit: limit || 20,
      totalPages: 1
    };
  }

  @Get('slug/:slug')
  @ApiOperation({ summary: 'Get a product by slug' })
  @ApiResponse({
    status: 200,
    description: 'Returns a product',
    type: ProductResponseDto
  })
  @ApiResponse({ status: 404, description: 'Product not found' })
  async findBySlug(@Param('slug') slug: string, @Request() req): Promise<ProductResponseDto> {
    const product = await this.productsService.findBySlug(slug);

    // Ghi lại hoạt động xem sản phẩm nếu người dùng đã đăng nhập
    if (req.user?.userId && product) {
      // Sử dụng thuộc tính id hoặc mã sản phẩm từ product
      const productId = product.id || (product as any)._id?.toString();
      if (productId) {
        this.userActivityService.logProductView(req.user.userId, productId);
      }
    }

    return product;
  }

  @Get('top-sellers')
  @ApiOperation({ summary: 'Get top selling products' })
  @ApiResponse({
    status: 200,
    description: 'Returns top selling products',
    type: LightProductResponseDto
  })
  @ApiQuery({ name: 'period', required: false, enum: ['all-time', '30-days'], description: 'Time period for top products' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Number of products to return' })
  async getTopSellers(
    @Query('period') period: 'all-time' | '30-days' = 'all-time',
    @Query('limit') limit: number = 20
  ): Promise<LightProductResponseDto> {
    this.logger.log(`Request received for top sellers: period=${period}, limit=${limit}`);

    const topProducts = await this.productsService.getTopProducts(period, limit);

    // Format response to match LightProductResponseDto
    const formattedProducts = topProducts.products.map(p => ({
      _id: p._id?.toString(),
      id: p._id?.toString(),
      name: p.name,
      slug: p.slug,
      sku: p.sku,
      price: p.price,
      currentPrice: p.currentPrice || p.price,
      status: p.status,
      imageUrl: p.imageUrl || ((p as any).images?.find((img: any) => img.isPrimary)?.url || ((p as any).images?.[0]?.url || '')),
      brandId: p.brandId?.toString(),
      brandName: p.brandName,
      categoryIds: p.categoryIds,
      flags: p.flags,
      reviews: p.reviews,
      soldCount: p.soldCount
    }));

    return {
      products: formattedProducts as LightProductDto[],
      total: formattedProducts.length,
      page: 1,
      limit: limit,
      totalPages: 1
    };
  }

  @Get('filters/skin-types')
  @ApiOperation({ summary: 'Get all unique skin types for filtering' })
  @ApiResponse({
    status: 200,
    description: 'Returns a list of unique skin types',
    type: SkinTypesResponseDto
  })
  async getSkinTypes(): Promise<SkinTypesResponseDto> {
    this.logger.log('Request received for unique skin types');
    return this.productsService.getSkinTypes();
  }

  @Get('filters/concerns')
  @ApiOperation({ summary: 'Get all unique skin concerns for filtering' })
  @ApiResponse({
    status: 200,
    description: 'Returns a list of unique skin concerns',
    type: ConcernsResponseDto
  })
  async getConcerns(): Promise<ConcernsResponseDto> {
    this.logger.log('Request received for unique concerns');
    return this.productsService.getConcerns();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a product by ID' })
  @ApiResponse({
    status: 200,
    description: 'Returns a product',
    type: ProductResponseDto
  })
  @ApiResponse({ status: 404, description: 'Product not found' })
  async findOne(@Param('id') id: string, @Request() req): Promise<ProductResponseDto> {
    const product = await this.productsService.findOne(id);

    // Ghi lại hoạt động xem sản phẩm nếu người dùng đã đăng nhập
    if (req.user?.userId && product) {
      this.userActivityService.logProductView(req.user.userId, id);
    }

    return product;
  }
}
