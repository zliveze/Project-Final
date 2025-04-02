import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { Category, CategoryDocument } from './schemas/category.schema';
import slugify from 'slugify';

@Injectable()
export class CategoriesService {
  private readonly logger = new Logger(CategoriesService.name);

  constructor(
    @InjectModel(Category.name) private readonly categoryModel: Model<CategoryDocument>,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  // Tạo mới một danh mục
  async create(createCategoryDto: any): Promise<any> {
    try {
      // Tạo slug từ tên danh mục nếu không có
      if (!createCategoryDto.slug) {
        createCategoryDto.slug = slugify(createCategoryDto.name, { lower: true });
      }

      // Kiểm tra xem slug đã tồn tại chưa
      const existingCategory = await this.categoryModel.findOne({ slug: createCategoryDto.slug });
      if (existingCategory) {
        throw new BadRequestException(`Danh mục với slug "${createCategoryDto.slug}" đã tồn tại`);
      }

      // Kiểm tra và cập nhật level
      if (createCategoryDto.parentId) {
        const parentCategory = await this.categoryModel.findById(createCategoryDto.parentId);
        if (!parentCategory) {
          throw new NotFoundException(`Không tìm thấy danh mục cha với ID: ${createCategoryDto.parentId}`);
        }
        createCategoryDto.level = parentCategory.level + 1;
      } else {
        createCategoryDto.level = 1; // Danh mục gốc
      }

      const createdCategory = await this.categoryModel.create(createCategoryDto);
      return createdCategory.toObject();
    } catch (error) {
      this.logger.error(`Lỗi khi tạo danh mục: ${error.message}`, error.stack);
      throw error;
    }
  }

  // Cập nhật danh mục
  async update(id: string, updateCategoryDto: any): Promise<any> {
    try {
      this.logger.log(`Nhận yêu cầu cập nhật danh mục ID: ${id}`);
      this.logger.debug(`Dữ liệu cập nhật: ${JSON.stringify(updateCategoryDto)}`);
      
      // Kiểm tra danh mục tồn tại
      const existingCategory = await this.categoryModel.findById(id);
      if (!existingCategory) {
        this.logger.warn(`Không tìm thấy danh mục với ID: ${id}`);
        throw new NotFoundException(`Không tìm thấy danh mục với ID: ${id}`);
      }
      
      // Nếu có cập nhật slug, kiểm tra trùng lặp
      if (updateCategoryDto.slug) {
        this.logger.log(`Kiểm tra slug: ${updateCategoryDto.slug}`);
        const existingCategoryWithSlug = await this.categoryModel.findOne({ 
          slug: updateCategoryDto.slug,
          _id: { $ne: id }
        });
        
        if (existingCategoryWithSlug) {
          this.logger.warn(`Phát hiện slug trùng lặp: ${updateCategoryDto.slug}`);
          throw new BadRequestException(`Danh mục với slug "${updateCategoryDto.slug}" đã tồn tại`);
        }
      }
      
      // Nếu có cập nhật parentId, cập nhật level
      if (updateCategoryDto.parentId) {
        this.logger.log(`Kiểm tra parentId: ${updateCategoryDto.parentId}`);
        const parentCategory = await this.categoryModel.findById(updateCategoryDto.parentId);
        if (!parentCategory) {
          this.logger.warn(`Không tìm thấy danh mục cha với ID: ${updateCategoryDto.parentId}`);
          throw new NotFoundException(`Không tìm thấy danh mục cha với ID: ${updateCategoryDto.parentId}`);
        }
        
        // Kiểm tra không cho phép đặt danh mục cha là con của chính nó hoặc các con của nó
        if (updateCategoryDto.parentId === id) {
          this.logger.warn(`Không thể đặt danh mục làm cha của chính nó: ${id}`);
          throw new BadRequestException('Không thể đặt danh mục làm cha của chính nó');
        }
        
        // Kiểm tra các con của danh mục hiện tại
        const childrenIds = await this.getAllChildrenIds(id);
        if (childrenIds.includes(updateCategoryDto.parentId)) {
          this.logger.warn(`Không thể đặt danh mục con làm danh mục cha: ${updateCategoryDto.parentId}`);
          throw new BadRequestException('Không thể đặt danh mục con làm danh mục cha');
        }
        
        updateCategoryDto.level = parentCategory.level + 1;
        this.logger.log(`Cập nhật level thành: ${updateCategoryDto.level}`);
        
        // Cập nhật level cho tất cả các danh mục con
        await this.updateChildrenLevels(id, updateCategoryDto.level);
      } else if (updateCategoryDto.parentId === null) {
        // Nếu đang đổi từ có cha thành không có cha
        updateCategoryDto.level = 1;
        this.logger.log(`Đặt lại level thành 1 khi loại bỏ cha`);
        
        // Cập nhật level cho tất cả các danh mục con
        await this.updateChildrenLevels(id, updateCategoryDto.level);
      }

      try {
        this.logger.log(`Thực hiện cập nhật danh mục trong DB: ${id}`);
        const updatedCategory = await this.categoryModel.findByIdAndUpdate(
          id,
          updateCategoryDto,
          { new: true }
        );

        if (!updatedCategory) {
          this.logger.warn(`Không tìm thấy danh mục sau khi cập nhật: ${id}`);
          throw new NotFoundException(`Không tìm thấy danh mục với ID: ${id}`);
        }

        this.logger.log(`Cập nhật danh mục thành công: ${id}`);
        return updatedCategory.toObject();
      } catch (dbError) {
        this.logger.error(`Lỗi DB khi cập nhật: ${dbError.message}`, dbError.stack);
        throw new BadRequestException(`Lỗi khi cập nhật danh mục: ${dbError.message}`);
      }
    } catch (error) {
      this.logger.error(`Lỗi khi cập nhật danh mục: ${error.message}`, error.stack);
      throw error;
    }
  }

  // Lấy tất cả ID của các danh mục con
  private async getAllChildrenIds(categoryId: string): Promise<string[]> {
    const children = await this.categoryModel.find({ parentId: categoryId });
    const childrenIds = children.map(child => (child as any)._id.toString());
    
    // Đệ quy để lấy tất cả con cháu
    const descendantIds: string[] = [];
    for (const childId of childrenIds) {
      const descendants = await this.getAllChildrenIds(childId);
      descendantIds.push(...descendants);
    }
    
    return [...childrenIds, ...descendantIds];
  }

  // Cập nhật level cho tất cả danh mục con
  private async updateChildrenLevels(parentId: string, parentLevel: number): Promise<void> {
    const children = await this.categoryModel.find({ parentId });
    
    for (const child of children) {
      const newLevel = parentLevel + 1;
      await this.categoryModel.findByIdAndUpdate((child as any)._id, { level: newLevel });
      
      // Đệ quy cập nhật các con của con
      await this.updateChildrenLevels((child as any)._id.toString(), newLevel);
    }
  }

  // Xóa danh mục
  async remove(id: string): Promise<boolean> {
    try {
      // Kiểm tra xem danh mục có tồn tại không
      const category = await this.categoryModel.findById(id);
      if (!category) {
        throw new NotFoundException(`Không tìm thấy danh mục với ID: ${id}`);
      }

      // Kiểm tra xem danh mục có con không
      const childrenCount = await this.categoryModel.countDocuments({ parentId: id });
      if (childrenCount > 0) {
        throw new BadRequestException('Không thể xóa danh mục có chứa danh mục con. Vui lòng xóa các danh mục con trước.');
      }

      // Nếu có ảnh, xóa ảnh từ Cloudinary
      if (category.image && category.image.publicId) {
        try {
          await this.cloudinaryService.deleteImage(category.image.publicId);
        } catch (error) {
          this.logger.warn(`Không thể xóa ảnh từ Cloudinary: ${error.message}`);
        }
      }

      // Xóa danh mục
      await this.categoryModel.findByIdAndDelete(id);
      return true;
    } catch (error) {
      this.logger.error(`Lỗi khi xóa danh mục: ${error.message}`, error.stack);
      throw error;
    }
  }

  // Tìm một danh mục theo ID
  async findOne(id: string): Promise<any> {
    try {
      const category = await this.categoryModel.findById(id);
      if (!category) {
        throw new NotFoundException(`Không tìm thấy danh mục với ID: ${id}`);
      }

      // Lấy thông tin danh mục cha nếu có
      let parent = null;
      if (category.parentId) {
        parent = await this.categoryModel.findById(category.parentId, { _id: 1, name: 1, slug: 1 });
      }

      // Đếm số lượng danh mục con
      const childrenCount = await this.categoryModel.countDocuments({ parentId: id });

      const result = {
        ...category.toObject(),
        parent: parent ? {
          _id: (parent as any)._id,
          name: (parent as any).name,
          slug: (parent as any).slug
        } : undefined,
        childrenCount
      };

      return result;
    } catch (error) {
      this.logger.error(`Lỗi khi tìm danh mục: ${error.message}`, error.stack);
      throw error;
    }
  }

  // Tìm danh mục theo slug
  async findBySlug(slug: string): Promise<any> {
    try {
      const category = await this.categoryModel.findOne({ slug });
      if (!category) {
        throw new NotFoundException(`Không tìm thấy danh mục với slug: ${slug}`);
      }

      // Lấy thông tin danh mục cha nếu có
      let parent = null;
      if (category.parentId) {
        parent = await this.categoryModel.findById(category.parentId, { _id: 1, name: 1, slug: 1 });
      }

      // Đếm số lượng danh mục con
      const childrenCount = await this.categoryModel.countDocuments({ parentId: category._id });

      const result = {
        ...category.toObject(),
        parent: parent ? {
          _id: (parent as any)._id,
          name: (parent as any).name,
          slug: (parent as any).slug
        } : undefined,
        childrenCount
      };

      return result;
    } catch (error) {
      this.logger.error(`Lỗi khi tìm danh mục theo slug: ${error.message}`, error.stack);
      throw error;
    }
  }

  // Tìm tất cả danh mục
  async findAll(queryDto: any): Promise<any> {
    try {
      const { page = 1, limit = 10, search, parentId, status, featured, level, sort } = queryDto;
      const skip = (page - 1) * limit;

      // Xây dựng query
      const query: any = {};

      if (search) {
        query.$or = [
          { name: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } },
          { slug: { $regex: search, $options: 'i' } }
        ];
      }

      if (parentId) {
        query.parentId = parentId === 'null' ? null : parentId;
      }

      if (status) {
        query.status = status;
      }

      if (featured !== undefined) {
        query.featured = featured;
      }

      if (level) {
        query.level = level;
      }

      // Tạo sort option
      let sortOption = {};
      if (sort) {
        const [field, order] = sort.split(',');
        sortOption = { [field]: order === 'desc' ? -1 : 1 };
      } else {
        sortOption = { order: 1, createdAt: -1 }; // Mặc định sắp xếp theo order tăng dần, createdAt giảm dần
      }

      // Đếm tổng số
      const total = await this.categoryModel.countDocuments(query);

      // Lấy dữ liệu phân trang
      const categories = await this.categoryModel
        .find(query)
        .sort(sortOption)
        .skip(skip)
        .limit(limit)
        .exec();

      // Lấy danh sách ID của categories để tìm thông tin bổ sung
      const categoryIds = categories.map(category => (category as any)._id);
      
      // Đếm số lượng danh mục con cho mỗi danh mục
      const childrenCountsPromises = categoryIds.map(catId => 
        this.categoryModel.countDocuments({ parentId: catId })
      );
      const childrenCounts = await Promise.all(childrenCountsPromises);
      
      // Lấy thông tin danh mục cha cho những danh mục có parentId
      const parentIds = categories
        .filter(c => c.parentId)
        .map(c => c.parentId);
        
      const parentCategories = await this.categoryModel.find(
        { _id: { $in: parentIds } },
        { _id: 1, name: 1, slug: 1 }
      );
      
      // Map parentCategories vào một đối tượng để dễ truy cập
      const parentMap = parentCategories.reduce<Record<string, any>>((map, parent) => {
        map[(parent as any)._id.toString()] = parent;
        return map;
      }, {});

      // Kết hợp thông tin
      const categoryResponses = categories.map((category, index) => {
        const categoryObj = category.toObject();
        const parent = category.parentId ? parentMap[category.parentId.toString()] : null;
        
        return {
          ...categoryObj,
          parent: parent ? {
            _id: parent._id,
            name: parent.name,
            slug: parent.slug
          } : undefined,
          childrenCount: childrenCounts[index]
        };
      });

      return {
        items: categoryResponses,
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      };
    } catch (error) {
      this.logger.error(`Lỗi khi tìm tất cả danh mục: ${error.message}`, error.stack);
      throw error;
    }
  }

  // Upload ảnh danh mục
  async uploadImage(categoryId: string, base64Image: string, alt?: string): Promise<any> {
    try {
      // Kiểm tra xem danh mục có tồn tại không
      const category = await this.categoryModel.findById(categoryId);
      if (!category) {
        throw new NotFoundException(`Không tìm thấy danh mục với ID: ${categoryId}`);
      }

      // Nếu đã có ảnh trước đó, xóa ảnh cũ
      if (category.image && category.image.publicId) {
        try {
          await this.cloudinaryService.deleteImage(category.image.publicId);
        } catch (error) {
          this.logger.warn(`Không thể xóa ảnh cũ từ Cloudinary: ${error.message}`);
        }
      }

      // Upload ảnh mới lên Cloudinary
      const uploadResult = await this.cloudinaryService.uploadImage(base64Image, {
        folder: 'category',
      });

      // Cập nhật thông tin ảnh vào danh mục
      const updatedCategory = await this.categoryModel.findByIdAndUpdate(
        categoryId,
        {
          image: {
            url: uploadResult.secureUrl,
            alt: alt || category.name,
            publicId: uploadResult.publicId,
          },
        },
        { new: true }
      );

      if (!updatedCategory) {
        throw new NotFoundException(`Không thể cập nhật danh mục với ID: ${categoryId}`);
      }

      return updatedCategory.toObject();
    } catch (error) {
      this.logger.error(`Lỗi khi upload ảnh danh mục: ${error.message}`, error.stack);
      throw error;
    }
  }

  // Thay đổi trạng thái danh mục
  async changeStatus(id: string, status: string): Promise<any> {
    try {
      if (!['active', 'inactive'].includes(status)) {
        throw new BadRequestException('Trạng thái không hợp lệ. Chỉ chấp nhận "active" hoặc "inactive"');
      }

      const updatedCategory = await this.categoryModel.findByIdAndUpdate(
        id,
        { status },
        { new: true }
      );

      if (!updatedCategory) {
        throw new NotFoundException(`Không tìm thấy danh mục với ID: ${id}`);
      }

      return updatedCategory.toObject();
    } catch (error) {
      this.logger.error(`Lỗi khi thay đổi trạng thái danh mục: ${error.message}`, error.stack);
      throw error;
    }
  }

  // Thay đổi thuộc tính featured của danh mục
  async changeFeatured(id: string, featured: boolean): Promise<any> {
    try {
      const updatedCategory = await this.categoryModel.findByIdAndUpdate(
        id,
        { featured },
        { new: true }
      );

      if (!updatedCategory) {
        throw new NotFoundException(`Không tìm thấy danh mục với ID: ${id}`);
      }

      return updatedCategory.toObject();
    } catch (error) {
      this.logger.error(`Lỗi khi thay đổi thuộc tính featured của danh mục: ${error.message}`, error.stack);
      throw error;
    }
  }

  // Thay đổi thứ tự hiển thị của danh mục
  async changeOrder(id: string, order: number): Promise<any> {
    try {
      const updatedCategory = await this.categoryModel.findByIdAndUpdate(
        id,
        { order },
        { new: true }
      );

      if (!updatedCategory) {
        throw new NotFoundException(`Không tìm thấy danh mục với ID: ${id}`);
      }

      return updatedCategory.toObject();
    } catch (error) {
      this.logger.error(`Lỗi khi thay đổi thứ tự hiển thị của danh mục: ${error.message}`, error.stack);
      throw error;
    }
  }

  // Upload ảnh tạm thời không cần ID danh mục
  async uploadTempImage(base64Image: string, alt?: string): Promise<any> {
    try {
      this.logger.log('Bắt đầu tải lên ảnh tạm thời lên Cloudinary');

      // Upload ảnh lên Cloudinary
      const uploadResult = await this.cloudinaryService.uploadImage(base64Image, {
        folder: 'category_temp',
      });

      this.logger.log('Tải lên ảnh tạm thời thành công');

      return {
        url: uploadResult.secureUrl,
        publicId: uploadResult.publicId,
        width: uploadResult.width,
        height: uploadResult.height,
        format: uploadResult.format
      };
    } catch (error) {
      this.logger.error(`Lỗi khi upload ảnh tạm thời: ${error.message}`, error.stack);
      throw error;
    }
  }

  // Lấy thống kê tổng quan về danh mục
  async getStatistics(): Promise<any> {
    try {
      // Đếm tổng số danh mục
      const total = await this.categoryModel.countDocuments();
      
      // Đếm số danh mục active
      const active = await this.categoryModel.countDocuments({ status: 'active' });
      
      // Đếm số danh mục inactive
      const inactive = await this.categoryModel.countDocuments({ status: 'inactive' });
      
      // Đếm số danh mục featured
      const featured = await this.categoryModel.countDocuments({ featured: true });
      
      return {
        total,
        active,
        inactive,
        featured
      };
    } catch (error) {
      this.logger.error(`Lỗi khi lấy thống kê danh mục: ${error.message}`, error.stack);
      throw error;
    }
  }
}
