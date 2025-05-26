import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Put,
  Query,
  UseGuards,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { JwtAdminAuthGuard } from '../auth/guards/jwt-admin-auth.guard';
import { AdminRolesGuard } from '../auth/guards/admin-roles.guard';
import { AdminRoles } from '../common/decorators/admin-roles.decorator';
import { BranchesService } from './branches.service';
import { CreateBranchDto } from './dto/create-branch.dto';
import { UpdateBranchDto } from './dto/update-branch.dto';
import { BranchFilterDto } from './dto/branch-filter.dto';
import { ApiOperation, ApiResponse, ApiTags, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Admin Branches')
@Controller('admin/branches')
@UseGuards(JwtAdminAuthGuard, AdminRolesGuard)
@ApiBearerAuth()
export class BranchesAdminController {
  private readonly logger = new Logger(BranchesAdminController.name);

  constructor(private readonly branchesService: BranchesService) {}

  @Post()
  @AdminRoles('admin', 'superadmin')
  async create(@Body() createBranchDto: CreateBranchDto) {
    return this.branchesService.create(createBranchDto);
  }

  @Get('statistics')
  @AdminRoles('admin', 'superadmin')
  async getStatistics() {
    return this.branchesService.getStatistics();
  }

  @Get()
  @AdminRoles('admin', 'superadmin')
  async findAll(@Query() filterDto: BranchFilterDto) {
    return this.branchesService.findAll(filterDto);
  }

  @Get(':id')
  @AdminRoles('admin', 'superadmin')
  async findOne(@Param('id') id: string) {
    return this.branchesService.findOne(id);
  }

  @Put(':id')
  @AdminRoles('admin', 'superadmin')
  async update(@Param('id') id: string, @Body() updateBranchDto: UpdateBranchDto) {
    return this.branchesService.update(id, updateBranchDto);
  }

  @Delete(':id')
  @AdminRoles('admin', 'superadmin')
  @ApiOperation({ summary: 'Xóa một chi nhánh' })
  @ApiResponse({ status: 200, description: 'Chi nhánh đã được xóa thành công' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy chi nhánh' })
  @ApiResponse({ status: 400, description: 'Chi nhánh đang được sử dụng bởi các sản phẩm' })
  async remove(@Param('id') id: string): Promise<void> {
    return this.branchesService.remove(id);
  }

  @Get(':id/products-count')
  @AdminRoles('admin', 'superadmin')
  @ApiOperation({ summary: 'Kiểm tra số lượng sản phẩm tham chiếu đến chi nhánh' })
  @ApiResponse({
    status: 200,
    description: 'Số lượng sản phẩm tham chiếu đến chi nhánh',
    schema: {
      type: 'object',
      properties: {
        branchId: { type: 'string' },
        productsCount: { type: 'number' },
        branchName: { type: 'string' }
      }
    }
  })
  @ApiResponse({ status: 404, description: 'Không tìm thấy chi nhánh' })
  async getProductsCount(@Param('id') id: string): Promise<{ branchId: string; productsCount: number; branchName: string }> {
    return this.branchesService.getProductsCount(id);
  }

  @Delete(':id/force')
  @AdminRoles('admin', 'superadmin')
  @ApiOperation({ summary: 'Xóa một chi nhánh và cập nhật tất cả sản phẩm tham chiếu' })
  @ApiResponse({
    status: 200,
    description: 'Chi nhánh đã được xóa thành công và sản phẩm đã được cập nhật',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: { type: 'string' },
        productsUpdated: { type: 'number' }
      }
    }
  })
  @ApiResponse({ status: 404, description: 'Không tìm thấy chi nhánh' })
  async removeWithReferences(@Param('id') id: string): Promise<{ success: boolean; message: string; productsUpdated: number }> {
    return this.branchesService.removeWithReferences(id);
  }
}