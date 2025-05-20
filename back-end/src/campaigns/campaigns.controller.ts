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
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAdminAuthGuard } from '../auth/guards/jwt-admin-auth.guard';
import { AdminRolesGuard } from '../auth/guards/admin-roles.guard';
import { AdminRoles } from '../common/decorators/admin-roles.decorator';
import { CampaignsService } from './campaigns.service';
import { CreateCampaignDto, ProductInCampaignDto } from './dto/create-campaign.dto';
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

  @Get('public/:id')
  @ApiOperation({ summary: 'Lấy thông tin chiến dịch cho client không cần xác thực' })
  getPublicCampaign(@Param('id') id: string) {
    return this.campaignsService.findOne(id);
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

  @Post(':id/products')
  @UseGuards(JwtAdminAuthGuard, AdminRolesGuard)
  @AdminRoles('admin', 'superadmin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Thêm sản phẩm vào chiến dịch (Admin only)' })
  @ApiResponse({
    status: 200,
    description: 'Sản phẩm đã được thêm vào chiến dịch thành công.',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  @ApiResponse({ status: 404, description: 'Chiến dịch không tồn tại.' })
  addProductsToCampaign(
    @Param('id') id: string,
    @Body() data: { products: ProductInCampaignDto[] }
  ) {
    return this.campaignsService.addProductsToCampaign(id, data.products);
  }

  @Delete(':id/products/:productId')
  @UseGuards(JwtAdminAuthGuard, AdminRolesGuard)
  @AdminRoles('admin', 'superadmin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Xóa sản phẩm khỏi chiến dịch (Admin only)' })
  @ApiResponse({
    status: 200,
    description: 'Sản phẩm đã được xóa khỏi chiến dịch thành công.',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  @ApiResponse({ status: 404, description: 'Chiến dịch hoặc sản phẩm không tồn tại.' })
  removeProductFromCampaign(
    @Param('id') id: string,
    @Param('productId') productId: string,
    @Query('variantId') variantId?: string
  ) {
    return this.campaignsService.removeProductFromCampaign(id, productId, variantId);
  }

  @Patch(':id/products/:productId/price')
  @UseGuards(JwtAdminAuthGuard, AdminRolesGuard)
  @AdminRoles('admin', 'superadmin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Cập nhật giá sản phẩm trong chiến dịch (Admin only)' })
  @ApiResponse({
    status: 200,
    description: 'Giá sản phẩm đã được cập nhật thành công.',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  @ApiResponse({ status: 404, description: 'Chiến dịch hoặc sản phẩm không tồn tại.' })
  updateProductPriceInCampaign(
    @Param('id') id: string,
    @Param('productId') productId: string,
    @Body() data: { adjustedPrice: number, variantId?: string, combinationId?: string }
  ) {
    return this.campaignsService.updateProductPriceInCampaign(
      id,
      productId,
      data.adjustedPrice,
      data.variantId,
      data.combinationId
    );
  }
}