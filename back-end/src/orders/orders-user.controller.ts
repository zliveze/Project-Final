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
  Res,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import { Response } from 'express';
import { Types } from 'mongoose';
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

  /**
   * Helper method to extract userId from order.userId which could be either an ObjectId or a populated User object
   */
  private getUserIdFromOrder(orderUserId: any): string {
    if (typeof orderUserId === 'object' && orderUserId !== null) {
      // Nếu userId là object (đã được populate từ User model)
      return orderUserId._id ? orderUserId._id.toString() : '';
    } else {
      // Nếu userId là ObjectId
      return (orderUserId as Types.ObjectId).toString();
    }
  }

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
    console.log(`[OrdersUserController] findOne - Received id: ${id} userId: ${userId}`);
    const order = await this.ordersService.findOne(id);

    // Lấy userId từ order
    const orderUserId = this.getUserIdFromOrder(order.userId);
    console.log(`[OrdersUserController] findOne - Type of order.userId: ${typeof order.userId}, Value: ${JSON.stringify(order.userId)}`);
    console.log(`[OrdersUserController] findOne - Checking permission: orderUserId (${orderUserId}) vs current userId (${userId})`);

    if (orderUserId !== userId) {
      console.log(`[OrdersUserController] findOne - Permission denied for order ${id}. Order UserID: ${orderUserId}, Current UserID: ${userId}`);
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

    // Lấy userId từ order
    const orderUserId = this.getUserIdFromOrder(order.userId);

    if (orderUserId !== userId) {
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

    // Lấy userId từ order
    const orderUserId = this.getUserIdFromOrder(order.userId);

    if (orderUserId !== userId) {
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
      console.error(`Failed to get tracking information: ${error.message}`);
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

    // Lấy userId từ order
    const orderUserId = this.getUserIdFromOrder(order.userId);

    if (orderUserId !== userId) {
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

  @Post(':id/return')
  @ApiOperation({ summary: 'Yêu cầu trả hàng' })
  @ApiParam({ name: 'id', description: 'ID của đơn hàng' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        reason: {
          type: 'string',
          description: 'Lý do trả hàng',
        },
      },
      required: ['reason'],
    },
  })
  @ApiResponse({ status: 200, description: 'Yêu cầu trả hàng đã được ghi nhận' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy đơn hàng' })
  @ApiResponse({ status: 400, description: 'Không thể trả hàng ở trạng thái hiện tại' })
  @HttpCode(HttpStatus.OK)
  async returnOrder(
    @Param('id') id: string,
    @Body('reason') reason: string,
    @CurrentUser('userId') userId: string,
  ) {
    if (!reason) {
      throw new BadRequestException('Reason is required when returning an order');
    }

    const order = await this.ordersService.findOne(id);

    // Lấy userId từ order
    const orderUserId = this.getUserIdFromOrder(order.userId);

    if (orderUserId !== userId) {
      throw new BadRequestException('You do not have permission to return this order');
    }

    // Kiểm tra xem đơn hàng có thể trả không (chỉ đơn hàng đã giao mới có thể trả)
    if (order.status !== OrderStatus.DELIVERED) {
      throw new BadRequestException(`Cannot return order with status ${order.status}. Only delivered orders can be returned.`);
    }

    return this.ordersService.returnOrder(id, reason, userId);
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

  @Get(':id/invoice')
  @ApiOperation({ summary: 'Tải xuống hóa đơn đơn hàng' })
  @ApiParam({ name: 'id', description: 'ID của đơn hàng' })
  @ApiResponse({ status: 200, description: 'Trả về file PDF hóa đơn' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy đơn hàng' })
  async downloadInvoice(
    @Param('id') id: string,
    @CurrentUser('userId') userId: string,
    @Res() res: Response,
  ) {
    console.log(`[OrdersUserController] downloadInvoice - Received id: ${id} userId: ${userId}`);

    try {
      // Kiểm tra đơn hàng tồn tại và thuộc về người dùng hiện tại
      const order = await this.ordersService.findOne(id);

      // Lấy userId từ order
      const orderUserId = this.getUserIdFromOrder(order.userId);

      if (orderUserId !== userId) {
        throw new BadRequestException('You do not have permission to download this invoice');
      }

      // Tạo dữ liệu hóa đơn đơn giản
      const invoiceData = {
        orderNumber: order.orderNumber,
        date: new Date().toLocaleDateString('vi-VN'), // Sử dụng ngày hiện tại
        customerName: order.shippingAddress.fullName,
        customerAddress: `${order.shippingAddress.addressLine1}, ${order.shippingAddress.ward}, ${order.shippingAddress.district}, ${order.shippingAddress.province}`,
        customerPhone: order.shippingAddress.phone,
        items: order.items.map(item => ({
          name: item.name,
          quantity: item.quantity,
          price: item.price,
          total: item.price * item.quantity
        })),
        subtotal: order.subtotal,
        shippingFee: order.shippingFee || 0,
        discount: order.voucher ? order.voucher.discountAmount : 0,
        total: order.finalPrice
      };

      // Trả về dữ liệu JSON thay vì PDF (vì chưa có thư viện tạo PDF)
      return res.json(invoiceData);

      // TODO: Khi có thư viện PDF, sẽ tạo file PDF và trả về
      // const pdfBuffer = await this.ordersService.generateInvoicePdf(order);
      // res.set({
      //   'Content-Type': 'application/pdf',
      //   'Content-Disposition': `attachment; filename="invoice_${order.orderNumber}.pdf"`,
      //   'Content-Length': pdfBuffer.length,
      // });
      // return res.send(pdfBuffer);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      if (error instanceof BadRequestException) {
        throw error;
      }
      console.error(`Error generating invoice: ${error.message}`);
      throw new InternalServerErrorException('Could not generate invoice');
    }
  }
}
