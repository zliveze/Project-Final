import { Controller, Get, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { BannersService } from './banners.service';
import { BannerResponseDto } from './dto';

@ApiTags('Banners')
@Controller('banners')
export class BannersUserController {
  private readonly logger = new Logger(BannersUserController.name);
  
  constructor(private readonly bannersService: BannersService) {}

  @Get('active')
  @ApiOperation({ summary: 'Lấy danh sách banner đang hiển thị' })
  @ApiResponse({ 
    status: 200, 
    description: 'Danh sách banner đang active và trong thời gian hiệu lực',
    type: [BannerResponseDto]
  })
  async findAllActive() {
    try {
      this.logger.log('Lấy danh sách banner đang hiển thị cho người dùng');
      return this.bannersService.findAllActive();
    } catch (error) {
      this.logger.error(`Lỗi khi lấy danh sách banner: ${error.message}`, error.stack);
      throw new HttpException(
        error.message || 'Có lỗi xảy ra khi lấy danh sách banner',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
} 