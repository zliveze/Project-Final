import { 
  Controller, 
  Get, 
  Post, 
  Body, 
  Param, 
  Delete, 
  Patch, 
  Query, 
  UseGuards,
  HttpCode,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  UnauthorizedException,
  InternalServerErrorException
} from '@nestjs/common';
import { ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/user.decorator';
import { UsersService } from '../users/users.service';
import { User, UserDocument } from '../users/schemas/user.schema';
import { 
  UserFilterDto, 
  UserPaginationDto, 
  UpdateUserByAdminDto, 
  ResetPasswordDto,
  ChangeUserStatusDto,
  ChangeUserRoleDto,
  CreateUserByAdminDto,
  ChangeUserCustomerLevelDto
} from './dto/user-management.dto';

@Controller('admin/users')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin', 'superadmin')
export class AdminUsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  async findAll(
    @Query() paginationDto: UserPaginationDto,
    @Query() filterDto: UserFilterDto,
  ) {
    const page = paginationDto.page || 1;
    const limit = paginationDto.limit || 10;
    const { search, status, role, startDate, endDate } = filterDto;
    
    // Cải thiện xử lý conversion ngày tháng
    let startDateObj: Date | undefined = undefined;
    let endDateObj: Date | undefined = undefined;
    
    if (startDate) {
      try {
        startDateObj = new Date(startDate);
        if (isNaN(startDateObj.getTime())) {
          console.error('Invalid startDate format:', startDate);
          startDateObj = undefined;
        } else {
          console.log('Valid startDate received:', startDate);
          console.log('Converted to:', startDateObj);
        }
      } catch (error) {
        console.error('Error parsing startDate:', error);
      }
    }
    
    if (endDate) {
      try {
        endDateObj = new Date(endDate);
        if (isNaN(endDateObj.getTime())) {
          console.error('Invalid endDate format:', endDate);
          endDateObj = undefined;
        } else {
          console.log('Valid endDate received:', endDate);
          console.log('Converted to:', endDateObj);
        }
      } catch (error) {
        console.error('Error parsing endDate:', error);
      }
    }
    
    // In thông tin tìm kiếm để debug
    console.log('Search query:', { 
      search, 
      searchType: typeof search,
      searchLength: search?.length,
      status, 
      role, 
      startDate, 
      endDate, 
      startDateObj: startDateObj?.toISOString(),
      endDateObj: endDateObj?.toISOString(),
      page, 
      limit 
    });
    
    // Cache key tạo từ các tham số tìm kiếm
    const cacheKey = `admin_users_${page}_${limit}_${search || ''}_${status || ''}_${role || ''}_${startDate || ''}_${endDate || ''}`;
    const CACHE_TTL = 2 * 60 * 1000; // 2 phút, ngắn hơn cache thống kê
    
    // Kiểm tra cache trước - chỉ dùng cache khi không có tìm kiếm và lọc ngày
    const cachedData = this.getCacheData(cacheKey);
    if (cachedData && !search && !startDate && !endDate) {
      console.log('Trả về dữ liệu từ cache');
      return cachedData;
    }
    
    console.log('Thực hiện tìm kiếm từ database với tham số:', {
      search: search || '(không có)',
      status: status || 'all',
      role: role || 'all',
      startDate: startDateObj ? startDateObj.toISOString() : '(không có)',
      endDate: endDateObj ? endDateObj.toISOString() : '(không có)'
    });
    
    // Nếu không có cache, lấy dữ liệu từ DB
    const result = await this.usersService.findAllWithFilters(
      search, 
      status, 
      role, 
      startDateObj, 
      endDateObj, 
      page, 
      limit
    );
    
    const { users, totalUsers, activeUsers, inactiveUsers, blockedUsers } = result;
    console.log(`Tìm thấy ${users.length} người dùng từ tổng số ${totalUsers}`);
    
    // Lấy thêm dữ liệu tăng trưởng người dùng theo tháng cho biểu đồ
    // Sử dụng cache nếu có
    let monthlyCounts, growthData;
    const statsCache = this.getCacheData('admin_user_stats');
    
    if (statsCache) {
      monthlyCounts = statsCache.monthlyCounts;
      growthData = {
        totalGrowth: statsCache.totalGrowth,
        activeGrowth: statsCache.activeGrowth,
        inactiveGrowth: statsCache.inactiveGrowth, 
        blockedGrowth: statsCache.blockedGrowth
      };
    } else {
      monthlyCounts = await this.usersService.getUserCountByMonth(12);
      growthData = await this.usersService.getUserGrowthStatistics();
    }
    
    // Chuyển đổi định dạng dữ liệu trả về để phù hợp với frontend
    const transformedUsers = users.map(user => {
      // Sử dụng .get() của Mongoose để truy cập các thuộc tính động
      const doc = user.toObject();
      return {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        phone: user.phone || '',
        role: user.role,
        status: user.isBanned ? 'blocked' : (user.isActive ? 'active' : 'inactive'),
        createdAt: doc.createdAt ? new Date(doc.createdAt).toISOString() : new Date().toISOString()
      };
    });
    
    const responseData = {
      users: transformedUsers,
      totalUsers,
      activeUsers,
      inactiveUsers,
      blockedUsers,
      totalGrowth: growthData.totalGrowth,
      activeGrowth: growthData.activeGrowth,
      inactiveGrowth: growthData.inactiveGrowth,
      blockedGrowth: growthData.blockedGrowth,
      monthlyCounts,
      currentPage: page,
      totalPages: Math.ceil(totalUsers / limit),
      itemsPerPage: limit,
      cachedAt: new Date().toISOString()
    };
    
    // Chỉ cache khi không có tìm kiếm phức tạp
    if (!search && !startDate && !endDate) {
      this.setCacheData(cacheKey, responseData, CACHE_TTL);
    }
    
    return responseData;
  }

  // Đảm bảo route 'stats' được định nghĩa trước route động ':id'
  @Get('stats')
  async getUserStats() {
    // Phần này sẽ được tối ưu với cache
    const CACHE_KEY = 'admin_user_stats';
    const CACHE_TTL = 5 * 60 * 1000; // 5 phút
    
    // Kiểm tra cache
    const cachedData = this.getCacheData(CACHE_KEY);
    if (cachedData) {
      return cachedData;
    }
    
    // Nếu không có cache, tính toán dữ liệu mới
    // Đếm tổng số người dùng và phân loại
    const users = await this.usersService.findAll();
    const totalUsers = users.length;
    const activeUsers = users.filter(user => user.isActive && !user.isBanned).length;
    const inactiveUsers = users.filter(user => !user.isActive && !user.isBanned).length;
    const blockedUsers = users.filter(user => user.isBanned).length;
    
    const monthlyCounts = await this.usersService.getUserCountByMonth(12);
    const growthData = await this.usersService.getUserGrowthStatistics();
    
    const result = {
      totalUsers,
      activeUsers,
      inactiveUsers, 
      blockedUsers,
      monthlyCounts,
      totalGrowth: growthData.totalGrowth,
      activeGrowth: growthData.activeGrowth,
      inactiveGrowth: growthData.inactiveGrowth,
      blockedGrowth: growthData.blockedGrowth,
      cachedAt: new Date().toISOString()
    };
    
    // Lưu vào cache
    this.setCacheData(CACHE_KEY, result, CACHE_TTL);
    
    return result;
  }
  
  // Helper method để lấy dữ liệu từ cache
  private getCacheData(key: string): any {
    try {
      const cacheData = global['_userStatsCache'] || {};
      if (!cacheData[key]) return null;
      
      const { data, expiry } = cacheData[key];
      if (Date.now() > expiry) {
        // Cache đã hết hạn
        delete cacheData[key];
        return null;
      }
      
      return data;
    } catch (error) {
      console.error('Error reading from cache:', error);
      return null;
    }
  }
  
  // Helper method để lưu dữ liệu vào cache
  private setCacheData(key: string, data: any, ttl: number = 300000): void {
    try {
      if (!global['_userStatsCache']) {
        global['_userStatsCache'] = {};
      }
      
      global['_userStatsCache'][key] = {
        data,
        expiry: Date.now() + ttl
      };
    } catch (error) {
      console.error('Error writing to cache:', error);
    }
  }

  @Get(':id')
  @ApiOperation({ summary: 'Lấy thông tin chi tiết người dùng theo ID' })
  @ApiParam({ name: 'id', description: 'ID của người dùng' })
  @ApiResponse({ status: 200, description: 'Thành công' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy người dùng' })
  async findOne(@Param('id') id: string) {
    try {
      console.log('[AdminUsersController] Getting user details for ID:', id);
      const user = await this.usersService.findOneDetailed(id);
      
      // Chuyển đổi đối tượng Mongoose thành đối tượng JavaScript thuần túy
      const userObj = user.toObject();
      
      // Log để kiểm tra dữ liệu wishlist
      console.log('[AdminUsersController] Raw wishlist data:', userObj.wishlist);
      console.log('[AdminUsersController] Wishlist length:', userObj.wishlist?.length || 0);
      
      let wishlist = [];
      // Xử lý dữ liệu wishlist để đảm bảo nó có định dạng đúng
      if (userObj.wishlist && userObj.wishlist.length > 0) {
        wishlist = userObj.wishlist.map(item => {
          if (item.productId && typeof item.productId === 'object') {
            // Xử lý trường hợp sản phẩm có dữ liệu đầy đủ
            const productImages: string[] = [];
            
            // Kiểm tra và xử lý trường images theo đúng schema
            if (item.productId.images && Array.isArray(item.productId.images)) {
              // Nếu images là mảng các đối tượng có url
              item.productId.images.forEach((img: any) => {
                if (typeof img === 'object' && img.url) {
                  productImages.push(img.url);
                } else if (typeof img === 'string') {
                  productImages.push(img);
                }
              });
            }
            
            return {
              productId: {
                _id: item.productId._id,
                name: item.productId.name,
                images: productImages,
                price: item.productId.price || 0,
                status: item.productId.status || 'discontinued',
                variants: item.productId.variants || []
              },
              variantId: item.variantId || ''
            };
          } else if (item.productId) {
            // Xử lý trường hợp productId chỉ là ID
            return {
              productId: {
                _id: item.productId,
                name: `Sản phẩm #${typeof item.productId === 'string' ? item.productId.substr(-6) : 'unknown'}`,
                images: [],
                price: 0,
                status: 'discontinued',
                variants: []
              },
              variantId: item.variantId || ''
            };
          } else {
            // Xử lý trường hợp không có productId
            return {
              productId: {
                _id: 'unknown',
                name: 'Sản phẩm #unknown',
                images: [],
                price: 0,
                status: 'discontinued',
                variants: []
              },
              variantId: item.variantId || ''
            };
          }
        });
      }
      
      userObj.wishlist = wishlist;
      // Log để kiểm tra dữ liệu
      console.log('[AdminUsersController] Wishlist data after processing:', 
        JSON.stringify(wishlist.slice(0, 2), null, 2));
      
      // Chuyển đổi định dạng dữ liệu
      return {
        _id: userObj._id.toString(),
        name: userObj.name,
        email: userObj.email,
        phone: userObj.phone || '',
        role: userObj.role,
        status: userObj.isBanned ? 'blocked' : (userObj.isActive ? 'active' : 'inactive'),
        isVerified: userObj.isVerified,
        customerLevel: userObj.customerLevel || 'Khách hàng mới',
        createdAt: userObj.createdAt,
        updatedAt: userObj.updatedAt,
        addresses: userObj.addresses,
        wishlist: wishlist,
        avatar: userObj.avatar || ''
      };
    } catch (error) {
      console.error(`[AdminUsersController] Error in findOne:`, error);
      throw error;
    }  
  }

  @Patch(':id')
  async update(
    @Param('id') id: string, 
    @Body() updateUserDto: UpdateUserByAdminDto,
    @CurrentUser() currentUser: any
  ) {
    const userToUpdate = await this.usersService.findOne(id);
    
    // Kiểm tra phân quyền
    if (userToUpdate.role === 'superadmin') {
      throw new ForbiddenException('Không thể chỉnh sửa tài khoản Super Admin');
    }
    
    if (userToUpdate.role === 'admin' && currentUser.role !== 'superadmin') {
      throw new ForbiddenException('Chỉ Super Admin mới có quyền chỉnh sửa tài khoản Admin');
    }
    
    // Nếu người dùng hiện tại là admin và đang thay đổi quyền, kiểm tra xem họ có phải là superadmin không
    if (updateUserDto.role && userToUpdate.role !== updateUserDto.role && currentUser.role !== 'superadmin') {
      throw new UnauthorizedException('Chỉ Super Admin mới có quyền thay đổi vai trò người dùng');
    }
    
    const updatedUser = await this.usersService.update(id, updateUserDto);
    
    return {
      _id: updatedUser._id.toString(),
      name: updatedUser.name,
      email: updatedUser.email,
      phone: updatedUser.phone || '',
      role: updatedUser.role,
      status: updatedUser.isBanned ? 'blocked' : (updatedUser.isActive ? 'active' : 'inactive'),
      customerLevel: updatedUser.customerLevel || 'Khách hàng mới',
    };
  }

  @Delete(':id')
  @HttpCode(204)
  async remove(
    @Param('id') id: string,
    @CurrentUser() currentUser: any
  ) {
    const userToDelete = await this.usersService.findOne(id);
    
    // Kiểm tra phân quyền
    if (userToDelete.role === 'superadmin') {
      throw new ForbiddenException('Không thể xóa tài khoản Super Admin');
    }
    
    if (userToDelete.role === 'admin' && currentUser.role !== 'superadmin') {
      throw new ForbiddenException('Chỉ Super Admin mới có quyền xóa tài khoản Admin');
    }
    
    await this.usersService.remove(id);
  }

  @Post('reset-password/:id')
  @HttpCode(200)
  async resetPassword(
    @Param('id') id: string,
    @Body() resetPasswordDto: ResetPasswordDto,
    @CurrentUser() currentUser: any
  ) {
    const userToReset = await this.usersService.findOne(id);
    
    // Kiểm tra phân quyền
    if (userToReset.role === 'superadmin' && currentUser.role !== 'superadmin') {
      throw new ForbiddenException('Không thể đặt lại mật khẩu của Super Admin');
    }
    
    if (userToReset.role === 'admin' && currentUser.role !== 'superadmin') {
      throw new ForbiddenException('Chỉ Super Admin mới có quyền đặt lại mật khẩu của Admin');
    }
    
    await this.usersService.resetPasswordByAdmin(id, resetPasswordDto.newPassword);
    
    return { message: 'Đặt lại mật khẩu thành công' };
  }

  @Patch('status/:id')
  async updateStatus(
    @Param('id') id: string,
    @Body() changeStatusDto: ChangeUserStatusDto,
    @CurrentUser() currentUser: any
  ) {
    const userToUpdate = await this.usersService.findOne(id);
    
    // Kiểm tra phân quyền
    if (userToUpdate.role === 'superadmin') {
      throw new ForbiddenException('Không thể thay đổi trạng thái của Super Admin');
    }
    
    if (userToUpdate.role === 'admin' && currentUser.role !== 'superadmin') {
      throw new ForbiddenException('Chỉ Super Admin mới có quyền thay đổi trạng thái của Admin');
    }
    
    const updatedUser = await this.usersService.updateUserStatus(id, changeStatusDto.status);
    
    return {
      _id: updatedUser._id.toString(),
      name: updatedUser.name,
      email: updatedUser.email,
      phone: updatedUser.phone || '',
      role: updatedUser.role,
      status: updatedUser.isBanned ? 'blocked' : (updatedUser.isActive ? 'active' : 'inactive'),
      customerLevel: updatedUser.customerLevel || 'Khách hàng mới',
    };
  }

  @Patch('role/:id')
  @Roles('superadmin')
  async updateRole(
    @Param('id') id: string,
    @Body() changeRoleDto: ChangeUserRoleDto
  ) {
    try {
      const updatedUser = await this.usersService.updateUserRole(id, changeRoleDto.role);
      
      return {
        _id: updatedUser._id.toString(),
        name: updatedUser.name,
        email: updatedUser.email,
        phone: updatedUser.phone || '',
        role: updatedUser.role,
        status: updatedUser.isBanned ? 'blocked' : (updatedUser.isActive ? 'active' : 'inactive'),
        customerLevel: updatedUser.customerLevel || 'Khách hàng mới',
      };
    } catch (error) {
      if (error.message.includes('superadmin')) {
        throw new ForbiddenException(error.message);
      }
      throw error;
    }
  }

  @Patch('customer-level/:id')
  async updateCustomerLevel(
    @Param('id') id: string,
    @Body() changeCustomerLevelDto: ChangeUserCustomerLevelDto,
    @CurrentUser() currentUser: any
  ) {
    try {
      const userToUpdate = await this.usersService.findOne(id);
      
      // Kiểm tra phân quyền
      if (userToUpdate.role === 'superadmin' && currentUser.role !== 'superadmin') {
        throw new ForbiddenException('Không thể thay đổi cấp độ khách hàng của Super Admin');
      }
      
      if (userToUpdate.role === 'admin' && currentUser.role !== 'superadmin') {
        throw new ForbiddenException('Chỉ Super Admin mới có quyền thay đổi cấp độ khách hàng của Admin');
      }
      
      const updatedUser = await this.usersService.updateUserCustomerLevel(id, changeCustomerLevelDto.customerLevel);
      
      return {
        _id: updatedUser._id.toString(),
        name: updatedUser.name,
        email: updatedUser.email,
        phone: updatedUser.phone || '',
        role: updatedUser.role,
        customerLevel: updatedUser.customerLevel,
        status: updatedUser.isBanned ? 'blocked' : (updatedUser.isActive ? 'active' : 'inactive'),
      };
    } catch (error) {
      if (error instanceof BadRequestException || error instanceof ForbiddenException) {
        throw error;
      }
      console.error('Lỗi khi cập nhật cấp độ khách hàng:', error);
      throw new InternalServerErrorException('Không thể cập nhật cấp độ khách hàng');
    }
  }

  @Get('all')
  async findAllFormatted() {
    console.log('Admin Users Controller - findAllFormatted được gọi');
    try {
      const result = await this.usersService.findAllFormatted();
      console.log(`Admin Users Controller - Tìm thấy ${result.users.length} người dùng`);
      return result;
    } catch (error) {
      console.error('Admin Users Controller - Lỗi khi lấy danh sách người dùng:', error);
      throw error;
    }
  }

  @Post('create')
  async createUser(
    @Body() createUserDto: CreateUserByAdminDto,
    @CurrentUser() currentUser: any
  ) {
    try {     
      // Kiểm tra nếu admin thường đang cố tạo admin khác
      if (createUserDto.role === 'admin' && currentUser.role !== 'superadmin') {
        throw new ForbiddenException('Chỉ Super Admin mới có quyền tạo tài khoản Admin');
      }
      
      // Kiểm tra xem email đã tồn tại chưa
      const existingUser = await this.usersService.findByEmail(createUserDto.email);
      if (existingUser) {
        throw new BadRequestException('Email đã được sử dụng');
      }
      
      // Chuẩn bị dữ liệu và tạo user mới
      const userData = {
        ...createUserDto,
        isActive: true,
        isVerified: true,
      };
      
      const createdUser = await this.usersService.create(userData);
      
      return {
        _id: createdUser._id.toString(),
        name: createdUser.name,
        email: createdUser.email,
        phone: createdUser.phone || '',
        role: createdUser.role,
        status: createdUser.isBanned ? 'blocked' : (createdUser.isActive ? 'active' : 'inactive'),
        createdAt: createdUser.createdAt,
      };
    } catch (error) {
      if (error instanceof BadRequestException || error instanceof ForbiddenException) {
        throw error;
      }
      console.error('Lỗi khi tạo người dùng mới:', error);
      throw new BadRequestException('Không thể tạo người dùng mới');
    }
  }

}
