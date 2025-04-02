import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';
import { 
  CreateNotificationDto, 
  UpdateNotificationDto, 
  QueryNotificationDto,
  NotificationResponseDto,
  PaginatedNotificationsResponseDto
} from './dto';
import { AdminRoles } from '../common/decorators/admin-roles.decorator';
import { JwtAdminAuthGuard } from '../auth/guards/jwt-admin-auth.guard';

@ApiTags('Admin Notifications')
@Controller('admin/notifications')
@UseGuards(JwtAdminAuthGuard)
@AdminRoles('admin', 'superadmin')
@ApiBearerAuth()
export class NotificationsAdminController {
  private readonly logger = new Logger(NotificationsAdminController.name);
  private readonly isDebugEnabled = process.env.NODE_ENV !== 'production'; // Chỉ log nếu không phải môi trường production
  
  constructor(private readonly notificationsService: NotificationsService) {}

  // Phương thức log tùy chỉnh để giảm số lượng log
  private customLog(message: string, isImportant = false) {
    if (isImportant || this.isDebugEnabled) {
      this.logger.log(message);
    }
  }

  @Post()
  @ApiOperation({ summary: 'Tạo thông báo mới' })
  @ApiResponse({ status: 201, description: 'Tạo thông báo thành công', type: NotificationResponseDto })
  async create(@Body() createNotificationDto: CreateNotificationDto) {
    try {
      const result = await this.notificationsService.create(createNotificationDto);
      this.customLog(`Tạo thông báo mới thành công với ID: ${result._id}`, true);
      return result;
    } catch (error) {
      this.logger.error(`Lỗi khi tạo thông báo: ${error.message}`, error.stack);
      throw new HttpException(
        error.message || 'Có lỗi xảy ra khi tạo thông báo',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get()
  @ApiOperation({ summary: 'Lấy danh sách thông báo với phân trang và lọc' })
  @ApiResponse({ status: 200, description: 'Danh sách thông báo', type: PaginatedNotificationsResponseDto })
  async findAll(@Query() queryDto: QueryNotificationDto) {
    try {
      return this.notificationsService.findAll(queryDto);
    } catch (error) {
      this.logger.error(`Lỗi khi lấy danh sách thông báo: ${error.message}`, error.stack);
      throw new HttpException(
        error.message || 'Có lỗi xảy ra khi lấy danh sách thông báo',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('statistics')
  @ApiOperation({ summary: 'Lấy thống kê về thông báo' })
  @ApiResponse({ status: 200, description: 'Thống kê thông báo' })
  async getStatistics() {
    try {
      return this.notificationsService.getStatistics();
    } catch (error) {
      this.logger.error(`Lỗi khi lấy thống kê thông báo: ${error.message}`, error.stack);
      throw new HttpException(
        error.message || 'Có lỗi xảy ra khi lấy thống kê thông báo',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get(':id')
  @ApiOperation({ summary: 'Lấy chi tiết một thông báo' })
  @ApiResponse({ status: 200, description: 'Chi tiết thông báo', type: NotificationResponseDto })
  @ApiResponse({ status: 404, description: 'Không tìm thấy thông báo' })
  async findOne(@Param('id') id: string) {
    try {
      return this.notificationsService.findOne(id);
    } catch (error) {
      this.logger.error(`Lỗi khi lấy chi tiết thông báo: ${error.message}`, error.stack);
      throw new HttpException(
        error.message || 'Có lỗi xảy ra khi lấy chi tiết thông báo',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Cập nhật thông tin thông báo' })
  @ApiResponse({ status: 200, description: 'Cập nhật thông báo thành công', type: NotificationResponseDto })
  @ApiResponse({ status: 404, description: 'Không tìm thấy thông báo' })
  async update(@Param('id') id: string, @Body() updateNotificationDto: UpdateNotificationDto) {
    try {
      return this.notificationsService.update(id, updateNotificationDto);
    } catch (error) {
      this.logger.error(`Lỗi khi cập nhật thông báo: ${error.message}`, error.stack);
      throw new HttpException(
        error.message || 'Có lỗi xảy ra khi cập nhật thông báo',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Patch(':id/toggle-status')
  @ApiOperation({ summary: 'Bật/tắt trạng thái thông báo' })
  @ApiResponse({ status: 200, description: 'Cập nhật trạng thái thành công', type: NotificationResponseDto })
  @ApiResponse({ status: 404, description: 'Không tìm thấy thông báo' })
  async toggleStatus(@Param('id') id: string) {
    try {
      return this.notificationsService.toggleStatus(id);
    } catch (error) {
      this.logger.error(`Lỗi khi thay đổi trạng thái thông báo: ${error.message}`, error.stack);
      throw new HttpException(
        error.message || 'Có lỗi xảy ra khi thay đổi trạng thái thông báo',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Xóa thông báo' })
  @ApiResponse({ status: 200, description: 'Xóa thông báo thành công', type: NotificationResponseDto })
  @ApiResponse({ status: 404, description: 'Không tìm thấy thông báo' })
  async remove(@Param('id') id: string) {
    try {
      return this.notificationsService.remove(id);
    } catch (error) {
      this.logger.error(`Lỗi khi xóa thông báo: ${error.message}`, error.stack);
      throw new HttpException(
        error.message || 'Có lỗi xảy ra khi xóa thông báo',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
} 