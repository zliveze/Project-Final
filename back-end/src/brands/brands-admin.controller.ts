import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards, HttpException, HttpStatus, Logger, Put, UploadedFile, UseInterceptors } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { BrandsService } from './brands.service';
import { 
  CreateBrandDto, 
  UpdateBrandDto, 
  QueryBrandDto,
  BrandResponseDto,
  PaginatedBrandsResponseDto,
  UploadBrandLogoDto
} from './dto';
import { AdminRoles } from '../common/decorators/admin-roles.decorator';
import { JwtAdminAuthGuard } from '../auth/guards/jwt-admin-auth.guard';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { Express } from 'express';
import * as path from 'path';
import * as fs from 'fs';

@ApiTags('Admin Brands')
@Controller('admin/brands')
@UseGuards(JwtAdminAuthGuard)
@AdminRoles('admin', 'superadmin')
@ApiBearerAuth()
export class BrandsAdminController {
  private readonly logger = new Logger(BrandsAdminController.name);
  
  constructor(
    private readonly brandsService: BrandsService,
    private readonly cloudinaryService: CloudinaryService
  ) {}

  @Post('upload/logo')
  @ApiOperation({ summary: 'Upload logo cho thương hiệu' })
  @ApiResponse({ status: 201, description: 'Upload logo thành công', type: Object })
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      fileFilter: (req, file, cb) => {
        // Chỉ chấp nhận file ảnh
        if (!file.mimetype.match(/\/(jpg|jpeg|png|gif)$/)) {
          return cb(new HttpException('Chỉ chấp nhận file ảnh (JPG, PNG, GIF)', HttpStatus.BAD_REQUEST), false);
        }
        cb(null, true);
      },
      limits: {
        fileSize: 5 * 1024 * 1024, // Giới hạn 5MB
      },
    }),
  )
  async uploadLogo(@UploadedFile() file: Express.Multer.File) {
    try {
      this.logger.log(`Đang xử lý upload logo thương hiệu`);
      
      if (!file) {
        throw new HttpException(
          'Không tìm thấy file ảnh',
          HttpStatus.BAD_REQUEST
        );
      }

      const tags = ['brand', 'logo'];
      
      this.logger.debug(`File tải lên: kích thước: ${file.size} bytes`);
      
      try {
        // Upload file lên Cloudinary trực tiếp từ buffer
        const result = await this.cloudinaryService.uploadImageBuffer(
          file.buffer,
          {
            folder: 'brands/logos',
            tags,
            transformation: {
              quality: 'auto',
              fetch_format: 'auto',
            }
          }
        );
        
        this.logger.log(`Upload logo file thành công: ${result.publicId}`);
        
        return {
          url: result.secureUrl,
          publicId: result.publicId,
          width: result.width,
          height: result.height,
          format: result.format
        };
      } catch (cloudinaryError) {
        this.logger.error(`Lỗi từ Cloudinary: ${cloudinaryError.message}`, cloudinaryError.stack);
        throw new HttpException(
          cloudinaryError.message || 'Lỗi khi upload ảnh lên Cloudinary',
          HttpStatus.BAD_REQUEST
        );
      }
    } catch (error) {
      this.logger.error(`Lỗi khi upload logo file: ${error.message}`, error.stack);
      throw new HttpException(
        error.message || 'Có lỗi xảy ra khi upload logo',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Post('upload-file/logo')
  @ApiOperation({ summary: 'Upload logo dưới dạng file trực tiếp' })
  @ApiResponse({ status: 201, description: 'Upload logo thành công', type: Object })
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      fileFilter: (req, file, cb) => {
        // Chỉ chấp nhận file ảnh
        if (!file.mimetype.match(/\/(jpg|jpeg|png|gif)$/)) {
          return cb(new HttpException('Chỉ chấp nhận file ảnh (JPG, PNG, GIF)', HttpStatus.BAD_REQUEST), false);
        }
        cb(null, true);
      },
      limits: {
        fileSize: 5 * 1024 * 1024, // Giới hạn 5MB
      },
    }),
  )
  async uploadLogoFile(@UploadedFile() file: Express.Multer.File) {
    try {
      this.logger.log(`Đang xử lý upload file logo thương hiệu`);
      
      if (!file) {
        throw new HttpException(
          'Không tìm thấy file ảnh',
          HttpStatus.BAD_REQUEST
        );
      }

      const tags = ['brand', 'logo'];
      
      this.logger.debug(`File tải lên: kích thước: ${file.size} bytes`);
      
      try {
        // Upload file lên Cloudinary trực tiếp từ buffer
        const result = await this.cloudinaryService.uploadImageBuffer(
          file.buffer,
          {
            folder: 'brands/logos',
            tags,
            transformation: {
              quality: 'auto',
              fetch_format: 'auto',
            }
          }
        );
        
        this.logger.log(`Upload logo file thành công: ${result.publicId}`);
        
        return {
          url: result.secureUrl,
          publicId: result.publicId,
          width: result.width,
          height: result.height,
          format: result.format
        };
      } catch (cloudinaryError) {
        this.logger.error(`Lỗi từ Cloudinary: ${cloudinaryError.message}`, cloudinaryError.stack);
        throw new HttpException(
          cloudinaryError.message || 'Lỗi khi upload ảnh lên Cloudinary',
          HttpStatus.BAD_REQUEST
        );
      }
    } catch (error) {
      this.logger.error(`Lỗi khi upload logo file: ${error.message}`, error.stack);
      throw new HttpException(
        error.message || 'Có lỗi xảy ra khi upload logo',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Post()
  @ApiOperation({ summary: 'Tạo thương hiệu mới' })
  @ApiResponse({ status: 201, description: 'Thương hiệu đã được tạo thành công', type: BrandResponseDto })
  async create(@Body() createBrandDto: CreateBrandDto) {
    try {
      this.logger.log(`Đang tạo thương hiệu mới: "${createBrandDto.name}"`);
      
      // Kiểm tra xem có logo hay không
      if (createBrandDto.logo?.url) {
        this.logger.log(`Sử dụng logo có sẵn: ${createBrandDto.logo.url.substring(0, 50)}...`);
      } else {
        this.logger.warn(`Thương hiệu "${createBrandDto.name}" được tạo mà không có logo`);
        this.logger.log(`Hãy upload logo sau khi tạo thương hiệu`);
      }
      
      const brand = await this.brandsService.create(createBrandDto);
      this.logger.log(`Thương hiệu đã được tạo thành công với ID: ${brand._id}`);
      return brand;
    } catch (error) {
      this.logger.error(`Lỗi khi tạo thương hiệu: ${error.message}`, error.stack);
      throw new HttpException(
        error.message || 'Có lỗi xảy ra khi tạo thương hiệu',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get()
  @ApiOperation({ summary: 'Lấy danh sách thương hiệu với phân trang và lọc' })
  @ApiResponse({ status: 200, description: 'Danh sách thương hiệu', type: PaginatedBrandsResponseDto })
  async findAll(@Query() queryDto: QueryBrandDto) {
    try {
      return this.brandsService.findAll(queryDto);
    } catch (error) {
      this.logger.error(`Lỗi khi lấy danh sách thương hiệu: ${error.message}`, error.stack);
      throw new HttpException(
        error.message || 'Có lỗi xảy ra khi lấy danh sách thương hiệu',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('statistics')
  @ApiOperation({ summary: 'Lấy thống kê về thương hiệu' })
  @ApiResponse({ status: 200, description: 'Thống kê thương hiệu' })
  async getStatistics() {
    try {
      this.logger.log('Lấy thống kê thương hiệu');
      return this.brandsService.getStatistics();
    } catch (error) {
      this.logger.error(`Lỗi khi lấy thống kê thương hiệu: ${error.message}`, error.stack);
      throw new HttpException(
        error.message || 'Có lỗi xảy ra khi lấy thống kê thương hiệu',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get(':id')
  @ApiOperation({ summary: 'Lấy chi tiết một thương hiệu' })
  @ApiResponse({ status: 200, description: 'Chi tiết thương hiệu', type: BrandResponseDto })
  @ApiResponse({ status: 404, description: 'Không tìm thấy thương hiệu' })
  async findOne(@Param('id') id: string) {
    try {
      this.logger.log(`Lấy chi tiết thương hiệu với ID: ${id}`);
      return this.brandsService.findOne(id);
    } catch (error) {
      this.logger.error(`Lỗi khi lấy chi tiết thương hiệu: ${error.message}`, error.stack);
      throw new HttpException(
        error.message || 'Có lỗi xảy ra khi lấy chi tiết thương hiệu',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Put(':id')
  @ApiOperation({ summary: 'Cập nhật thông tin thương hiệu' })
  @ApiResponse({ status: 200, description: 'Cập nhật thương hiệu thành công', type: BrandResponseDto })
  @ApiResponse({ status: 404, description: 'Không tìm thấy thương hiệu' })
  async update(@Param('id') id: string, @Body() updateBrandDto: UpdateBrandDto) {
    try {
      this.logger.log(`Cập nhật thương hiệu với ID: ${id}`);
      
      if (updateBrandDto.logo?.url) {
        this.logger.log(`Sử dụng URL logo đã cung cấp: ${updateBrandDto.logo.url.substring(0, 50)}...`);
      }
      
      return this.brandsService.update(id, updateBrandDto);
    } catch (error) {
      this.logger.error(`Lỗi khi cập nhật thương hiệu: ${error.message}`, error.stack);
      throw new HttpException(
        error.message || 'Có lỗi xảy ra khi cập nhật thương hiệu',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Patch(':id/toggle-status')
  @ApiOperation({ summary: 'Bật/tắt trạng thái thương hiệu' })
  @ApiResponse({ status: 200, description: 'Cập nhật trạng thái thành công', type: BrandResponseDto })
  @ApiResponse({ status: 404, description: 'Không tìm thấy thương hiệu' })
  async toggleStatus(@Param('id') id: string) {
    try {
      this.logger.log(`Thay đổi trạng thái thương hiệu với ID: ${id}`);
      return this.brandsService.toggleStatus(id);
    } catch (error) {
      this.logger.error(`Lỗi khi thay đổi trạng thái thương hiệu: ${error.message}`, error.stack);
      throw new HttpException(
        error.message || 'Có lỗi xảy ra khi thay đổi trạng thái thương hiệu',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Patch(':id/toggle-featured')
  @ApiOperation({ summary: 'Bật/tắt đánh dấu thương hiệu nổi bật' })
  @ApiResponse({ status: 200, description: 'Cập nhật trạng thái nổi bật thành công', type: BrandResponseDto })
  @ApiResponse({ status: 404, description: 'Không tìm thấy thương hiệu' })
  async toggleFeatured(@Param('id') id: string) {
    try {
      this.logger.log(`Thay đổi trạng thái nổi bật của thương hiệu với ID: ${id}`);
      return this.brandsService.toggleFeatured(id);
    } catch (error) {
      this.logger.error(`Lỗi khi thay đổi trạng thái nổi bật: ${error.message}`, error.stack);
      throw new HttpException(
        error.message || 'Có lỗi xảy ra khi thay đổi trạng thái nổi bật',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Xóa thương hiệu' })
  @ApiResponse({ status: 200, description: 'Xóa thương hiệu thành công', type: BrandResponseDto })
  @ApiResponse({ status: 404, description: 'Không tìm thấy thương hiệu' })
  async remove(@Param('id') id: string) {
    try {
      this.logger.log(`Xóa thương hiệu với ID: ${id}`);
      return this.brandsService.remove(id);
    } catch (error) {
      this.logger.error(`Lỗi khi xóa thương hiệu: ${error.message}`, error.stack);
      throw new HttpException(
        error.message || 'Có lỗi xảy ra khi xóa thương hiệu',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
} 