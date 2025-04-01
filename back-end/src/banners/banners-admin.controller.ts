import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { BannersService } from './banners.service';
import { 
  CreateBannerDto, 
  UpdateBannerDto, 
  QueryBannerDto,
  BannerResponseDto,
  PaginatedBannersResponseDto
} from './dto';
import { AdminRoles } from '../common/decorators/admin-roles.decorator';
import { JwtAdminAuthGuard } from '../auth/guards/jwt-admin-auth.guard';

@ApiTags('Admin Banners')
@Controller('admin/banners')
@UseGuards(JwtAdminAuthGuard)
@AdminRoles('admin', 'superadmin')
@ApiBearerAuth()
export class BannersAdminController {
  private readonly logger = new Logger(BannersAdminController.name);
  
  constructor(private readonly bannersService: BannersService) {}

  @Post()
  @ApiOperation({ summary: 'Tạo banner mới' })
  @ApiResponse({ status: 201, description: 'Tạo banner thành công', type: BannerResponseDto })
  async create(@Body() createBannerDto: CreateBannerDto) {
    try {
      return this.bannersService.create(createBannerDto);
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
      this.logger.log('Lấy thống kê banner');
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
      this.logger.log(`Lấy chi tiết banner với ID: ${id}`);
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
      this.logger.log(`Cập nhật banner với ID: ${id}, dữ liệu: ${JSON.stringify(updateBannerDto)}`);
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
      this.logger.log(`Thay đổi trạng thái banner với ID: ${id}`);
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
      
      this.logger.log(`Thay đổi thứ tự banner ID: ${id}, hướng: ${direction}`);
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
      this.logger.log(`Xóa banner với ID: ${id}`);
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