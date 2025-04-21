import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ViettelPostService } from '../services/viettel-post.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

@ApiTags('viettel-post')
@Controller('viettel-post')
export class ViettelPostController {
  constructor(private readonly viettelPostService: ViettelPostService) {}

  @Get('provinces')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Lấy danh sách tỉnh/thành phố từ Viettel Post' })
  @ApiResponse({
    status: 200,
    description: 'Danh sách tỉnh/thành phố',
  })
  async getProvinces() {
    return this.viettelPostService.getProvinces();
  }

  @Get('districts/:provinceId')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Lấy danh sách quận/huyện theo tỉnh/thành phố từ Viettel Post' })
  @ApiResponse({
    status: 200,
    description: 'Danh sách quận/huyện',
  })
  async getDistricts(@Param('provinceId') provinceId: number) {
    return this.viettelPostService.getDistricts(provinceId);
  }

  @Get('wards/:districtId')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Lấy danh sách phường/xã theo quận/huyện từ Viettel Post' })
  @ApiResponse({
    status: 200,
    description: 'Danh sách phường/xã',
  })
  async getWards(@Param('districtId') districtId: number) {
    return this.viettelPostService.getWards(districtId);
  }

  @Get('shipping-fee')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Tính phí vận chuyển từ Viettel Post' })
  @ApiResponse({
    status: 200,
    description: 'Phí vận chuyển',
  })
  async calculateShippingFee(@Query() query: any) {
    return this.viettelPostService.calculateShippingFee(query);
  }
}
