import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
  HttpCode,
  HttpStatus,
  BadRequestException,
  Put, // Thêm Put
} from '@nestjs/common';
import { OrdersService } from './orders.service';
import { CreateOrderDto, UpdateOrderDto, QueryOrderDto, UpdateViettelPostStatusDto } from './dto'; // Thêm UpdateViettelPostStatusDto
import { JwtAdminAuthGuard } from '../auth/guards/jwt-admin-auth.guard';
import { AdminRoles } from '../common/decorators/admin-roles.decorator';
import { AdminRolesGuard } from '../auth/guards/admin-roles.guard';
import { OrderStatus } from './schemas/order.schema';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';

@ApiTags('Admin/Orders')
@Controller('admin/orders')
@UseGuards(JwtAdminAuthGuard, AdminRolesGuard)
@AdminRoles('admin', 'superadmin')
export class OrdersAdminController {
  constructor(private readonly ordersService: OrdersService) {}

  @Get('stats')
  @ApiOperation({ summary: 'Lấy thống kê đơn hàng (Admin)' })
  @ApiResponse({ status: 200, description: 'Trả về dữ liệu thống kê đơn hàng' })
  async getOrderStats(@Query('period') period?: string) {
    return this.ordersService.getOrderStatsForAdmin(period);
  }

  @Get()
  @ApiOperation({ summary: 'Lấy danh sách đơn hàng (Admin)' })
  @ApiResponse({ status: 200, description: 'Trả về danh sách đơn hàng có phân trang' })
  async findAll(@Query() queryDto: QueryOrderDto) {
    return this.ordersService.findAll(queryDto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Lấy thông tin chi tiết đơn hàng (Admin)' })
  @ApiParam({ name: 'id', description: 'ID của đơn hàng' })
  @ApiResponse({ status: 200, description: 'Trả về thông tin chi tiết đơn hàng' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy đơn hàng' })
  async findOne(@Param('id') id: string) {
    return this.ordersService.findOne(id);
  }

  @Get(':id/tracking')
  @ApiOperation({ summary: 'Lấy thông tin theo dõi đơn hàng (Admin)' })
  @ApiParam({ name: 'id', description: 'ID của đơn hàng' })
  @ApiResponse({ status: 200, description: 'Trả về thông tin theo dõi đơn hàng' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy thông tin theo dõi đơn hàng' })
  async getOrderTracking(@Param('id') id: string) {
    return this.ordersService.getOrderTracking(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Cập nhật thông tin đơn hàng (Admin)' })
  @ApiParam({ name: 'id', description: 'ID của đơn hàng' })
  @ApiBody({ type: UpdateOrderDto })
  @ApiResponse({ status: 200, description: 'Trả về thông tin đơn hàng đã cập nhật' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy đơn hàng' })
  async update(@Param('id') id: string, @Body() updateOrderDto: UpdateOrderDto) {
    return this.ordersService.update(id, updateOrderDto);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Cập nhật trạng thái đơn hàng (Admin)' })
  @ApiParam({ name: 'id', description: 'ID của đơn hàng' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        status: {
          type: 'string',
          enum: Object.values(OrderStatus),
          description: 'Trạng thái mới của đơn hàng',
        },
        reason: {
          type: 'string',
          description: 'Lý do cập nhật trạng thái (tùy chọn)',
        },
      },
      required: ['status'],
    },
  })
  @ApiResponse({ status: 200, description: 'Trả về thông tin đơn hàng đã cập nhật trạng thái' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy đơn hàng' })
  async updateStatus(
    @Param('id') id: string,
    @Body('status') status: OrderStatus,
    @Body('reason') reason?: string,
  ) {
    if (status === OrderStatus.CANCELLED) {
      if (!reason) {
        throw new BadRequestException('Reason is required when cancelling an order');
      }
      return this.ordersService.cancelOrder(id, reason);
    }
    return this.ordersService.updateStatus(id, status);
  }

  @Post(':id/shipment')
  @ApiOperation({ summary: 'Tạo vận đơn Viettel Post cho đơn hàng (Admin)' })
  @ApiParam({ name: 'id', description: 'ID của đơn hàng' })
  @ApiResponse({ status: 201, description: 'Trả về thông tin vận đơn đã tạo' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy đơn hàng' })
  @ApiResponse({ status: 400, description: 'Đơn hàng đã có vận đơn hoặc không thể tạo vận đơn' })
  @HttpCode(HttpStatus.CREATED)
  async createShipment(@Param('id') id: string) {
    const order = await this.ordersService.findOne(id);
    return this.ordersService.createViettelPostShipment(order);
  }

  @Get(':id/tracking-info')
  @ApiOperation({ summary: 'Lấy thông tin chi tiết vận đơn từ Viettel Post (Admin)' })
  @ApiParam({ name: 'id', description: 'ID của đơn hàng' })
  @ApiResponse({ status: 200, description: 'Trả về thông tin chi tiết vận đơn' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy đơn hàng hoặc vận đơn' })
  async getShipmentInfo(@Param('id') id: string) {
    const order = await this.ordersService.findOne(id);

    if (!order.trackingCode) {
      throw new BadRequestException(`Order ${id} does not have a tracking code`);
    }

    try {
      const trackingInfo = await this.ordersService.getViettelPostTrackingInfo(order.trackingCode);
      return {
        success: true,
        data: trackingInfo
      };
    } catch (error) {
      console.error(`Failed to get tracking information: ${error.message}`);
      throw new BadRequestException('Không thể lấy thông tin vận đơn. Vui lòng thử lại sau.');
    }
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Xóa đơn hàng (Admin)' })
  @ApiParam({ name: 'id', description: 'ID của đơn hàng' })
  @ApiResponse({ status: 200, description: 'Đơn hàng đã được xóa thành công' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy đơn hàng' })
  @ApiResponse({ status: 400, description: 'Chỉ có thể xóa đơn hàng đã hủy' })
  async remove(@Param('id') id: string) {
    return this.ordersService.remove(id);
  }

  @Put(':id/viettelpost-status')
  @ApiOperation({ summary: 'Cập nhật trạng thái đơn hàng trên Viettel Post (Admin)' })
  @ApiParam({ name: 'id', description: 'ID của đơn hàng trong hệ thống Yumin' })
  @ApiBody({ type: UpdateViettelPostStatusDto, description: 'Thông tin cập nhật trạng thái Viettel Post. ORDER_NUMBER phải là mã vận đơn Viettel Post của đơn hàng này.' })
  @ApiResponse({ status: 200, description: 'Trả về kết quả từ API Viettel Post' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy đơn hàng' })
  @ApiResponse({ status: 400, description: 'Dữ liệu không hợp lệ hoặc lỗi từ Viettel Post' })
  async updateViettelPostStatus(
    @Param('id') id: string,
    @Body() updateVtpStatusDto: UpdateViettelPostStatusDto,
  ) {
    // Đảm bảo rằng ORDER_NUMBER trong DTO khớp với trackingCode của đơn hàng (nếu cần)
    // Hoặc logic nghiệp vụ cho phép admin chỉ định một ORDER_NUMBER khác (ít khả năng)
    // Trong trường hợp này, OrdersService sẽ kiểm tra sự khớp lệnh nếu cần.
    return this.ordersService.updateViettelPostOrderStatus(id, updateVtpStatusDto);
  }

  @Post(':id/viettelpost-resend-webhook')
  @ApiOperation({ summary: 'Yêu cầu Viettel Post gửi lại webhook cho đơn hàng (Admin)' })
  @ApiParam({ name: 'id', description: 'ID của đơn hàng trong hệ thống Yumin' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        reason: {
          type: 'string',
          description: 'Lý do yêu cầu gửi lại webhook (tùy chọn)',
          example: 'Webhook trước đó bị lỗi xử lý',
        },
      },
    },
    required: false,
  })
  @ApiResponse({ status: 200, description: 'Trả về kết quả từ API Viettel Post (thường là thông báo thành công)' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy đơn hàng hoặc đơn hàng không có mã vận đơn' })
  @ApiResponse({ status: 400, description: 'Lỗi từ Viettel Post' })
  async requestResendViettelPostWebhook(
    @Param('id') id: string,
    @Body('reason') reason?: string,
  ) {
    return this.ordersService.requestViettelPostResendWebhook(id, reason);
  }
}
