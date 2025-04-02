import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, SortOrder, Types } from 'mongoose';
import { Brand, BrandDocument } from './schemas/brand.schema';
import { 
  CreateBrandDto, 
  UpdateBrandDto, 
  QueryBrandDto,
  PaginatedBrandsResponseDto,
  BrandResponseDto 
} from './dto';
import { CloudinaryService } from '../cloudinary/cloudinary.service';

@Injectable()
export class BrandsService {
  private readonly logger = new Logger(BrandsService.name);

  constructor(
    @InjectModel(Brand.name) private brandModel: Model<BrandDocument>,
    private readonly cloudinaryService: CloudinaryService
  ) {}

  async create(createBrandDto: CreateBrandDto): Promise<BrandDocument> {
    try {
      // Chuẩn bị brandData với các thông tin ban đầu
      const brandData: any = { ...createBrandDto };

      // Kiểm tra logo
      if (createBrandDto.logo?.url) {
        // Kiểm tra xem URL đã cho có phải là URL Cloudinary không
        if (this.cloudinaryService.isCloudinaryUrl(createBrandDto.logo.url)) {
          // Trích xuất publicId từ URL nếu chưa cung cấp publicId
          if (!brandData.logo.publicId) {
            brandData.logo.publicId = this.cloudinaryService.extractPublicIdFromUrl(createBrandDto.logo.url);
          }
        }
      } else {
        this.logger.warn('Không có thông tin logo cho thương hiệu. Logo nên được upload riêng rồi thiết lập URL');
      }

      // Tạo brand mới
      const createdBrand = new this.brandModel(brandData);
      return createdBrand.save();
    } catch (error) {
      console.error('Lỗi khi tạo thương hiệu:', error);
      throw error;
    }
  }

  async findAll(queryDto: QueryBrandDto): Promise<PaginatedBrandsResponseDto> {
    const { 
      page = 1, 
      limit = 10, 
      search, 
      status,
      featured,
      origin,
      sortBy = 'name', 
      sortOrder = 'asc'
    } = queryDto;
    
    const skip = (page - 1) * limit;
    
    // Xây dựng điều kiện tìm kiếm
    const query: any = {};
    
    if (search) {
      query.name = { $regex: search, $options: 'i' };
    }
    
    if (status) {
      query.status = status;
    }
    
    if (typeof featured === 'boolean') {
      query.featured = featured;
    }
    
    if (origin) {
      query.origin = { $regex: origin, $options: 'i' };
    }
    
    // Thực hiện truy vấn
    const sortOptions: { [key: string]: SortOrder } = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };
    
    const brands = await this.brandModel
      .find(query)
      .sort(sortOptions)
      .skip(skip)
      .limit(limit)
      .lean()
      .exec();
    
    const total = await this.brandModel.countDocuments(query).exec();
    const totalPages = Math.ceil(total / limit);
    
    // Chuyển đổi dữ liệu để phù hợp với BrandResponseDto
    const items: BrandResponseDto[] = brands.map(brand => ({
      ...brand,
      _id: (brand._id as Types.ObjectId).toString()
    })) as BrandResponseDto[];
    
    return {
      items,
      total,
      page,
      limit,
      totalPages,
    };
  }

  async findAllActive(): Promise<BrandResponseDto[]> {
    // Lấy tất cả brand đang hoạt động
    const brands = await this.brandModel.find({
      status: 'active'
    })
    .sort({ name: 1 })
    .lean()
    .exec();
    
    // Chuyển đổi dữ liệu để phù hợp với BrandResponseDto
    return brands.map(brand => ({
      ...brand,
      _id: (brand._id as Types.ObjectId).toString()
    })) as BrandResponseDto[];
  }

  async findAllFeatured(): Promise<BrandResponseDto[]> {
    // Lấy tất cả brand nổi bật và đang hoạt động
    const brands = await this.brandModel.find({
      status: 'active',
      featured: true
    })
    .sort({ name: 1 })
    .lean()
    .exec();
    
    // Chuyển đổi dữ liệu để phù hợp với BrandResponseDto
    return brands.map(brand => ({
      ...brand,
      _id: (brand._id as Types.ObjectId).toString()
    })) as BrandResponseDto[];
  }

  async findOne(id: string): Promise<BrandDocument> {
    const brand = await this.brandModel.findById(id).exec();
    if (!brand) {
      throw new NotFoundException(`Không tìm thấy thương hiệu với ID: ${id}`);
    }
    return brand;
  }

  async update(id: string, updateBrandDto: UpdateBrandDto): Promise<BrandDocument> {
    const brand = await this.findOne(id);

    // Chuẩn bị dữ liệu cập nhật
    const updateData: any = { ...updateBrandDto };
    
    // Xử lý cập nhật logo nếu logo.url thay đổi
    if (updateBrandDto.logo?.url && updateBrandDto.logo.url !== brand.logo?.url) {
      // Nếu có publicId cũ, thì xóa ảnh cũ
      if (brand.logo?.publicId) {
        try {
          await this.cloudinaryService.deleteImage(brand.logo.publicId);
          this.logger.log(`Đã xóa logo cũ: ${brand.logo.publicId}`);
        } catch (deleteError) {
          this.logger.error(`Không thể xóa logo cũ: ${deleteError.message}`);
          // Tiếp tục xử lý mặc dù không xóa được ảnh cũ
        }
      }
      
      // Kiểm tra xem URL mới có phải là URL Cloudinary không
      if (this.cloudinaryService.isCloudinaryUrl(updateBrandDto.logo.url)) {
        // Trích xuất publicId từ URL mới
        if (!updateBrandDto.logo.publicId) {
          updateData.logo.publicId = this.cloudinaryService.extractPublicIdFromUrl(updateBrandDto.logo.url);
        }
      }
    }
    
    try {
      const updatedBrand = await this.brandModel.findByIdAndUpdate(
        id,
        { $set: updateData },
        { new: true, runValidators: true }
      ).exec();
      
      if (!updatedBrand) {
        throw new NotFoundException(`Không tìm thấy thương hiệu với ID: ${id}`);
      }
      
      return updatedBrand;
    } catch (error) {
      console.error(`Lỗi khi cập nhật thương hiệu ${id}:`, error);
      throw error;
    }
  }

  async toggleStatus(id: string): Promise<BrandDocument> {
    const brand = await this.findOne(id);
    brand.status = brand.status === 'active' ? 'inactive' : 'active';
    return brand.save();
  }

  async toggleFeatured(id: string): Promise<BrandDocument> {
    const brand = await this.findOne(id);
    brand.featured = !brand.featured;
    return brand.save();
  }

  async remove(id: string): Promise<BrandDocument> {
    const brand = await this.findOne(id);
    
    // Xóa logo trên Cloudinary trước khi xóa thương hiệu
    if (brand.logo?.publicId) {
      await this.cloudinaryService.deleteImage(brand.logo.publicId);
    }
    
    const deletedBrand = await this.brandModel.findByIdAndDelete(id).exec();
    
    if (!deletedBrand) {
      throw new NotFoundException(`Không tìm thấy thương hiệu với ID: ${id}`);
    }
    
    return deletedBrand;
  }

  async getStatistics() {
    // Tổng số thương hiệu
    const total = await this.brandModel.countDocuments();
    
    // Số thương hiệu đang hoạt động
    const active = await this.brandModel.countDocuments({ status: 'active' });
    
    // Số thương hiệu đã ẩn
    const inactive = await this.brandModel.countDocuments({ status: 'inactive' });
    
    // Số thương hiệu nổi bật
    const featured = await this.brandModel.countDocuments({ featured: true });
    
    return {
      total,
      active,
      inactive,
      featured,
    };
  }
} 