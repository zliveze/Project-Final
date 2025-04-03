import { Controller, Get, Post, Body, Param, Query, UseGuards, Logger } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ProductsService } from './products.service';
import { 
  QueryProductDto,
  ProductResponseDto,
  PaginatedProductsResponseDto,
  LightProductResponseDto
} from './dto';

@ApiTags('Products')
@Controller('products')
export class ProductsController {
  private readonly logger = new Logger(ProductsController.name);

  constructor(private readonly productsService: ProductsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all products with filtering and pagination' })
  @ApiResponse({ 
    status: 200, 
    description: 'Returns paginated products', 
    type: PaginatedProductsResponseDto 
  })
  async findAll(@Query() queryDto: QueryProductDto): Promise<PaginatedProductsResponseDto> {
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

  @Get(':id')
  @ApiOperation({ summary: 'Get a product by ID' })
  @ApiResponse({ 
    status: 200, 
    description: 'Returns a product', 
    type: ProductResponseDto 
  })
  @ApiResponse({ status: 404, description: 'Product not found' })
  async findOne(@Param('id') id: string): Promise<ProductResponseDto> {
    return this.productsService.findOne(id);
  }

  @Get('slug/:slug')
  @ApiOperation({ summary: 'Get a product by slug' })
  @ApiResponse({ 
    status: 200, 
    description: 'Returns a product', 
    type: ProductResponseDto 
  })
  @ApiResponse({ status: 404, description: 'Product not found' })
  async findBySlug(@Param('slug') slug: string): Promise<ProductResponseDto> {
    return this.productsService.findBySlug(slug);
  }
}
