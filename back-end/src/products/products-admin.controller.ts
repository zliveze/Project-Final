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
  AdminListProductResponseDto
} from './dto';
import { JwtAdminAuthGuard } from '../auth/guards/jwt-admin-auth.guard';
import { AdminRolesGuard } from '../auth/guards/admin-roles.guard';
import { AdminRoles } from '../common/decorators/admin-roles.decorator';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { createProductImportTemplate } from '../common/utils/excel.util';
import { createReadStream } from 'fs';
import { Response } from 'express';
import { join } from 'path';
import { diskStorage } from 'multer';
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
    storage: diskStorage({
      destination: (req, file, cb) => {
        const uploadPath = join(process.cwd(), 'uploads');
        console.log('Upload path:', uploadPath);

        // Kiểm tra thư mục tồn tại
        fs.access(uploadPath, (err) => {
          if (err) {
            // Nếu thư mục không tồn tại, tạo mới
            console.log('Directory does not exist, creating it');
            return fs.mkdir(uploadPath, { recursive: true }, (err) => {
              if (err) return cb(err, uploadPath);
              console.log('Directory created');
              return cb(null, uploadPath);
            });
          }

          console.log('Directory already exists');
          // Kiểm tra quyền ghi
          fs.access(uploadPath, fs.constants.W_OK, (err) => {
            if (err) {
              console.log('Directory is not writable');
              return cb(new Error('Directory is not writable'), uploadPath);
            }
            console.log('Directory is writable');
            return cb(null, uploadPath);
          });
        });
      },
      filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        const originalName = file.originalname;
        const filename = `${uniqueSuffix}-${originalName}`;
        console.log('Generated filename:', filename);
        cb(null, filename);
      }
    }),
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
}
