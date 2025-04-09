import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { User, UserDocument } from './schemas/user.schema';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { AddressDto } from './dto/address.dto';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<UserDocument> {
    const createdUser = new this.userModel(createUserDto);
    return createdUser.save();
  }

  async findAll(): Promise<UserDocument[]> {
    return this.userModel.find({ isDeleted: false }).exec();
  }

  async findAllFormatted(): Promise<any> {
    const users = await this.userModel.find({ isDeleted: false }).exec();
    
    const totalUsers = users.length;
    const activeUsers = users.filter(user => user.isActive && !user.isBanned).length;
    const inactiveUsers = users.filter(user => !user.isActive && !user.isBanned).length;
    const blockedUsers = users.filter(user => user.isBanned).length;
    
    const transformedUsers = users.map(user => {
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
    
    const monthlyCounts = await this.getUserCountByMonth(12);
    
    return {
      users: transformedUsers,
      totalUsers,
      activeUsers,
      inactiveUsers,
      blockedUsers,
      monthlyCounts,
      currentPage: 1,
      totalPages: 1
    };
  }

  async findAllWithFilters(
    search?: string,
    status?: string,
    role?: string,
    startDate?: Date,
    endDate?: Date,
    page: number = 1,
    limit: number = 10,
  ): Promise<{ users: UserDocument[]; totalUsers: number; activeUsers: number; inactiveUsers: number; blockedUsers: number }> {
    const query: any = { isDeleted: false };
    
    console.log('findAllWithFilters params:', { 
      search, 
      status, 
      role, 
      startDate: startDate?.toISOString(), 
      endDate: endDate?.toISOString(), 
      page, 
      limit 
    });
    
    if (search) {
      const sanitizedSearch = search.trim();
      console.log('Search with sanitized term:', sanitizedSearch);
      
      const searchTerms = sanitizedSearch.split(/\s+/).filter(term => term.length > 0);
      console.log('Search terms after splitting:', searchTerms);
      
      const fieldConditions = ['name', 'email', 'phone'].map(field => {
        if (searchTerms.length > 1) {
          const termConditions = searchTerms.map(term => {
            const regex = new RegExp(term.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&'), 'i');
            return { [field]: { $regex: regex } };
          });
          return { $and: termConditions };
        } else {
          const regex = new RegExp(sanitizedSearch.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&'), 'i');
          return { [field]: { $regex: regex } };
        }
      });
      
      query.$or = fieldConditions;
      
      console.log('Search conditions:', JSON.stringify(fieldConditions, null, 2));
    }
    
    if (status && status !== 'all') {
      if (status === 'active') {
        query.isActive = true;
        query.isBanned = { $ne: true };
      } else if (status === 'inactive') {
        query.isActive = false;
        query.isBanned = { $ne: true };
      } else if (status === 'blocked') {
        query.isBanned = true;
      }
    }
    
    if (role && role !== 'all') {
      query.role = role;
    }
    
    if (startDate || endDate) {
      query.createdAt = {};
      
      if (startDate) {
        const startDateObj = new Date(startDate);
        startDateObj.setHours(0, 0, 0, 0);
        query.createdAt.$gte = startDateObj;
        console.log('Filtering users created from:', startDateObj.toISOString());
      }
      
      if (endDate) {
        const endDateObj = new Date(endDate);
        endDateObj.setHours(23, 59, 59, 999);
        query.createdAt.$lte = endDateObj;
        console.log('Filtering users created until:', endDateObj.toISOString());
      }
    }

    console.log('MongoDB query:', JSON.stringify(query, null, 2));
    
    const cacheKey = `count_${JSON.stringify(query)}`;
    
    const CACHE_TTL = 5 * 60 * 1000;
    
    if (!global['_userCountCache']) {
      global['_userCountCache'] = {};
    }
    
    let countPromises = [];
    let totalUsers, activeUsers, inactiveUsers, blockedUsers;

    if (global['_userCountCache'][cacheKey] && 
        global['_userCountCache'][cacheKey].timestamp > Date.now() - CACHE_TTL) {
      const cachedCounts = global['_userCountCache'][cacheKey];
      totalUsers = cachedCounts.totalUsers;
      activeUsers = cachedCounts.activeUsers;
      inactiveUsers = cachedCounts.inactiveUsers;
      blockedUsers = cachedCounts.blockedUsers;
    } else {
      [totalUsers, activeUsers, inactiveUsers, blockedUsers] = await Promise.all([
        this.userModel.countDocuments(query),
        
        this.userModel.countDocuments({ 
          isDeleted: false, 
          isActive: true,
          isBanned: { $ne: true }
        }),
        
        this.userModel.countDocuments({ 
          isDeleted: false,
          isActive: false,
          isBanned: { $ne: true } 
        }),
        
        this.userModel.countDocuments({ 
          isDeleted: false,
          isBanned: true 
        })
      ]);
      
      global['_userCountCache'][cacheKey] = {
        totalUsers,
        activeUsers,
        inactiveUsers,
        blockedUsers,
        timestamp: Date.now()
      };
    }

    const users = await this.userModel
      .find(query)
      .skip((page - 1) * limit)
      .limit(limit)
      .sort({ createdAt: -1 })
      .select('_id name email phone role isActive isBanned createdAt') 
      .lean()
      .exec();
    
    console.log(`Found ${users.length} users matching the criteria`);
    if (users.length > 0) {
      console.log('Sample results:', users.slice(0, 2).map(u => ({
        name: u.name,
        email: u.email,
        phone: u.phone
      })));
    }
    
    return {
      users,
      totalUsers,
      activeUsers,
      inactiveUsers,
      blockedUsers,
    };
  }

  async findOne(id: string): Promise<UserDocument> {
    this.logger.debug(`Finding user with ID: ${id}`);
    
    // Kiểm tra xem id có phải là một ObjectId hợp lệ không
    if (!Types.ObjectId.isValid(id)) {
      this.logger.error(`Invalid ObjectId format: ${id}`);
      throw new BadRequestException(`ID ${id} không phải là một ObjectId hợp lệ`);
    }
    
    const user = await this.userModel.findById(id).exec();
    this.logger.debug(`User found: ${user ? 'YES' : 'NO'}`);
    
    if (!user || user.isDeleted) {
      throw new NotFoundException(`Không tìm thấy người dùng với ID ${id}`);
    }
    return user;
  }

  async findOneDetailed(id: string): Promise<UserDocument> {
    const user = await this.userModel.findById(id)
      .select('-password -refreshToken -resetPasswordToken -resetPasswordExpires -verificationToken -verificationExpires')
      .exec();
      
    if (!user || user.isDeleted) {
      throw new NotFoundException(`Không tìm thấy người dùng với ID ${id}`);
    }
    
    return user;
  }

  async findByEmail(email: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ email, isDeleted: false }).exec();
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<UserDocument> {
    if (updateUserDto.password) {
      const salt = await bcrypt.genSalt(10);
      updateUserDto.password = await bcrypt.hash(updateUserDto.password, salt);
    }

    const updatedUser = await this.userModel
      .findByIdAndUpdate(id, updateUserDto, { new: true })
      .exec();

    if (!updatedUser || updatedUser.isDeleted) {
      throw new NotFoundException(`Không tìm thấy người dùng với ID ${id}`);
    }

    return updatedUser;
  }

  async remove(id: string): Promise<void> {
    const result = await this.userModel
      .findByIdAndUpdate(id, { isDeleted: true })
      .exec();

    if (!result) {
      throw new NotFoundException(`Không tìm thấy người dùng với ID ${id}`);
    }
  }

  async addAddress(userId: string, addressDto: AddressDto): Promise<UserDocument> {
    const user = await this.findOne(userId);

    const addressWithId = {
      ...addressDto,
      addressId: String(new Date().getTime())
    };

    if (addressWithId.isDefault) {
      user.addresses.forEach(address => {
        address.isDefault = false;
      });
    }

    user.addresses.push(addressWithId as any);
    return user.save();
  }

  async updateAddress(userId: string, addressId: string, addressDto: AddressDto): Promise<UserDocument> {
    const user = await this.findOne(userId);

    const addressIndex = user.addresses.findIndex(
      address => address.addressId === addressId,
    );

    if (addressIndex === -1) {
      throw new NotFoundException(`Không tìm thấy địa chỉ với ID ${addressId}`);
    }

    if (addressDto.isDefault) {
      user.addresses.forEach(address => {
        address.isDefault = false;
      });
    }

    user.addresses[addressIndex] = {
      ...user.addresses[addressIndex],
      ...addressDto,
      addressId,
    };

    return user.save();
  }

  async removeAddress(userId: string, addressId: string): Promise<UserDocument> {
    const user = await this.findOne(userId);

    const initialLength = user.addresses.length;
    user.addresses = user.addresses.filter(
      address => address.addressId !== addressId,
    );

    if (user.addresses.length === initialLength) {
      throw new NotFoundException(`Không tìm thấy địa chỉ với ID ${addressId}`);
    }

    return user.save();
  }

  async addToWishlist(userId: string, productId: string): Promise<UserDocument> {
    const user = await this.findOne(userId);

    if (!user.wishlist.includes(productId)) {
      user.wishlist.push(productId);
      return user.save();
    }

    return user;
  }

  async removeFromWishlist(userId: string, productId: string): Promise<UserDocument> {
    const user = await this.findOne(userId);

    user.wishlist = user.wishlist.filter(id => id !== productId);
    return user.save();
  }

  async setRefreshToken(userId: string, refreshToken: string | null): Promise<void> {
    await this.userModel
      .findByIdAndUpdate(userId, { refreshToken })
      .exec();
  }

  async findByRefreshToken(refreshToken: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ refreshToken, isDeleted: false }).exec();
  }

  async setResetPasswordToken(
    userId: string | Types.ObjectId, 
    resetPasswordToken: string, 
    resetPasswordExpires: Date
  ): Promise<void> {
    await this.userModel
      .findByIdAndUpdate(userId, { 
        resetPasswordToken, 
        resetPasswordExpires 
      })
      .exec();
  }

  async findUserByResetToken(token: string): Promise<UserDocument | null> {
    return this.userModel.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: new Date() },
      isDeleted: false
    }).exec();
  }

  async resetUserPassword(userId: string | Types.ObjectId, hashedPassword: string): Promise<void> {
    await this.userModel
      .findByIdAndUpdate(userId, {
        password: hashedPassword,
        resetPasswordToken: null,
        resetPasswordExpires: null
      })
      .exec();
  }

  async findByVerificationToken(token: string): Promise<UserDocument | null> {
    return this.userModel.findOne({
      verificationToken: token,
      verificationExpires: { $gt: new Date() },
      isDeleted: false
    }).exec();
  }

  async verifyEmail(userId: string | Types.ObjectId): Promise<void> {
    await this.userModel
      .findByIdAndUpdate(userId, {
        isVerified: true,
        verificationToken: null,
        verificationExpires: null
      })
      .exec();
  }

  async resetPasswordByAdmin(userId: string, newPassword: string): Promise<void> {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);
    
    await this.userModel
      .findByIdAndUpdate(userId, {
        password: hashedPassword,
        resetPasswordToken: null,
        resetPasswordExpires: null
      })
      .exec();
  }

  async updateUserStatus(userId: string, status: string): Promise<UserDocument> {
    const updateData: any = {};
    
    if (status === 'active') {
      updateData.isActive = true;
      updateData.isBanned = false;
    } else if (status === 'inactive') {
      updateData.isActive = false;
      updateData.isBanned = false;
    } else if (status === 'blocked') {
      updateData.isBanned = true;
    }
    
    const updatedUser = await this.userModel
      .findByIdAndUpdate(userId, updateData, { new: true })
      .exec();
      
    if (!updatedUser || updatedUser.isDeleted) {
      throw new NotFoundException(`Không tìm thấy người dùng với ID ${userId}`);
    }
    
    return updatedUser;
  }

  async updateUserRole(userId: string, role: string): Promise<UserDocument> {
    if (role === 'superadmin') {
      throw new Error('Không thể thay đổi vai trò thành superadmin');
    }
    
    const user = await this.findOne(userId);
    
    if (user.role === 'superadmin') {
      throw new Error('Không thể thay đổi vai trò của superadmin');
    }
    
    const updatedUser = await this.userModel
      .findByIdAndUpdate(userId, { role }, { new: true })
      .exec();
      
    if (!updatedUser) {
      throw new NotFoundException(`Không tìm thấy người dùng với ID ${userId}`);
    }
      
    return updatedUser;
  }

  async updateUserCustomerLevel(userId: string, customerLevel: string): Promise<UserDocument> {
    const validLevels = ['Khách hàng mới', 'Khách hàng bạc', 'Khách hàng vàng', 'Khách hàng thân thiết'];
    
    if (!validLevels.includes(customerLevel)) {
      throw new BadRequestException('Cấp độ khách hàng không hợp lệ');
    }
    
    const user = await this.findOne(userId);
    
    const updatedUser = await this.userModel
      .findByIdAndUpdate(userId, { customerLevel }, { new: true })
      .exec();
      
    if (!updatedUser) {
      throw new NotFoundException(`Không tìm thấy người dùng với ID ${userId}`);
    }
      
    return updatedUser;
  }

  async getUserCountByMonth(months: number = 12): Promise<Array<{ month: string; count: number; growthRate?: number }>> {
    const today = new Date();
    const result: Array<{ month: string; count: number; growthRate?: number }> = [];
    
    for (let i = months - 1; i >= 0; i--) {
      const monthDate = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const nextMonthDate = new Date(today.getFullYear(), today.getMonth() - i + 1, 1);
      
      const count = await this.userModel.countDocuments({
        createdAt: { $lt: nextMonthDate },
        isDeleted: false
      });
      
      const monthString = `T${monthDate.getMonth() + 1}`;

      let growthRate: number | undefined = undefined;
      if (result.length > 0) {
        const prevCount = result[result.length - 1].count;
        if (prevCount > 0) {
          growthRate = ((count - prevCount) / prevCount) * 100;
        } else if (count > 0) {
          growthRate = 100;
        } else {
          growthRate = 0;
        }
      }
      
      result.push({
        month: monthString,
        count,
        growthRate
      });
    }
    
    return result;
  }

  async getUserGrowthStatistics(): Promise<{
    totalGrowth: number;
    activeGrowth: number;
    inactiveGrowth: number;
    blockedGrowth: number;
  }> {
    const today = new Date();
    const currentMonthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const lastMonthStart = new Date(today.getFullYear(), today.getMonth() - 1, 1);

    const aggregationResult = await this.userModel.aggregate([
      {
        $match: { isDeleted: false }
      },
      {
        $project: {
          isActive: 1,
          isBanned: 1,
          createdAt: 1,
          beforeCurrentMonth: { 
            $cond: [{ $lt: ["$createdAt", currentMonthStart] }, 1, 0]
          }
        }
      },
      {
        $facet: {
          current: [
            {
              $group: {
                _id: null,
                totalUsers: { $sum: 1 },
                activeUsers: {
                  $sum: { $cond: [{ $and: ["$isActive", { $ne: ["$isBanned", true] }] }, 1, 0] }
                },
                inactiveUsers: {
                  $sum: { $cond: [{ $and: [{ $eq: ["$isActive", false] }, { $ne: ["$isBanned", true] }] }, 1, 0] }
                },
                blockedUsers: {
                  $sum: { $cond: ["$isBanned", 1, 0] }
                }
              }
            }
          ],
          lastMonth: [
            {
              $match: { beforeCurrentMonth: 1 }
            },
            {
              $group: {
                _id: null,
                totalUsersLastMonth: { $sum: 1 },
                activeUsersLastMonth: {
                  $sum: { $cond: [{ $and: ["$isActive", { $ne: ["$isBanned", true] }] }, 1, 0] }
                },
                inactiveUsersLastMonth: {
                  $sum: { $cond: [{ $and: [{ $eq: ["$isActive", false] }, { $ne: ["$isBanned", true] }] }, 1, 0] }
                },
                blockedUsersLastMonth: {
                  $sum: { $cond: ["$isBanned", 1, 0] }
                }
              }
            }
          ]
        }
      }
    ]).allowDiskUse(true);

    const current = aggregationResult[0]?.current[0] || { totalUsers: 0, activeUsers: 0, inactiveUsers: 0, blockedUsers: 0 };
    const lastMonth = aggregationResult[0]?.lastMonth[0] || { totalUsersLastMonth: 0, activeUsersLastMonth: 0, inactiveUsersLastMonth: 0, blockedUsersLastMonth: 0 };

    const calculateGrowth = (currentValue: number, previousValue: number): number => {
      if (previousValue > 0) {
        return ((currentValue - previousValue) / previousValue) * 100;
      } else if (currentValue > 0) {
        return 100;
      }
      return 0;
    };

    const totalGrowth = calculateGrowth(current.totalUsers, lastMonth.totalUsersLastMonth);
    const activeGrowth = calculateGrowth(current.activeUsers, lastMonth.activeUsersLastMonth);
    const inactiveGrowth = calculateGrowth(current.inactiveUsers, lastMonth.inactiveUsersLastMonth);
    const blockedGrowth = calculateGrowth(current.blockedUsers, lastMonth.blockedUsersLastMonth);

    return {
      totalGrowth,
      activeGrowth,
      inactiveGrowth,
      blockedGrowth
    };
  }
}
