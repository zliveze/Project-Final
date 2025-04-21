import {
  Controller,
  Get,
  Param,
  UseGuards,
  Query,
  BadRequestException,
  Logger,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ViettelPostService } from '../shared/services/viettel-post.service';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';

@ApiTags('Shipping')
@Controller('shipping')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ShippingController {
  private readonly logger = new Logger(ShippingController.name);

  constructor(private readonly viettelPostService: ViettelPostService) {}

  @Get('provinces')
  @ApiOperation({ summary: 'Lấy danh sách tỉnh/thành phố' })
  @ApiResponse({ status: 200, description: 'Trả về danh sách tỉnh/thành phố' })
  @HttpCode(HttpStatus.OK)
  async getProvinces() {
    try {
      const provinces = await this.viettelPostService.getProvinces();
      return {
        success: true,
        data: provinces.map(province => ({
          provinceId: province.PROVINCE_ID,
          provinceName: province.PROVINCE_NAME,
          provinceCode: province.PROVINCE_CODE,
        })),
      };
    } catch (error) {
      this.logger.error(`Error getting provinces: ${error.message}`, error.stack);
      return {
        success: false,
        error: 'Không thể lấy danh sách tỉnh/thành phố',
      };
    }
  }

  @Get('districts/:provinceId')
  @ApiOperation({ summary: 'Lấy danh sách quận/huyện theo tỉnh/thành phố' })
  @ApiParam({ name: 'provinceId', description: 'ID của tỉnh/thành phố' })
  @ApiResponse({ status: 200, description: 'Trả về danh sách quận/huyện' })
  @HttpCode(HttpStatus.OK)
  async getDistricts(@Param('provinceId') provinceId: string) {
    try {
      if (!provinceId || isNaN(Number(provinceId))) {
        throw new BadRequestException('ID tỉnh/thành phố không hợp lệ');
      }

      const districts = await this.viettelPostService.getDistricts(Number(provinceId));
      return {
        success: true,
        data: districts.map(district => ({
          districtId: district.DISTRICT_ID,
          districtName: district.DISTRICT_NAME,
          // Sử dụng DISTRICT_VALUE theo tài liệu API
          districtCode: district.DISTRICT_VALUE, 
        })),
      };
    } catch (error) {
      this.logger.error(`Error getting districts: ${error.message}`, error.stack);
      return {
        success: false,
        error: 'Không thể lấy danh sách quận/huyện',
      };
    }
  }

  @Get('wards/:districtId')
  @ApiOperation({ summary: 'Lấy danh sách phường/xã theo quận/huyện' })
  @ApiParam({ name: 'districtId', description: 'ID của quận/huyện' })
  @ApiResponse({ status: 200, description: 'Trả về danh sách phường/xã' })
  @HttpCode(HttpStatus.OK)
  async getWards(@Param('districtId') districtId: string) {
    try {
      if (!districtId || isNaN(Number(districtId))) {
        throw new BadRequestException('ID quận/huyện không hợp lệ');
      }

      const wards = await this.viettelPostService.getWards(Number(districtId));
      return {
        success: true,
        data: wards.map(ward => ({
          wardId: ward.WARDS_ID,
          wardName: ward.WARDS_NAME,
          wardCode: ward.WARDS_ID.toString(), // Thêm wardCode (chính là WARDS_ID)
        })),
      };
    } catch (error) {
      this.logger.error(`Error getting wards: ${error.message}`, error.stack);
      return {
        success: false,
        error: 'Không thể lấy danh sách phường/xã',
      };
    }
  }
}
