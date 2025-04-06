import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { VouchersService } from './vouchers.service';
import { CreateVoucherDto, UpdateVoucherDto, QueryVouchersDto, VoucherStatisticsDto, PaginatedVouchersResponseDto } from './dto';
import { JwtAdminAuthGuard } from '../auth/guards/jwt-admin-auth.guard'; // Corrected guard path
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { Voucher } from './schemas/voucher.schema';

@ApiTags('Admin Vouchers')
@ApiBearerAuth() // Indicates that JWT authentication is required
@UseGuards(JwtAdminAuthGuard) // Apply correct admin guard
@Controller('admin/vouchers')
export class VouchersAdminController {
  constructor(private readonly vouchersService: VouchersService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Admin creates a new voucher' })
  @ApiResponse({ status: 201, description: 'Voucher created successfully.', type: Voucher })
  @ApiResponse({ status: 400, description: 'Bad Request.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 409, description: 'Conflict - Voucher code already exists.' })
  create(@Body() createVoucherDto: CreateVoucherDto): Promise<Voucher> {
    return this.vouchersService.create(createVoucherDto);
  }

  @Get()
  @ApiOperation({ summary: 'Admin gets all vouchers with optional filtering' })
  @ApiQuery({ name: 'code', required: false, description: 'Filter by voucher code' })
  @ApiQuery({ name: 'isActive', required: false, description: 'Filter by active status', type: Boolean })
  @ApiResponse({ status: 200, description: 'List of vouchers.', type: [Voucher] })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  findAll(@Query() query: any): Promise<Voucher[]> {
    // Build filter object based on query params
    const filter: any = {};
    if (query.code) {
      filter.code = { $regex: query.code, $options: 'i' }; // Case-insensitive search
    }
    if (query.isActive !== undefined) {
       // Convert string 'true'/'false' to boolean
       filter.isActive = String(query.isActive).toLowerCase() === 'true';
    }
    // Add more filters as needed (e.g., date range)

    return this.vouchersService.findAll(filter);
  }

  @Get('paginated')
  @ApiOperation({ summary: 'Admin gets paginated vouchers with flexible filtering and sorting' })
  @ApiResponse({ status: 200, description: 'Paginated list of vouchers.', type: PaginatedVouchersResponseDto })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  async findAllPaginated(@Query() query: QueryVouchersDto): Promise<PaginatedVouchersResponseDto> {
    const { page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc', ...filters } = query;
    
    // Build filter object
    const filterCriteria: any = {};
    
    if (filters.code) {
      filterCriteria.code = { $regex: filters.code, $options: 'i' };
    }
    if (filters.isActive !== undefined) {
      filterCriteria.isActive = filters.isActive;
    }
    
    // Handle date range filters if provided
    if (filters.startDateFrom || filters.startDateTo) {
      filterCriteria.startDate = {};
      if (filters.startDateFrom) {
        filterCriteria.startDate.$gte = new Date(filters.startDateFrom);
      }
      if (filters.startDateTo) {
        filterCriteria.startDate.$lte = new Date(filters.startDateTo);
      }
    }
    
    if (filters.endDateFrom || filters.endDateTo) {
      filterCriteria.endDate = {};
      if (filters.endDateFrom) {
        filterCriteria.endDate.$gte = new Date(filters.endDateFrom);
      }
      if (filters.endDateTo) {
        filterCriteria.endDate.$lte = new Date(filters.endDateTo);
      }
    }
    
    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder.toLowerCase() === 'asc' ? 1 : -1;
    
    return this.vouchersService.findAllPaginated(
      page,
      limit,
      filterCriteria,
      sort
    );
  }

  @Get('statistics')
  @ApiOperation({ summary: 'Get voucher usage statistics for admin dashboard' })
  @ApiResponse({ status: 200, description: 'Voucher statistics.', type: VoucherStatisticsDto })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  getVoucherStatistics(): Promise<VoucherStatisticsDto> {
    return this.vouchersService.getVoucherStatistics();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Admin gets a specific voucher by ID' })
  @ApiResponse({ status: 200, description: 'Voucher details.', type: Voucher })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 404, description: 'Voucher not found.' })
  findOne(@Param('id') id: string): Promise<Voucher> {
    return this.vouchersService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Admin updates a voucher by ID' })
  @ApiResponse({ status: 200, description: 'Voucher updated successfully.', type: Voucher })
  @ApiResponse({ status: 400, description: 'Bad Request.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 404, description: 'Voucher not found.' })
  @ApiResponse({ status: 409, description: 'Conflict - Updated voucher code already exists.' })
  update(@Param('id') id: string, @Body() updateVoucherDto: UpdateVoucherDto): Promise<Voucher> {
    return this.vouchersService.update(id, updateVoucherDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Admin deletes a voucher by ID' })
  @ApiResponse({ status: 204, description: 'Voucher deleted successfully.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 404, description: 'Voucher not found.' })
  remove(@Param('id') id: string): Promise<{ deleted: boolean; message?: string }> {
    return this.vouchersService.remove(id);
  }
}
