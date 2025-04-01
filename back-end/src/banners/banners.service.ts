import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, SortOrder } from 'mongoose';
import { Banner, BannerDocument } from './schemas/banner.schema';
import { 
  CreateBannerDto, 
  UpdateBannerDto, 
  QueryBannerDto,
  PaginatedBannersResponseDto,
  BannerResponseDto 
} from './dto';
import { Types } from 'mongoose';

@Injectable()
export class BannersService {
  constructor(
    @InjectModel(Banner.name) private bannerModel: Model<BannerDocument>,
  ) {}

  async create(createBannerDto: CreateBannerDto): Promise<BannerDocument> {
    // Nếu không cung cấp thứ tự, lấy thứ tự cao nhất + 1
    if (!createBannerDto.order) {
      const lastBanner = await this.bannerModel
        .findOne()
        .sort({ order: -1 })
        .exec();
      createBannerDto.order = lastBanner ? lastBanner.order + 1 : 1;
    }
    
    const createdBanner = new this.bannerModel(createBannerDto);
    return createdBanner.save();
  }

  async findAll(queryDto: QueryBannerDto): Promise<PaginatedBannersResponseDto> {
    const { 
      page = 1, 
      limit = 10, 
      search, 
      campaignId, 
      active,
      sortBy = 'order', 
      sortOrder = 'asc',
      startDate,
      endDate
    } = queryDto;
    
    const skip = (page - 1) * limit;
    
    // Xây dựng điều kiện tìm kiếm
    const query: any = {};
    
    if (search) {
      query.title = { $regex: search, $options: 'i' };
    }
    
    if (campaignId) {
      query.campaignId = campaignId;
    }
    
    if (typeof active === 'boolean') {
      query.active = active;
    }
    
    // Tìm kiếm theo khoảng thời gian
    const dateQuery = {};
    if (startDate) {
      dateQuery['$gte'] = new Date(startDate);
    }
    if (endDate) {
      dateQuery['$lte'] = new Date(endDate);
    }
    if (Object.keys(dateQuery).length > 0) {
      query.startDate = dateQuery;
    }
    
    // Thực hiện truy vấn
    const sortOptions: { [key: string]: SortOrder } = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };
    
    const banners = await this.bannerModel
      .find(query)
      .sort(sortOptions)
      .skip(skip)
      .limit(limit)
      .lean()
      .exec();
    
    const total = await this.bannerModel.countDocuments(query).exec();
    const totalPages = Math.ceil(total / limit);
    
    // Chuyển đổi dữ liệu để phù hợp với BannerResponseDto
    const items: BannerResponseDto[] = banners.map(banner => ({
      ...banner,
      _id: (banner._id as Types.ObjectId).toString()
    })) as BannerResponseDto[];
    
    return {
      items,
      total,
      page,
      limit,
      totalPages,
    };
  }

  async findAllActive(): Promise<BannerResponseDto[]> {
    const now = new Date();
    
    // Lấy tất cả banner đang hoạt động và trong thời gian hiệu lực
    const banners = await this.bannerModel.find({
      active: true,
      $and: [
        {
          $or: [
            { startDate: { $exists: false } },
            { startDate: null },
            { startDate: { $lte: now } }
          ]
        },
        {
          $or: [
            { endDate: { $exists: false } },
            { endDate: null },
            { endDate: { $gte: now } }
          ]
        }
      ]
    })
    .sort({ order: 1 })
    .lean()
    .exec();
    
    // Chuyển đổi dữ liệu để phù hợp với BannerResponseDto
    return banners.map(banner => ({
      ...banner,
      _id: (banner._id as Types.ObjectId).toString()
    })) as BannerResponseDto[];
  }

  async findOne(id: string): Promise<BannerDocument> {
    const banner = await this.bannerModel.findById(id).exec();
    if (!banner) {
      throw new NotFoundException(`Không tìm thấy banner với ID: ${id}`);
    }
    return banner;
  }

  async update(id: string, updateBannerDto: UpdateBannerDto): Promise<BannerDocument> {
    const updatedBanner = await this.bannerModel
      .findByIdAndUpdate(id, updateBannerDto, { new: true })
      .exec();
    
    if (!updatedBanner) {
      throw new NotFoundException(`Không tìm thấy banner với ID: ${id}`);
    }
    
    return updatedBanner;
  }

  async toggleStatus(id: string): Promise<BannerDocument> {
    const banner = await this.findOne(id);
    banner.active = !banner.active;
    return banner.save();
  }

  async remove(id: string): Promise<BannerDocument> {
    const deletedBanner = await this.bannerModel.findByIdAndDelete(id).exec();
    
    if (!deletedBanner) {
      throw new NotFoundException(`Không tìm thấy banner với ID: ${id}`);
    }
    
    return deletedBanner;
  }

  async changeOrder(id: string, direction: 'up' | 'down'): Promise<BannerDocument[]> {
    const banner = await this.findOne(id);
    
    // Tìm banner kề cạnh (trên/dưới) dựa vào hướng di chuyển
    const adjacentBanner = await this.bannerModel.findOne(
      direction === 'up'
        ? { order: { $lt: banner.order } }
        : { order: { $gt: banner.order } }
    )
    .sort(direction === 'up' ? { order: -1 } : { order: 1 })
    .exec();
    
    if (!adjacentBanner) {
      return [banner]; // Không có banner kề cạnh, giữ nguyên
    }
    
    // Hoán đổi thứ tự
    const tempOrder = banner.order;
    banner.order = adjacentBanner.order;
    adjacentBanner.order = tempOrder;
    
    // Lưu cả hai banner
    await banner.save();
    await adjacentBanner.save();
    
    return [banner, adjacentBanner];
  }

  async getStatistics() {
    const now = new Date();
    const oneWeekLater = new Date();
    oneWeekLater.setDate(oneWeekLater.getDate() + 7);
    
    // Tổng số banner
    const total = await this.bannerModel.countDocuments();
    
    // Số banner đang hoạt động và trong thời gian hiệu lực
    const active = await this.bannerModel.countDocuments({ 
      active: true,
      $and: [
        {
          $or: [
            { startDate: { $exists: false } },
            { startDate: null },
            { startDate: { $lte: now } }
          ]
        },
        {
          $or: [
            { endDate: { $exists: false } },
            { endDate: null },
            { endDate: { $gte: now } }
          ]
        }
      ]
    });
    
    // Số banner đã ẩn
    const inactive = await this.bannerModel.countDocuments({ active: false });
    
    // Số banner sắp hết hạn (trong vòng 1 tuần)
    const expiringSoon = await this.bannerModel.countDocuments({
      active: true,
      endDate: { $gte: now, $lte: oneWeekLater },
    });
    
    return {
      total,
      active,
      inactive,
      expiringSoon,
    };
  }
} 