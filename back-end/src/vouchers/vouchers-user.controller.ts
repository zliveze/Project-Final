import {
  Controller,
  Get,
  Param,
  Query,
  UseGuards,
  NotFoundException,
  Post,
  Body,
  Req,
  BadRequestException,
} from '@nestjs/common';
import { VouchersService } from './vouchers.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'; // User authentication guard
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse, ApiQuery, ApiParam, ApiBody } from '@nestjs/swagger';
import { Voucher } from './schemas/voucher.schema';
import { ApplyVoucherDto, VoucherApplyResponseDto } from './dto';

// Tạo interface cho user trong Request
interface RequestWithUser extends Request {
  user: {
    sub: string;
    [key: string]: any;
  };
}

@ApiTags('User Vouchers')
@Controller('vouchers') // Base path for user-facing voucher endpoints
export class VouchersUserController {
  constructor(private readonly vouchersService: VouchersService) {}

  @Get()
  @UseGuards(JwtAuthGuard) // Protect this route for logged-in users
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get list of currently active and valid vouchers' })
  @ApiResponse({ status: 200, description: 'List of available vouchers.', type: [Voucher] })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  async findAvailableVouchers(): Promise<Voucher[]> {
    const now = new Date();
    const filter = {
      isActive: true,
      startDate: { $lte: now },
      endDate: { $gte: now },
      $expr: { $lt: ['$usedCount', '$usageLimit'] }, // Check if usage limit is not reached
    };
    return this.vouchersService.findAll(filter);
  }

  @Get('applicable')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get list of vouchers applicable for the current user and cart' })
  @ApiQuery({ name: 'orderValue', required: false, description: 'Total order value', type: Number })
  @ApiQuery({ name: 'productIds', required: false, description: 'List of product IDs in cart', type: [String] })
  @ApiResponse({ status: 200, description: 'List of applicable vouchers.', type: [Voucher] })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  async findApplicableVouchers(
    @Req() req: RequestWithUser,
    @Query('orderValue') orderValue?: number,
    @Query('productIds') productIds?: string | string[],
  ): Promise<Voucher[]> {
    // Lấy ID người dùng từ token
    const userId = req.user.sub;
    
    // Nếu productIds là một chuỗi, chuyển đổi thành mảng
    let productIdsArray: string[] = [];
    if (productIds) {
      productIdsArray = Array.isArray(productIds) ? productIds : [productIds];
    }
    
    return this.vouchersService.findApplicableVouchersForUser(
      userId, 
      orderValue ? Number(orderValue) : 0, 
      productIdsArray
    );
  }

  @Post('apply')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Apply a voucher to calculate discount' })
  @ApiResponse({ status: 200, description: 'Voucher applied successfully.', type: VoucherApplyResponseDto })
  @ApiResponse({ status: 400, description: 'Invalid voucher or conditions not met.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 404, description: 'Voucher not found.' })
  async applyVoucher(
    @Req() req: RequestWithUser,
    @Body() applyVoucherDto: ApplyVoucherDto
  ): Promise<VoucherApplyResponseDto> {
    if (!applyVoucherDto.code || !applyVoucherDto.orderValue) {
      throw new BadRequestException('Mã voucher và giá trị đơn hàng là bắt buộc');
    }
    
    // Lấy ID người dùng từ token (đã được validate và trả về bởi JwtStrategy)
    const userId = req.user.userId; // Sửa từ req.user.sub thành req.user.userId
    
    // Kiểm tra lại userId có tồn tại không (đề phòng trường hợp lạ)
    if (!userId) {
      throw new BadRequestException('Không thể xác định người dùng từ token.');
    }
    
    return this.vouchersService.applyVoucherToOrder(
      applyVoucherDto.code,
      userId,
      applyVoucherDto.orderValue,
      applyVoucherDto.productIds || []
    );
  }

  @Get('code/:code')
  @UseGuards(JwtAuthGuard) // Protect this route
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get voucher details by code and check validity' })
  @ApiParam({ name: 'code', description: 'The voucher code', type: String })
  @ApiResponse({ status: 200, description: 'Voucher details.', type: Voucher })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 404, description: 'Voucher not found or not valid.' })
  async findVoucherByCode(@Param('code') code: string): Promise<Voucher> {
    const voucher = await this.vouchersService.findByCode(code);

    // Additional checks for validity in user context
    const now = new Date();
    if (
      !voucher ||
      !voucher.isActive ||
      voucher.startDate > now ||
      voucher.endDate < now ||
      voucher.usedCount >= voucher.usageLimit
    ) {
      throw new NotFoundException(
        `Voucher with code "${code}" not found or is not currently valid.`,
      );
    }

    return voucher;
  }

  @Get('public-active')
  @ApiOperation({ summary: 'Get list of publicly available active vouchers' })
  @ApiResponse({ status: 200, description: 'List of public active vouchers.', type: [Voucher] })
  async findPublicActiveVouchers(): Promise<Voucher[]> {
    return this.vouchersService.findPublicActiveVouchers();
  }

  // Note: Applying a voucher to a cart/order would typically be handled
  // within the Cart or Order service/controller, calling VouchersService
  // to validate the voucher code first.
}
