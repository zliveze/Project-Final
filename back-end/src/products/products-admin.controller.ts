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
  Logger,
  UploadedFile,
  UseInterceptors
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { ProductsService } from './products.service';
import { 
  CreateProductDto, 
  UpdateProductDto, 
  QueryProductDto,
  ProductResponseDto,
  PaginatedProductsResponseDto
} from './dto';
import { JwtAdminAuthGuard } from '../auth/guards/jwt-admin-auth.guard';
import { AdminRolesGuard } from '../auth/guards/admin-roles.guard';
import { AdminRoles } from '../common/decorators/admin-roles.decorator';
import { CloudinaryService } from '../cloudinary/cloudinary.service';

@ApiTags('Admin Products')
@Controller('admin/products')
@UseGuards(JwtAdminAuthGuard, AdminRolesGuard)
@ApiBearerAuth()
export class ProductsAdminController {
  private readonly logger = new Logger(ProductsAdminController.name);

  constructor(
    private readonly productsService: ProductsService,
    private readonly cloudinaryService: CloudinaryService
  ) {}

  @Post()
  @AdminRoles('admin', 'superadmin')
  @ApiOperation({ summary: 'Create a new product' })
  @ApiResponse({ 
    status: 201, 
    description: 'The product has been successfully created', 
    type: ProductResponseDto 
  })
  async create(@Body() createProductDto: CreateProductDto): Promise<ProductResponseDto> {
    return this.productsService.create(createProductDto);
  }

  @Get()
  @AdminRoles('admin', 'superadmin')
  @ApiOperation({ summary: 'Get all products with filtering and pagination' })
  @ApiResponse({ 
    status: 200, 
    description: 'Returns paginated products', 
    type: PaginatedProductsResponseDto 
  })
  async findAll(@Query() queryDto: QueryProductDto): Promise<PaginatedProductsResponseDto> {
    return this.productsService.findAll(queryDto);
  }

  @Get('statistics')
  @AdminRoles('admin', 'superadmin')
  @ApiOperation({ summary: 'Get product statistics' })
  @ApiResponse({ status: 200, description: 'Returns product statistics' })
  async getStatistics() {
    return this.productsService.getStatistics();
  }

  @Get(':id')
  @AdminRoles('admin', 'superadmin')
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

  @Patch(':id')
  @AdminRoles('admin', 'superadmin')
  @ApiOperation({ summary: 'Update a product' })
  @ApiResponse({ 
    status: 200, 
    description: 'The product has been successfully updated', 
    type: ProductResponseDto 
  })
  @ApiResponse({ status: 404, description: 'Product not found' })
  async update(
    @Param('id') id: string, 
    @Body() updateProductDto: UpdateProductDto
  ): Promise<ProductResponseDto> {
    return this.productsService.update(id, updateProductDto);
  }

  @Delete(':id')
  @AdminRoles('superadmin')
  @ApiOperation({ summary: 'Delete a product' })
  @ApiResponse({ 
    status: 200, 
    description: 'The product has been successfully deleted' 
  })
  @ApiResponse({ status: 404, description: 'Product not found' })
  async remove(@Param('id') id: string) {
    return this.productsService.remove(id);
  }

  @Post(':id/inventory/:branchId')
  @AdminRoles('admin', 'superadmin')
  @ApiOperation({ summary: 'Update product inventory for a specific branch' })
  @ApiResponse({ 
    status: 200, 
    description: 'The inventory has been successfully updated', 
    type: ProductResponseDto 
  })
  async updateInventory(
    @Param('id') id: string,
    @Param('branchId') branchId: string,
    @Body('quantity') quantity: number
  ): Promise<ProductResponseDto> {
    return this.productsService.updateInventory(id, branchId, quantity);
  }

  @Patch(':id/flags')
  @AdminRoles('admin', 'superadmin')
  @ApiOperation({ summary: 'Update product flags' })
  @ApiResponse({ 
    status: 200, 
    description: 'The flags have been successfully updated', 
    type: ProductResponseDto 
  })
  async updateFlags(
    @Param('id') id: string,
    @Body() flags: any
  ): Promise<ProductResponseDto> {
    return this.productsService.updateProductFlags(id, flags);
  }

  @Post(':id/variants')
  @AdminRoles('admin', 'superadmin')
  @ApiOperation({ summary: 'Add a new variant to a product' })
  @ApiResponse({ 
    status: 200, 
    description: 'The variant has been successfully added', 
    type: ProductResponseDto 
  })
  async addVariant(
    @Param('id') id: string,
    @Body() variantDto: any
  ): Promise<ProductResponseDto> {
    return this.productsService.addVariant(id, variantDto);
  }

  @Patch(':id/variants/:variantId')
  @AdminRoles('admin', 'superadmin')
  @ApiOperation({ summary: 'Update a product variant' })
  @ApiResponse({ 
    status: 200, 
    description: 'The variant has been successfully updated', 
    type: ProductResponseDto 
  })
  async updateVariant(
    @Param('id') id: string,
    @Param('variantId') variantId: string,
    @Body() variantDto: any
  ): Promise<ProductResponseDto> {
    return this.productsService.updateVariant(id, variantId, variantDto);
  }

  @Delete(':id/variants/:variantId')
  @AdminRoles('admin', 'superadmin')
  @ApiOperation({ summary: 'Remove a product variant' })
  @ApiResponse({ 
    status: 200, 
    description: 'The variant has been successfully removed', 
    type: ProductResponseDto 
  })
  async removeVariant(
    @Param('id') id: string,
    @Param('variantId') variantId: string
  ): Promise<ProductResponseDto> {
    return this.productsService.removeVariant(id, variantId);
  }

  @Post(':id/upload-image')
  @AdminRoles('admin', 'superadmin')
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({ summary: 'Upload a product image' })
  @ApiResponse({ status: 200, description: 'Image uploaded successfully' })
  async uploadImage(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
    @Body('isPrimary') isPrimary: boolean | string
  ) {
    try {
      // Upload image to Cloudinary
      const result = await this.cloudinaryService.uploadImageFile(file.path, {
        folder: 'products',
      });

      // Create image object
      const image = {
        url: result.url,
        alt: file.originalname,
        publicId: result.publicId,
        isPrimary: isPrimary === true || isPrimary === 'true',
      };

      // Get the product
      const product = await this.productsService.findOne(id);

      // If this is the primary image, set all other images to non-primary
      const images = product.images || [];
      if (image.isPrimary) {
        images.forEach(img => (img.isPrimary = false));
      }

      // Add the new image
      images.push(image);

      // Update the product
      return this.productsService.update(id, { images });
    } catch (error) {
      this.logger.error(`Error uploading product image: ${error.message}`, error.stack);
      throw error;
    }
  }
}
