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
  UseInterceptors,
  Req,
  Res,
  StreamableFile,
  BadRequestException
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose'; // Import Model
import { Product, ProductDocument } from './schemas/product.schema'; // Import Product schema/document
import { ProductsService } from './products.service';
import {
  CreateProductDto,
  UpdateProductDto,
  QueryProductDto,
  ProductResponseDto,
  PaginatedProductsResponseDto,
  AdminListProductResponseDto,
  ProductPromotionCheckDto
} from './dto';
import { JwtAdminAuthGuard } from '../auth/guards/jwt-admin-auth.guard';
import { AdminRolesGuard } from '../auth/guards/admin-roles.guard';
import { AdminRoles } from '../common/decorators/admin-roles.decorator';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { createProductImportTemplate } from '../common/utils/excel.util';
import { createReadStream } from 'fs';
import { Response } from 'express';
import { join } from 'path';
import { diskStorage, memoryStorage } from 'multer';
import * as fs from 'fs';

@ApiTags('Admin Products')
@Controller('admin/products')
@UseGuards(JwtAdminAuthGuard, AdminRolesGuard)
@ApiBearerAuth()
export class ProductsAdminController {
  private readonly logger = new Logger(ProductsAdminController.name);

  constructor(
    @InjectModel(Product.name) private productModel: Model<ProductDocument>, // Inject Model
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

  @Get('top-products')
  @AdminRoles('admin', 'superadmin')
  @ApiOperation({ summary: 'Get top selling products' })
  @ApiResponse({
    status: 200,
    description: 'Returns top selling products',
    schema: {
      type: 'object',
      properties: {
        products: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              _id: { type: 'string' },
              name: { type: 'string' },
              slug: { type: 'string' },
              sku: { type: 'string' },
              price: { type: 'number' },
              currentPrice: { type: 'number' },
              status: { type: 'string' },
              imageUrl: { type: 'string' },
              brandId: { type: 'string' },
              brandName: { type: 'string' },
              categoryIds: { type: 'array' },
              flags: { type: 'object' },
              reviews: { type: 'object' },
              soldCount: { type: 'number' },
              totalQuantity30Days: { type: 'number', description: 'Only for 30-days period' },
              totalOrders30Days: { type: 'number', description: 'Only for 30-days period' }
            }
          }
        },
        period: { type: 'string', enum: ['all-time', '30-days'] },
        total: { type: 'number' },
        generatedAt: { type: 'string', format: 'date-time' }
      }
    }
  })
  async getTopProducts(
    @Query('period') period: 'all-time' | '30-days' = 'all-time',
    @Query('limit') limit: number = 5
  ) {
    return this.productsService.getTopProducts(period, limit);
  }

  @Post('check-promotions')
  @AdminRoles('admin', 'superadmin')
  @ApiOperation({ summary: 'Kiểm tra sản phẩm có trong Event hoặc Campaign nào không' })
  @ApiResponse({
    status: 200,
    description: 'Trả về thông tin về Event/Campaign chứa sản phẩm',
    type: [ProductPromotionCheckDto]
  })
  async checkProductsInPromotions(@Body() data: { productIds: string[] }) {
    return this.productsService.checkProductsInPromotions(data.productIds);
  }

  @Get('export-data') // Endpoint mới để xuất tất cả dữ liệu sản phẩm
  @AdminRoles('admin', 'superadmin')
  @ApiOperation({ summary: 'Export all products data to Excel' })
  @ApiResponse({
    status: 200,
    description: 'Returns all products data for export',
    // Kiểu trả về có thể là một mảng các đối tượng sản phẩm đầy đủ
    // Ví dụ: type: [ProductResponseDto] hoặc một DTO mới cho export
  })
  async exportAllProducts(@Query() queryDto: QueryProductDto) {
    try {
      this.logger.log('Yêu cầu xuất tất cả dữ liệu sản phẩm');
      // queryDto có thể chứa các filter nếu người dùng muốn xuất danh sách đã lọc
      return this.productsService.findAllForExport(queryDto);
    } catch (error) {
      this.logger.error(`Lỗi khi xuất tất cả dữ liệu sản phẩm: ${error.message}`, error.stack);
      throw error;
    }
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

  @Post(':id/inventory/:branchId/variant/:variantId')
  @AdminRoles('admin', 'superadmin')
  @ApiOperation({ summary: 'Update inventory for a specific variant in a specific branch' })
  @ApiResponse({
    status: 200,
    description: 'The variant inventory has been successfully updated',
    type: ProductResponseDto
  })
  async updateVariantInventory(
    @Param('id') id: string,
    @Param('branchId') branchId: string,
    @Param('variantId') variantId: string,
    @Body('quantity') quantity: number
  ): Promise<ProductResponseDto> {
    return this.productsService.updateVariantInventory(id, branchId, variantId, quantity);
  }

  @Post(':id/inventory/:branchId/variant/:variantId/combination/:combinationId')
  @AdminRoles('admin', 'superadmin')
  @ApiOperation({ summary: 'Update inventory for a specific combination in a specific branch' })
  @ApiResponse({
    status: 200,
    description: 'The combination inventory has been successfully updated',
    type: ProductResponseDto
  })
  async updateCombinationInventory(
    @Param('id') id: string,
    @Param('branchId') branchId: string,
    @Param('variantId') variantId: string,
    @Param('combinationId') combinationId: string,
    @Body('quantity') quantity: number
  ): Promise<ProductResponseDto> {
    return this.productsService.updateCombinationInventory(id, branchId, variantId, combinationId, quantity);
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

      // Kiểm tra buffer có tồn tại không
      if (!image.buffer || image.buffer.length === 0) {
        this.logger.error('Image buffer is empty or missing');
        throw new Error('Buffer hình ảnh trống hoặc không tồn tại');
      }

      // Upload image to Cloudinary từ buffer
      this.logger.log(`Uploading to Cloudinary from buffer`);
      const result = await this.cloudinaryService.uploadImageBuffer(image.buffer, {
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
        url: result.secureUrl,
        alt: image.originalname || 'Product image',
        publicId: result.publicId,
        isPrimary: isPrimary === true || isPrimary === 'true',
      };

      this.logger.log(`Image uploaded to Cloudinary successfully: ${JSON.stringify(imageObj)}`);

      // Call the service method to add the image and update the product
      this.logger.log(`Calling service to add image to product ID: ${id}`);
      const updatedProductDto = await this.productsService.addImageToProduct(id, imageObj);
      this.logger.log(`Service successfully added image to product ID: ${id}`);

      return updatedProductDto; // Return the DTO from the service

    } catch (error) {
      this.logger.error(`Error uploading product image for ID ${id}: ${error.message}`, error.stack);
      // Rethrow the error so the frontend knows the upload failed
      throw error;
    }
  }

  @Post('import/excel')
  @AdminRoles('admin', 'superadmin')
  @ApiOperation({ summary: 'Import products from Excel file' })
  @ApiResponse({
    status: 201,
    description: 'Products have been successfully imported',
  })
  @UseInterceptors(FileInterceptor('file', {
    storage: memoryStorage(),
    fileFilter: function(req: any, file: any, cb: any) {
      try {
        // Nếu file không tồn tại hoặc không có thuộc tính originalname
        if (!file || !file.originalname || !file.originalname.match(/\.(xlsx|xls)$/)) {
          return cb(new Error('Chỉ hỗ trợ file Excel (xlsx, xls)'), false);
        }

        // Nếu file hợp lệ
        const logger = new Logger('FileInterceptor');
        logger.log(`File Excel hợp lệ: ${file.originalname}`);
        return cb(null, true);
      } catch (error) {
        return cb(error, false);
      }
    },
    limits: {
      fileSize: 10 * 1024 * 1024, // Giới hạn 10MB
    }
  }))
  async importProductsFromExcel(
    @UploadedFile() file: Express.Multer.File,
    @Body('branchId') branchId: string,
    @Req() request: any
  ) {
    try {
      if (!file) {
        this.logger.error('Không tìm thấy file Excel trong request');
        throw new BadRequestException('Không tìm thấy file Excel');
      }

      this.logger.log(`Nhận được file: ${file.originalname}, kích thước: ${file.size} bytes, mimetype: ${file.mimetype}`);

      if (!branchId) {
        this.logger.error('Không tìm thấy branchId trong request');
        throw new BadRequestException('Vui lòng chọn chi nhánh');
      }

      const userId = request.user?.id || request.user?._id || request.user?.userId || 'unknown';
      this.logger.log(`Tiến hành import sản phẩm từ Excel cho chi nhánh: ${branchId}, userId: ${userId}`);
      return await this.productsService.importProductsFromExcel(file, branchId, userId);
    } catch (error) {
      this.logger.error(`Error importing products from Excel: ${error.message}`, error.stack);
      if (error instanceof BadRequestException) {
        throw error; // Re-throw BadRequestException as is
      }
      throw new BadRequestException(`Lỗi khi import sản phẩm: ${error.message}`);
    }
  }

  @Post(':id/clone')
  @AdminRoles('admin', 'superadmin')
  @ApiOperation({ summary: 'Nhân bản sản phẩm' })
  @ApiResponse({
    status: 201,
    description: 'Sản phẩm đã được nhân bản thành công',
    type: ProductResponseDto
  })
  @ApiResponse({ status: 404, description: 'Không tìm thấy sản phẩm' })
  async cloneProduct(@Param('id') id: string): Promise<ProductResponseDto> {
    this.logger.log(`Yêu cầu nhân bản sản phẩm ID: ${id}`);
    return this.productsService.cloneProduct(id);
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

  @Get('templates/import-excel')
  @AdminRoles('admin', 'superadmin')
  @ApiOperation({ summary: 'Download product import template Excel file' })
  async downloadExcelTemplate(@Res({ passthrough: true }) res: Response): Promise<StreamableFile> {
    try {
      this.logger.log('Tạo file mẫu Excel cho import sản phẩm');
      const filePath = createProductImportTemplate();

      const file = createReadStream(filePath);
      res.set({
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': 'attachment; filename="product-import-template.xlsx"',
      });

      return new StreamableFile(file);
    } catch (error) {
      this.logger.error(`Error creating Excel template: ${error.message}`, error.stack);
      throw error;
    }
  }

  @Post('cleanup-orphaned-inventory')
  @AdminRoles('admin', 'superadmin')
  @ApiOperation({ summary: 'Dọn dẹp dữ liệu inventory rác (tham chiếu đến branch không tồn tại)' })
  @ApiResponse({
    status: 200,
    description: 'Kết quả dọn dẹp dữ liệu rác',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        cleaned: { type: 'number' },
        details: {
          type: 'object',
          properties: {
            productsCleaned: { type: 'number' },
            regularInventory: { type: 'number' },
            variantInventory: { type: 'number' },
            combinationInventory: { type: 'number' }
          }
        }
      }
    }
  })
  async cleanupOrphanedInventory(): Promise<{ success: boolean; cleaned: number; details: any }> {
    try {
      this.logger.log('Nhận yêu cầu dọn dẹp dữ liệu inventory rác từ admin');
      return this.productsService.cleanupOrphanedInventory();
    } catch (error) {
      this.logger.error(`Lỗi khi dọn dẹp dữ liệu inventory rác: ${error.message}`, error.stack);
      throw error;
    }
  }

  // Đã di chuyển exportAllProducts lên trên, không cần định nghĩa lại ở đây.
}
