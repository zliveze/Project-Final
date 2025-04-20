import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types, Document } from 'mongoose';
import { Voucher, VoucherDocument } from './schemas/voucher.schema';
import { CreateVoucherDto, UpdateVoucherDto, VoucherApplyResponseDto, VoucherStatisticsDto, PaginatedVouchersResponseDto } from './dto';
import { User, UserDocument } from '../users/schemas/user.schema';

@Injectable()
export class VouchersService {
  constructor(
    @InjectModel(Voucher.name) private voucherModel: Model<VoucherDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
  ) {}

  async create(createVoucherDto: CreateVoucherDto): Promise<Voucher> {
    // Check if voucher code already exists
    const existingVoucher = await this.voucherModel.findOne({ code: createVoucherDto.code }).exec();
    if (existingVoucher) {
      throw new ConflictException(`Voucher code '${createVoucherDto.code}' already exists.`);
    }

    // Convert date strings to Date objects
    const createdVoucher = new this.voucherModel({
      ...createVoucherDto,
      startDate: new Date(createVoucherDto.startDate),
      endDate: new Date(createVoucherDto.endDate),
    });
    return createdVoucher.save();
  }

  async findAll(query: any): Promise<Voucher[]> {
    // Add filtering/pagination logic here if needed based on query params
    return this.voucherModel.find(query).sort({ createdAt: -1 }).exec();
  }

  async findAllPaginated(
    page = 1,
    limit = 10,
    filters: any = {},
    sort: any = { createdAt: -1 }
  ): Promise<PaginatedVouchersResponseDto> {
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.voucherModel
        .find(filters)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .exec(),
      this.voucherModel.countDocuments(filters),
    ]);

    return {
      data,
      total,
      page,
      limit,
    };
  }

  async findOne(id: string): Promise<Voucher> {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException(`Invalid voucher ID format: ${id}`);
    }
    const voucher = await this.voucherModel.findById(id).exec();
    if (!voucher) {
      throw new NotFoundException(`Voucher with ID ${id} not found`);
    }
    return voucher;
  }

  async findByCode(code: string): Promise<VoucherDocument> {
    const voucher = await this.voucherModel.findOne({ code }).exec();
    if (!voucher) {
      throw new NotFoundException(`Voucher with code ${code} not found`);
    }
    return voucher;
  }

  async update(id: string, updateVoucherDto: UpdateVoucherDto): Promise<Voucher> {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException(`Invalid voucher ID format: ${id}`);
    }

    // Check if the new code conflicts with another voucher
    if (updateVoucherDto.code) {
      const existingVoucher = await this.voucherModel.findOne({ code: updateVoucherDto.code, _id: { $ne: id } }).exec();
      if (existingVoucher) {
        throw new ConflictException(`Voucher code '${updateVoucherDto.code}' is already used by another voucher.`);
      }
    }

    // Convert date strings if they exist in the DTO
    const updateData: any = { ...updateVoucherDto };
    if (updateVoucherDto.startDate) {
      updateData.startDate = new Date(updateVoucherDto.startDate);
    }
    if (updateVoucherDto.endDate) {
      updateData.endDate = new Date(updateVoucherDto.endDate);
    }


    const updatedVoucher = await this.voucherModel.findByIdAndUpdate(id, updateData, { new: true }).exec();
    if (!updatedVoucher) {
      throw new NotFoundException(`Voucher with ID ${id} not found`);
    }
    return updatedVoucher;
  }

  async remove(id: string): Promise<{ deleted: boolean; message?: string }> {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException(`Invalid voucher ID format: ${id}`);
    }
    const result = await this.voucherModel.deleteOne({ _id: id }).exec();
    if (result.deletedCount === 0) {
      throw new NotFoundException(`Voucher with ID ${id} not found`);
    }
    return { deleted: true };
  }

  // Áp dụng voucher vào đơn hàng
  async applyVoucherToOrder(
    voucherCode: string, 
    userId: string, 
    orderValue: number, 
    productIds: string[] = []
  ): Promise<VoucherApplyResponseDto> {
    console.log(`[VoucherService] applyVoucherToOrder called with userId: ${userId}, code: ${voucherCode}, orderValue: ${orderValue}`); // Log input
    const voucher = await this.findByCode(voucherCode);
    const now = new Date();
    
    // Kiểm tra tính hợp lệ của voucher
    if (!voucher.isActive) {
      throw new BadRequestException('Voucher đã bị vô hiệu hóa');
    }
    
    if (now < voucher.startDate || now > voucher.endDate) {
      throw new BadRequestException('Voucher chưa có hiệu lực hoặc đã hết hạn');
    }
    
    if (voucher.usedCount >= voucher.usageLimit) {
      throw new BadRequestException('Voucher đã hết lượt sử dụng');
    }
    
    if (orderValue < voucher.minimumOrderValue) {
      throw new BadRequestException(`Giá trị đơn hàng tối thiểu phải từ ${voucher.minimumOrderValue} VND`);
    }
    
    // Kiểm tra xem người dùng đã sử dụng voucher này chưa
    if (voucher.usedByUsers.some(id => id.toString() === userId)) {
      throw new BadRequestException('Bạn đã sử dụng voucher này rồi');
    }

    // Kiểm tra cấp độ khách hàng
    console.log(`[VoucherService] Attempting to find user with ID: ${userId}`); // Log before findById
    const user = await this.userModel.findById(userId);
    console.log(`[VoucherService] Result of findById(${userId}):`, user ? `User found (ID: ${user._id})` : 'User NOT found (null)'); // Log result
    if (!user) {
      throw new BadRequestException('Không tìm thấy thông tin người dùng');
    }

    if (!voucher.applicableUserGroups.all) {
      if (voucher.applicableUserGroups.levels?.length > 0) {
        if (!voucher.applicableUserGroups.levels.includes(user.customerLevel)) {
          throw new BadRequestException(`Voucher chỉ áp dụng cho ${voucher.applicableUserGroups.levels.join(', ')}`);
        }
      }
    }
    
    // Kiểm tra sản phẩm áp dụng nếu voucher có giới hạn sản phẩm
    if (voucher.applicableProducts && voucher.applicableProducts.length > 0) {
      // Kiểm tra xem có sản phẩm nào trong giỏ hàng thuộc voucher không
      const validProductIds = voucher.applicableProducts.map(id => id.toString());
      const hasValidProduct = productIds.some(id => validProductIds.includes(id));
      
      if (!hasValidProduct) {
        throw new BadRequestException('Voucher này không áp dụng cho các sản phẩm trong đơn hàng của bạn');
      }
    }
    
    // Tính toán giảm giá
    let discountAmount = 0;
    if (voucher.discountType === 'percentage') {
      discountAmount = Math.min(orderValue * (voucher.discountValue / 100), orderValue);
    } else {
      discountAmount = Math.min(voucher.discountValue, orderValue);
    }
    
    const finalAmount = orderValue - discountAmount;
    
    // Cập nhật trạng thái voucher (sẽ thực hiện khi đơn hàng hoàn tất)
    // Ở đây chỉ trả về thông tin giảm giá, việc cập nhật usedCount và usedByUsers
    // sẽ được thực hiện trong OrderService khi đơn hàng được xác nhận
    
    return { 
      voucherId: voucher._id.toString(),
      discountAmount, 
      finalAmount,
      message: 'Áp dụng voucher thành công' 
    };
  }
  
  // Cập nhật voucher khi đơn hàng hoàn tất
  async markVoucherAsUsed(voucherId: string, userId: string): Promise<void> {
    if (!Types.ObjectId.isValid(voucherId) || !Types.ObjectId.isValid(userId)) {
      throw new BadRequestException('ID không hợp lệ');
    }
    
    // Sử dụng atomic operation để cập nhật
    const result = await this.voucherModel.updateOne(
      { 
        _id: new Types.ObjectId(voucherId),
        usedByUsers: { $ne: new Types.ObjectId(userId) }, // Đảm bảo chưa có userId trong danh sách
        $expr: { $lt: ['$usedCount', '$usageLimit'] }, // Đảm bảo chưa đạt giới hạn sử dụng
      },
      { 
        $inc: { usedCount: 1 },
        $push: { usedByUsers: new Types.ObjectId(userId) }
      }
    );
    
    if (result.matchedCount === 0) {
      // Không tìm thấy voucher phù hợp hoặc voucher đã đạt giới hạn
      throw new BadRequestException('Không thể đánh dấu voucher đã sử dụng');
    }
  }
  
  // Thống kê tình hình sử dụng voucher
  async getVoucherStatistics(): Promise<VoucherStatisticsDto> {
    const now = new Date();
    
    const [
      totalVouchers,
      activeVouchers,
      expiredVouchers,
      unusedVouchers,
      topUsedVouchers
    ] = await Promise.all([
      this.voucherModel.countDocuments(),
      this.voucherModel.countDocuments({
        isActive: true,
        startDate: { $lte: now },
        endDate: { $gte: now }
      }),
      this.voucherModel.countDocuments({
        endDate: { $lt: now }
      }),
      this.voucherModel.countDocuments({
        usedCount: 0,
        endDate: { $gte: now }
      }),
      this.voucherModel
        .find()
        .sort({ usedCount: -1 })
        .limit(5)
        .select('code discountType discountValue usedCount usageLimit')
    ]);
    
    // Tính tỷ lệ sử dụng
    const usageRate = await this.voucherModel.aggregate([
      {
        $group: {
          _id: null,
          totalUsed: { $sum: '$usedCount' },
          totalLimit: { $sum: '$usageLimit' }
        }
      },
      {
        $project: {
          _id: 0,
          totalUsed: 1,
          totalLimit: 1,
          usageRate: {
            $cond: [
              { $eq: ['$totalLimit', 0] },
              0,
              { $multiply: [{ $divide: ['$totalUsed', '$totalLimit'] }, 100] }
            ]
          }
        }
      }
    ]);
    
    return {
      totalVouchers,
      activeVouchers,
      expiredVouchers,
      unusedVouchers,
      topUsedVouchers,
      usageStatistics: usageRate[0] || { totalUsed: 0, totalLimit: 0, usageRate: 0 },
    };
  }
  
  // Tìm các voucher có thể áp dụng cho người dùng cụ thể
  async findApplicableVouchersForUser(
    userId: string, 
    orderValue: number = 0, 
    productIds: string[] = []
  ): Promise<Voucher[]> {
    const now = new Date();
    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new BadRequestException('Không tìm thấy thông tin người dùng');
    }
    
    // Điều kiện cơ bản: voucher đang hoạt động, trong thời gian hiệu lực, chưa đạt giới hạn sử dụng
    const baseQuery = {
      isActive: true,
      startDate: { $lte: now },
      endDate: { $gte: now },
      $expr: { $lt: ['$usedCount', '$usageLimit'] },
      // Người dùng chưa sử dụng voucher này
      usedByUsers: { $ne: new Types.ObjectId(userId) }
    };
    
    // Thêm điều kiện về giá trị đơn hàng tối thiểu nếu có
    if (orderValue > 0) {
      baseQuery['minimumOrderValue'] = { $lte: orderValue };
    }
    
    // Nếu có sản phẩm, tìm các voucher áp dụng cho sản phẩm đó
    // hoặc các voucher không có giới hạn sản phẩm
    let vouchers = await this.voucherModel.find({
      ...baseQuery,
      $and: [
        {
          $or: [
            // Voucher không giới hạn sản phẩm
            { applicableProducts: { $size: 0 } },
            // Voucher áp dụng cho ít nhất một sản phẩm trong giỏ hàng
            { applicableProducts: { $in: productIds.map(id => new Types.ObjectId(id)) } },
          ]
        },
        {
          $or: [
            // Voucher áp dụng cho tất cả người dùng
            { 'applicableUserGroups.all': true },
            // Voucher áp dụng cho cấp độ khách hàng hiện tại
            { 'applicableUserGroups.levels': user.customerLevel }
          ]
        }
      ]
    }).sort({ discountValue: -1 }).exec();
    
    return vouchers;
  }
}
