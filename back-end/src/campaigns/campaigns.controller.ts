import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAdminAuthGuard } from '../auth/guards/jwt-admin-auth.guard';
import { AdminRolesGuard } from '../auth/guards/admin-roles.guard';
import { AdminRoles } from '../common/decorators/admin-roles.decorator';
import { CampaignsService } from './campaigns.service';
import { CreateCampaignDto } from './dto/create-campaign.dto';
import { UpdateCampaignDto } from './dto/update-campaign.dto';
import { QueryCampaignDto } from './dto/query-campaign.dto';

@ApiTags('Campaigns')
@Controller('campaigns')
export class CampaignsController {
  constructor(private readonly campaignsService: CampaignsService) {}

  @Post()
  @ApiOperation({ summary: 'Tạo chiến dịch mới' })
  @ApiBearerAuth()
  @UseGuards(JwtAdminAuthGuard, AdminRolesGuard)
  @AdminRoles('admin', 'superadmin')
  create(@Body() createCampaignDto: CreateCampaignDto) {
    return this.campaignsService.create(createCampaignDto);
  }

  @Get()
  @ApiOperation({ summary: 'Lấy danh sách chiến dịch' })
  @ApiBearerAuth()
  @UseGuards(JwtAdminAuthGuard, AdminRolesGuard)
  @AdminRoles('admin', 'superadmin')
  findAll(@Query() queryDto: QueryCampaignDto) {
    return this.campaignsService.findAll(queryDto);
  }

  @Get('active')
  @ApiOperation({ summary: 'Lấy danh sách chiến dịch đang hoạt động' })
  getActiveCampaigns() {
    return this.campaignsService.getActiveCampaigns();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Lấy thông tin chi tiết chiến dịch' })
  findOne(@Param('id') id: string) {
    return this.campaignsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Cập nhật thông tin chiến dịch' })
  @ApiBearerAuth()
  @UseGuards(JwtAdminAuthGuard, AdminRolesGuard)
  @AdminRoles('admin', 'superadmin')
  update(@Param('id') id: string, @Body() updateCampaignDto: UpdateCampaignDto) {
    return this.campaignsService.update(id, updateCampaignDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Xóa chiến dịch' })
  @ApiBearerAuth()
  @UseGuards(JwtAdminAuthGuard, AdminRolesGuard)
  @AdminRoles('admin', 'superadmin')
  remove(@Param('id') id: string) {
    return this.campaignsService.remove(id);
  }
} 