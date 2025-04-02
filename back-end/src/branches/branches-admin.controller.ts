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

@Controller('admin/branches')
@UseGuards(JwtAdminAuthGuard, AdminRolesGuard)
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
  async remove(@Param('id') id: string) {
    await this.branchesService.remove(id);
    return { message: 'Chi nhánh đã được xóa thành công' };
  }
} 