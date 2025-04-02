import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { BannersService } from './banners.service';
import { 
  CreateBannerDto, 
  UpdateBannerDto, 
  QueryBannerDto,
  BannerResponseDto,
  PaginatedBannersResponseDto,
  UploadBannerImageDto
} from './dto';
import { AdminRoles } from '../common/decorators/admin-roles.decorator';
import { JwtAdminAuthGuard } from '../auth/guards/jwt-admin-auth.guard';
import { CloudinaryService } from '../cloudinary/cloudinary.service';

@ApiTags('Admin Banners')
@Controller('admin/banners')
@UseGuards(JwtAdminAuthGuard)
@AdminRoles('admin', 'superadmin')
@ApiBearerAuth()
export class BannersAdminController {
  private readonly logger = new Logger(BannersAdminController.name);
  private readonly isDebugEnabled = process.env.NODE_ENV !== 'production'; // Chỉ log nếu không phải môi trường production
  
  constructor(
    private readonly bannersService: BannersService,
    private readonly cloudinaryService: CloudinaryService
  ) {}

  // Phương thức log tùy chỉnh để giảm số lượng log
  private customLog(message: string, isImportant = false) {
    if (isImportant || this.isDebugEnabled) {
      this.logger.log(message);
    }
  }

  @Post('upload/image')
  @ApiOperation({ summary: 'Upload ảnh cho banner' })
  @ApiResponse({ status: 201, description: 'Upload ảnh thành công', type: Object })
  async uploadImage(@Body() uploadImageDto: UploadBannerImageDto) {
    try {
      const { imageData, type, campaignId } = uploadImageDto;
      
      const tags = ['banner', type];
      if (campaignId) {
        tags.push(`campaign-${campaignId}`);
      }
      
      this.logger.debug(`Xử lý upload ảnh banner: ${type}`);
      
      try {
        const result = await this.cloudinaryService.uploadImage(imageData, {
          folder: 'banner',
          tags,
          transformation: {
            quality: 'auto',
            fetch_format: 'auto',
          }
        });
        
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
      this.logger.error(`Lỗi khi upload ảnh: ${error.message}`, error.stack);
      throw new HttpException(
        error.message || 'Có lỗi xảy ra khi upload ảnh',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Post()
  @ApiOperation({ summary: 'Tạo banner mới' })
  @ApiResponse({ status: 201, description: 'Banner đã được tạo thành công', type: Object })
  async create(@Body() createBannerDto: CreateBannerDto) {
    try {
      const banner = await this.bannersService.create(createBannerDto);
      this.customLog(`Banner đã được tạo thành công với ID: ${banner._id}`, true);
      return banner;
    } catch (error) {
      this.logger.error(`Lỗi khi tạo banner: ${error.message}`, error.stack);
      throw new HttpException(
        error.message || 'Có lỗi xảy ra khi tạo banner',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get()
  @ApiOperation({ summary: 'Lấy danh sách banner với phân trang và lọc' })
  @ApiResponse({ status: 200, description: 'Danh sách banner', type: PaginatedBannersResponseDto })
  async findAll(@Query() queryDto: QueryBannerDto) {
    try {
      return this.bannersService.findAll(queryDto);
    } catch (error) {
      this.logger.error(`Lỗi khi lấy danh sách banner: ${error.message}`, error.stack);
      throw new HttpException(
        error.message || 'Có lỗi xảy ra khi lấy danh sách banner',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('statistics')
  @ApiOperation({ summary: 'Lấy thống kê về banner' })
  @ApiResponse({ status: 200, description: 'Thống kê banner' })
  async getStatistics() {
    try {
      return this.bannersService.getStatistics();
    } catch (error) {
      this.logger.error(`Lỗi khi lấy thống kê banner: ${error.message}`, error.stack);
      throw new HttpException(
        error.message || 'Có lỗi xảy ra khi lấy thống kê banner',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get(':id')
  @ApiOperation({ summary: 'Lấy chi tiết một banner' })
  @ApiResponse({ status: 200, description: 'Chi tiết banner', type: BannerResponseDto })
  @ApiResponse({ status: 404, description: 'Không tìm thấy banner' })
  async findOne(@Param('id') id: string) {
    try {
      return this.bannersService.findOne(id);
    } catch (error) {
      this.logger.error(`Lỗi khi lấy chi tiết banner: ${error.message}`, error.stack);
      throw new HttpException(
        error.message || 'Có lỗi xảy ra khi lấy chi tiết banner',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Cập nhật thông tin banner' })
  @ApiResponse({ status: 200, description: 'Cập nhật banner thành công', type: BannerResponseDto })
  @ApiResponse({ status: 404, description: 'Không tìm thấy banner' })
  async update(@Param('id') id: string, @Body() updateBannerDto: UpdateBannerDto) {
    try {
      return this.bannersService.update(id, updateBannerDto);
    } catch (error) {
      this.logger.error(`Lỗi khi cập nhật banner: ${error.message}`, error.stack);
      throw new HttpException(
        error.message || 'Có lỗi xảy ra khi cập nhật banner',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Patch(':id/toggle-status')
  @ApiOperation({ summary: 'Bật/tắt trạng thái banner' })
  @ApiResponse({ status: 200, description: 'Cập nhật trạng thái thành công', type: BannerResponseDto })
  @ApiResponse({ status: 404, description: 'Không tìm thấy banner' })
  async toggleStatus(@Param('id') id: string) {
    try {
      return this.bannersService.toggleStatus(id);
    } catch (error) {
      this.logger.error(`Lỗi khi thay đổi trạng thái banner: ${error.message}`, error.stack);
      throw new HttpException(
        error.message || 'Có lỗi xảy ra khi thay đổi trạng thái banner',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Patch(':id/change-order/:direction')
  @ApiOperation({ summary: 'Thay đổi thứ tự hiển thị (lên/xuống)' })
  @ApiResponse({ status: 200, description: 'Thay đổi thứ tự thành công', type: [BannerResponseDto] })
  @ApiResponse({ status: 404, description: 'Không tìm thấy banner' })
  async changeOrder(@Param('id') id: string, @Param('direction') direction: 'up' | 'down') {
    try {
      if (direction !== 'up' && direction !== 'down') {
        throw new HttpException(
          'Hướng di chuyển phải là "up" hoặc "down"',
          HttpStatus.BAD_REQUEST
        );
      }
      
      return this.bannersService.changeOrder(id, direction);
    } catch (error) {
      this.logger.error(`Lỗi khi thay đổi thứ tự banner: ${error.message}`, error.stack);
      throw new HttpException(
        error.message || 'Có lỗi xảy ra khi thay đổi thứ tự banner',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Xóa banner' })
  @ApiResponse({ status: 200, description: 'Xóa banner thành công', type: BannerResponseDto })
  @ApiResponse({ status: 404, description: 'Không tìm thấy banner' })
  async remove(@Param('id') id: string) {
    try {
      return this.bannersService.remove(id);
    } catch (error) {
      this.logger.error(`Lỗi khi xóa banner: ${error.message}`, error.stack);
      throw new HttpException(
        error.message || 'Có lỗi xảy ra khi xóa banner',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
} 