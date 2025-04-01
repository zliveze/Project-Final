import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';
import { NotificationResponseDto } from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Public } from '../common/decorators/public.decorator';

@ApiTags('Notifications')
@Controller('notifications')
export class NotificationsUserController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  @Public()
  @ApiOperation({ summary: 'Lấy danh sách thông báo hiện tại' })
  @ApiResponse({ status: 200, description: 'Danh sách thông báo', type: [NotificationResponseDto] })
  async findAllActive() {
    return this.notificationsService.findAllActive();
  }
} 