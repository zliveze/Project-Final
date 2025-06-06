import { Controller, Get, Logger, HttpException, HttpStatus, Param } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { BrandsService } from './brands.service';
import { BrandResponseDto } from './dto';

@ApiTags('Brands')
@Controller('brands')
export class BrandsUserController {
  private readonly logger = new Logger(BrandsUserController.name);
  
  constructor(private readonly brandsService: BrandsService) {}

  @Get('active')
  @ApiOperation({ summary: 'Lấy danh sách thương hiệu đang hoạt động' })
  @ApiResponse({ 
    status: 200, 
    description: 'Danh sách thương hiệu đang active',
    type: [BrandResponseDto]
  })
  async findAllActive() {
    try {
      this.logger.log('Lấy danh sách thương hiệu đang hoạt động cho người dùng');
      return this.brandsService.findAllActive();
    } catch (error) {
      this.logger.error(`Lỗi khi lấy danh sách thương hiệu: ${error.message}`, error.stack);
      throw new HttpException(
        error.message || 'Có lỗi xảy ra khi lấy danh sách thương hiệu',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('featured')
  @ApiOperation({ summary: 'Lấy danh sách thương hiệu nổi bật' })
  @ApiResponse({ 
    status: 200, 
    description: 'Danh sách thương hiệu nổi bật',
    type: [BrandResponseDto]
  })
  async findAllFeatured() {
    try {
      this.logger.log('Lấy danh sách thương hiệu nổi bật cho người dùng');
      return this.brandsService.findAllFeatured();
    } catch (error) {
      this.logger.error(`Lỗi khi lấy danh sách thương hiệu nổi bật: ${error.message}`, error.stack);
      throw new HttpException(
        error.message || 'Có lỗi xảy ra khi lấy danh sách thương hiệu nổi bật',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get(':id')
  @ApiOperation({ summary: 'Lấy chi tiết một thương hiệu' })
  @ApiResponse({ status: 200, description: 'Chi tiết thương hiệu', type: BrandResponseDto })
  @ApiResponse({ status: 404, description: 'Không tìm thấy thương hiệu' })
  async findOne(@Param('id') id: string) {
    try {
      this.logger.log(`Lấy chi tiết thương hiệu với ID: ${id}`);
      return this.brandsService.findOne(id);
    } catch (error) {
      this.logger.error(`Lỗi khi lấy chi tiết thương hiệu: ${error.message}`, error.stack);
      throw new HttpException(
        error.message || 'Có lỗi xảy ra khi lấy chi tiết thương hiệu',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
} 