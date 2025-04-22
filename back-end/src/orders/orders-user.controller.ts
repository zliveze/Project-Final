import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Query,
  Patch,
  BadRequestException,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { OrdersService } from './orders.service';
import { CreateOrderDto, QueryOrderDto, CalculateShippingDto } from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/user.decorator';
import { OrderStatus } from './schemas/order.schema';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';

@ApiTags('Orders')
@Controller('orders')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class OrdersUserController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  @ApiOperation({ summary: 'Tạo đơn hàng mới' })
  @ApiBody({ type: CreateOrderDto })
  @ApiResponse({ status: 201, description: 'Đơn hàng đã được tạo thành công' })
  @ApiResponse({ status: 400, description: 'Dữ liệu không hợp lệ' })
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body() createOrderDto: CreateOrderDto,
    @CurrentUser('userId') userId: string,
  ) {
    return this.ordersService.create(createOrderDto, userId);
  }

  @Get()
  @ApiOperation({ summary: 'Lấy danh sách đơn hàng của người dùng' })
  @ApiResponse({ status: 200, description: 'Trả về danh sách đơn hàng có phân trang' })
  async findUserOrders(
    @CurrentUser('userId') userId: string,
    @Query() queryDto: QueryOrderDto,
  ) {
    return this.ordersService.findUserOrders(userId, queryDto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Lấy thông tin chi tiết đơn hàng' })
  @ApiParam({ name: 'id', description: 'ID của đơn hàng' })
  @ApiResponse({ status: 200, description: 'Trả về thông tin chi tiết đơn hàng' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy đơn hàng' })
  async findOne(
    @Param('id') id: string,
    @CurrentUser('userId') userId: string,
  ) {
    const order = await this.ordersService.findOne(id);

    // Kiểm tra xem đơn hàng có thuộc về người dùng hiện tại không
    if (order.userId.toString() !== userId) {
      throw new BadRequestException('You do not have permission to view this order');
    }

    return order;
  }

  @Get(':id/tracking')
  @ApiOperation({ summary: 'Lấy thông tin theo dõi đơn hàng' })
  @ApiParam({ name: 'id', description: 'ID của đơn hàng' })
  @ApiResponse({ status: 200, description: 'Trả về thông tin theo dõi đơn hàng' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy thông tin theo dõi đơn hàng' })
  async getOrderTracking(
    @Param('id') id: string,
    @CurrentUser('userId') userId: string,
  ) {
    const order = await this.ordersService.findOne(id);

    // Kiểm tra xem đơn hàng có thuộc về người dùng hiện tại không
    if (order.userId.toString() !== userId) {
      throw new BadRequestException('You do not have permission to view this order tracking');
    }

    return this.ordersService.getOrderTracking(id);
  }

  @Get(':id/tracking-info')
  @ApiOperation({ summary: 'Lấy thông tin chi tiết vận đơn từ Viettel Post' })
  @ApiParam({ name: 'id', description: 'ID của đơn hàng' })
  @ApiResponse({ status: 200, description: 'Trả về thông tin chi tiết vận đơn' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy đơn hàng hoặc vận đơn' })
  async getShipmentInfo(
    @Param('id') id: string,
    @CurrentUser('userId') userId: string,
  ) {
    const order = await this.ordersService.findOne(id);

    // Kiểm tra xem đơn hàng có thuộc về người dùng hiện tại không
    if (order.userId.toString() !== userId) {
      throw new BadRequestException('You do not have permission to view this order tracking information');
    }

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
      this.ordersService.logger.error(`Failed to get tracking information: ${error.message}`);
      throw new BadRequestException('Không thể lấy thông tin vận đơn. Vui lòng thử lại sau.');
    }
  }

  @Patch(':id/cancel')
  @ApiOperation({ summary: 'Hủy đơn hàng' })
  @ApiParam({ name: 'id', description: 'ID của đơn hàng' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        reason: {
          type: 'string',
          description: 'Lý do hủy đơn hàng',
        },
      },
      required: ['reason'],
    },
  })
  @ApiResponse({ status: 200, description: 'Đơn hàng đã được hủy thành công' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy đơn hàng' })
  @ApiResponse({ status: 400, description: 'Không thể hủy đơn hàng ở trạng thái hiện tại' })
  async cancelOrder(
    @Param('id') id: string,
    @Body('reason') reason: string,
    @CurrentUser('userId') userId: string,
  ) {
    if (!reason) {
      throw new BadRequestException('Reason is required when cancelling an order');
    }

    const order = await this.ordersService.findOne(id);

    // Kiểm tra xem đơn hàng có thuộc về người dùng hiện tại không
    if (order.userId.toString() !== userId) {
      throw new BadRequestException('You do not have permission to cancel this order');
    }

    // Kiểm tra xem đơn hàng có thể hủy không
    if (
      order.status !== OrderStatus.PENDING &&
      order.status !== OrderStatus.CONFIRMED
    ) {
      throw new BadRequestException(`Cannot cancel order with status ${order.status}`);
    }

    return this.ordersService.cancelOrder(id, reason);
  }

  @Post('calculate-shipping')
  @ApiOperation({ summary: 'Tính phí vận chuyển (API getPrice)' })
  @ApiBody({ type: CalculateShippingDto })
  @ApiResponse({ status: 200, description: 'Trả về phí vận chuyển và thời gian giao hàng dự kiến' })
  @ApiResponse({ status: 400, description: 'Dữ liệu không hợp lệ' })
  @HttpCode(HttpStatus.OK)
  async calculateShippingFee(@Body() calculateShippingDto: CalculateShippingDto) {
    return this.ordersService.calculateShippingFee(calculateShippingDto);
  }

  @Post('calculate-shipping-all')
  @ApiOperation({ summary: 'Tính phí vận chuyển cho tất cả dịch vụ (API getPriceAll)' })
  @ApiBody({ type: CalculateShippingDto })
  @ApiResponse({ status: 200, description: 'Trả về phí vận chuyển cho tất cả dịch vụ và thời gian giao hàng dự kiến' })
  @ApiResponse({ status: 400, description: 'Dữ liệu không hợp lệ' })
  @HttpCode(HttpStatus.OK)
  async calculateShippingFeeAll(@Body() calculateShippingDto: CalculateShippingDto) {
    return this.ordersService.calculateShippingFeeAll(calculateShippingDto);
  }
}
