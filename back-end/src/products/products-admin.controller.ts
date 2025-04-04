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
  PaginatedProductsResponseDto,
  AdminListProductResponseDto
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

  @Get('list')
  @AdminRoles('admin', 'superadmin')
  @ApiOperation({ summary: 'Get products in optimized format for admin UI' })
  @ApiResponse({ 
    status: 200, 
    description: 'Returns paginated products optimized for admin UI', 
    type: AdminListProductResponseDto 
  })
  async findAllForAdmin(@Query() queryDto: QueryProductDto): Promise<AdminListProductResponseDto> {
    return this.productsService.findAllForAdmin(queryDto);
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
  @UseInterceptors(FileInterceptor('image'))
  @ApiOperation({ summary: 'Upload a product image' })
  @ApiResponse({ status: 200, description: 'Image uploaded successfully' })
  async uploadImage(
    @Param('id') id: string,
    @UploadedFile() image: Express.Multer.File,
    @Body('isPrimary') isPrimary: boolean | string
  ) {
    try {
      // Kiểm tra file tải lên
      if (!image) {
        this.logger.error('No image file provided in the request');
        throw new Error('Không tìm thấy file ảnh trong yêu cầu');
      }

      this.logger.log(`Received image upload request: ${image.originalname}, size: ${image.size}, mimetype: ${image.mimetype}`);
      this.logger.log(`File path: ${image.path}, destination: ${image.destination}`);
      
      // Kiểm tra thư mục upload có tồn tại không
      const fs = require('fs');
      if (!fs.existsSync(image.path)) {
        this.logger.error(`File path does not exist: ${image.path}`);
        throw new Error(`File không tồn tại tại đường dẫn: ${image.path}`);
      }
      
      // Upload image to Cloudinary
      this.logger.log(`Uploading to Cloudinary from path: ${image.path}`);
      const result = await this.cloudinaryService.uploadImageFile(image.path, {
        folder: 'products',
      });

      // Kiểm tra xem kết quả từ Cloudinary có chứa URL và publicId hợp lệ không
      if (!result || !result.url || !result.publicId) {
        this.logger.error('Invalid response from Cloudinary upload');
        throw new Error('Không nhận được URL hợp lệ từ Cloudinary');
      }

      // Kiểm tra URL có phải dạng base64 không
      if (result.url.startsWith('data:image')) {
        this.logger.error('Received base64 URL from Cloudinary instead of a proper URL');
        throw new Error('Nhận được URL không hợp lệ từ Cloudinary');
      }

      // Create image object
      const imageObj = {
        url: result.url,
        alt: image.originalname || 'Product image',
        publicId: result.publicId,
        isPrimary: isPrimary === true || isPrimary === 'true',
      };

      this.logger.log(`Image uploaded to Cloudinary successfully: ${JSON.stringify(imageObj)}`); // Log 1: Confirms imageObj creation

      // Get the product
      this.logger.log(`Getting product with ID: ${id}`);
      const product = await this.productsService.findOne(id);

      // If this is the primary image, set all other images to non-primary
      const images = product.images || [];
      if (imageObj.isPrimary) {
        images.forEach(img => (img.isPrimary = false));
      }

      // Lọc bỏ các ảnh có URL base64 còn sót lại trong mảng images
      const filteredImages = images.filter(img => !img.url || !img.url.startsWith('data:image'));
      
      // Add the new image
      filteredImages.push(imageObj);

      // Update the product
      this.logger.log(`Updating product with new image, total images: ${filteredImages.length}`);
      this.logger.debug(`[Controller uploadImage] Images array prepared for service update: ${JSON.stringify(filteredImages, null, 2)}`); // Log 2: Check array before service call
      return this.productsService.update(id, { images: filteredImages });
    } catch (error) {
      this.logger.error(`Error uploading product image: ${error.message}`, error.stack);
      // Rethrow the error so the frontend knows the upload failed
      throw error;
    }
  }

  @Post('cleanup-base64')
  @AdminRoles('admin', 'superadmin')
  @ApiOperation({ summary: 'Dọn dẹp dữ liệu base64 trong database của sản phẩm' })
  @ApiResponse({ status: 200, description: 'Dọn dẹp dữ liệu base64 thành công' })
  async cleanupBase64Images() {
    try {
      this.logger.log('Nhận yêu cầu dọn dẹp dữ liệu base64 từ admin');
      return this.productsService.cleanupBase64Images();
    } catch (error) {
      this.logger.error(`Lỗi khi dọn dẹp dữ liệu base64: ${error.message}`, error.stack);
      throw error;
    }
  }
}
