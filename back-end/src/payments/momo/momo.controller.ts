import { Body, Controller, Post, UseGuards, HttpCode, HttpStatus, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { MomoService } from './momo.service';
import { CreateMomoPaymentDto, MomoIpnDto } from './dto';
import { Request } from 'express';

@ApiTags('Payments/MoMo')
@Controller('payments/momo')
export class MomoController {
  constructor(private readonly momoService: MomoService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Tạo yêu cầu thanh toán MoMo' })
  @ApiResponse({ status: 201, description: 'Yêu cầu thanh toán đã được tạo' })
  @ApiResponse({ status: 400, description: 'Dữ liệu không hợp lệ' })
  @ApiResponse({ status: 401, description: 'Không có quyền truy cập' })
  @HttpCode(HttpStatus.CREATED)
  async createPayment(
    @Body() createMomoPaymentDto: CreateMomoPaymentDto,
    @Req() req: Request
  ) {
    return this.momoService.createPayment(createMomoPaymentDto);
  }

  @Post('ipn')
  @ApiOperation({ summary: 'Webhook nhận thông báo từ MoMo (IPN)' })
  @ApiResponse({ status: 200, description: 'Xử lý IPN thành công' })
  @ApiResponse({ status: 400, description: 'Dữ liệu không hợp lệ' })
  @HttpCode(HttpStatus.OK)
  async handleIpnCallback(@Body() ipnData: MomoIpnDto) {
    return this.momoService.handleIpnCallback(ipnData);
  }
}
