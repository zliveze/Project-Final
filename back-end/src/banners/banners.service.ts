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
import { CloudinaryService } from '../cloudinary/cloudinary.service';

@Injectable()
export class BannersService {
  constructor(
    @InjectModel(Banner.name) private bannerModel: Model<BannerDocument>,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  async create(createBannerDto: CreateBannerDto): Promise<BannerDocument> {
    try {
      // Nếu không cung cấp thứ tự, lấy thứ tự cao nhất + 1
      if (!createBannerDto.order) {
        const lastBanner = await this.bannerModel
          .findOne()
          .sort({ order: -1 })
          .exec();
        createBannerDto.order = lastBanner ? lastBanner.order + 1 : 1;
      }
      
      // Chuẩn bị bannerData với các thông tin ban đầu
      const bannerData: any = { ...createBannerDto };
      const bannerTags = ['banner'];
      
      if (createBannerDto.campaignId) {
        bannerTags.push(`campaign-${createBannerDto.campaignId}`);
      }

      // Desktop Image Processing
      if (createBannerDto.desktopImageData && createBannerDto.desktopImageData.startsWith('data:')) {
        // Upload ảnh desktop
        const desktopImageUpload = await this.cloudinaryService.uploadImage(
          createBannerDto.desktopImageData,
          {
            folder: 'banner',
            tags: [...bannerTags, 'desktop'],
            transformation: {
              quality: 'auto',
              fetch_format: 'auto',
            }
          }
        );
        
        // Cập nhật URL và publicId
        bannerData.desktopImage = desktopImageUpload.secureUrl;
        bannerData.desktopImagePublicId = desktopImageUpload.publicId;
      } else if (createBannerDto.desktopImage) {
        // Kiểm tra xem URL đã cho có phải là URL Cloudinary không
        if (this.cloudinaryService.isCloudinaryUrl(createBannerDto.desktopImage)) {
          // Trích xuất publicId từ URL nếu chưa cung cấp publicId
          if (!bannerData.desktopImagePublicId) {
            bannerData.desktopImagePublicId = this.cloudinaryService.extractPublicIdFromUrl(createBannerDto.desktopImage);
          }
        }
      } else {
        throw new Error('Yêu cầu phải có ảnh desktop, cung cấp qua desktopImage hoặc desktopImageData');
      }
      
      // Mobile Image Processing
      if (createBannerDto.mobileImageData && createBannerDto.mobileImageData.startsWith('data:')) {
        // Upload ảnh mobile
        const mobileImageUpload = await this.cloudinaryService.uploadImage(
          createBannerDto.mobileImageData,
          {
            folder: 'banner',
            tags: [...bannerTags, 'mobile'],
            transformation: {
              quality: 'auto',
              fetch_format: 'auto',
            }
          }
        );
        
        // Cập nhật URL và publicId
        bannerData.mobileImage = mobileImageUpload.secureUrl;
        bannerData.mobileImagePublicId = mobileImageUpload.publicId;
      } else if (createBannerDto.mobileImage) {
        // Kiểm tra xem URL đã cho có phải là URL Cloudinary không
        if (this.cloudinaryService.isCloudinaryUrl(createBannerDto.mobileImage)) {
          // Trích xuất publicId từ URL nếu chưa cung cấp publicId
          if (!bannerData.mobileImagePublicId) {
            bannerData.mobileImagePublicId = this.cloudinaryService.extractPublicIdFromUrl(createBannerDto.mobileImage);
          }
        }
      } else {
        throw new Error('Yêu cầu phải có ảnh mobile, cung cấp qua mobileImage hoặc mobileImageData');
      }
      
      // Loại bỏ các trường dữ liệu ảnh base64 khỏi dữ liệu banner
      const { desktopImageData, mobileImageData, ...bannerDataWithoutImages } = bannerData;
      
      // Tạo banner mới
      const createdBanner = new this.bannerModel(bannerDataWithoutImages);
      return createdBanner.save();
    } catch (error) {
      console.error('Lỗi khi tạo banner:', error);
      throw error;
    }
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
    const banner = await this.findOne(id);
    const updateData: any = { ...updateBannerDto };
    
    // Chuẩn bị tags cho ảnh
    const bannerTags = ['banner'];
    if (updateBannerDto.campaignId || banner.campaignId) {
      bannerTags.push(`campaign-${updateBannerDto.campaignId || banner.campaignId}`);
    }

    // Nếu có thay đổi ảnh desktop
    if (updateBannerDto.desktopImageData) {
      // Xóa ảnh cũ trên Cloudinary nếu có
      if (banner.desktopImagePublicId) {
        await this.cloudinaryService.deleteImage(banner.desktopImagePublicId);
      }
      
      // Upload ảnh mới
      const desktopImageUpload = await this.cloudinaryService.uploadImage(
        updateBannerDto.desktopImageData,
        {
          folder: 'banner',
          tags: [...bannerTags, 'desktop'],
          transformation: {
            quality: 'auto',
            fetch_format: 'auto',
          }
        }
      );
      
      // Cập nhật URL ảnh và publicId
      updateData.desktopImage = desktopImageUpload.secureUrl;
      updateData.desktopImagePublicId = desktopImageUpload.publicId;
    }

    // Nếu có thay đổi ảnh mobile
    if (updateBannerDto.mobileImageData) {
      // Xóa ảnh cũ trên Cloudinary nếu có
      if (banner.mobileImagePublicId) {
        await this.cloudinaryService.deleteImage(banner.mobileImagePublicId);
      }
      
      // Upload ảnh mới
      const mobileImageUpload = await this.cloudinaryService.uploadImage(
        updateBannerDto.mobileImageData,
        {
          folder: 'banner',
          tags: [...bannerTags, 'mobile'],
          transformation: {
            quality: 'auto',
            fetch_format: 'auto',
          }
        }
      );
      
      // Cập nhật URL ảnh và publicId
      updateData.mobileImage = mobileImageUpload.secureUrl;
      updateData.mobileImagePublicId = mobileImageUpload.publicId;
    }
    
    // Loại bỏ các trường dữ liệu ảnh base64 khỏi đối tượng cập nhật
    const { desktopImageData, mobileImageData, ...updateDataWithoutImages } = updateData;
    
    const updatedBanner = await this.bannerModel
      .findByIdAndUpdate(id, updateDataWithoutImages, { new: true })
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
    const banner = await this.findOne(id);
    
    // Xóa ảnh trên Cloudinary trước khi xóa banner
    if (banner.desktopImagePublicId) {
      await this.cloudinaryService.deleteImage(banner.desktopImagePublicId);
    }
    
    if (banner.mobileImagePublicId) {
      await this.cloudinaryService.deleteImage(banner.mobileImagePublicId);
    }
    
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