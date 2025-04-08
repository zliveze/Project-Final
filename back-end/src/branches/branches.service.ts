import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Branch, BranchDocument } from './schemas/branch.schema';
import { CreateBranchDto } from './dto/create-branch.dto';
import { UpdateBranchDto } from './dto/update-branch.dto';
import { BranchFilterDto } from './dto/branch-filter.dto';
import { ProductsService } from '../products/products.service';

@Injectable()
export class BranchesService {
  private readonly logger = new Logger(BranchesService.name);

  constructor(
    @InjectModel(Branch.name) private branchModel: Model<BranchDocument>,
    private readonly productsService: ProductsService,
  ) {}

  async create(createBranchDto: CreateBranchDto): Promise<BranchDocument> {
    try {
      const newBranch = new this.branchModel(createBranchDto);
      return await newBranch.save();
    } catch (error) {
      this.logger.error(`Lỗi khi tạo chi nhánh: ${error.message}`, error.stack);
      throw error;
    }
  }

  async findAll(filterDto: BranchFilterDto): Promise<any> {
    try {
      const { page = 1, limit = 10, search, sort } = filterDto;
      const skip = (page - 1) * limit;

      // Xây dựng query
      const query: any = {};

      if (search) {
        query.$or = [
          { name: { $regex: search, $options: 'i' } },
          { address: { $regex: search, $options: 'i' } },
          { contact: { $regex: search, $options: 'i' } }
        ];
      }

      // Tạo sort option
      let sortOption = {};
      if (sort) {
        const [field, order] = sort.split(',');
        sortOption = { [field]: order === 'desc' ? -1 : 1 };
      } else {
        sortOption = { createdAt: -1 };
      }

      // Đếm tổng số
      const total = await this.branchModel.countDocuments(query);

      // Lấy dữ liệu phân trang
      const branches = await this.branchModel
        .find(query)
        .sort(sortOption)
        .skip(skip)
        .limit(limit)
        .exec();

      return {
        data: branches,
        pagination: {
          total,
          page: +page,
          limit: +limit,
          totalPages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      this.logger.error(`Lỗi khi lấy danh sách chi nhánh: ${error.message}`, error.stack);
      throw error;
    }
  }

  async findOne(id: string): Promise<BranchDocument> {
    try {
      const branch = await this.branchModel.findById(id).exec();
      if (!branch) {
        throw new NotFoundException(`Không tìm thấy chi nhánh với ID: ${id}`);
      }
      return branch;
    } catch (error) {
      this.logger.error(`Lỗi khi tìm chi nhánh: ${error.message}`, error.stack);
      throw error;
    }
  }

  async update(id: string, updateBranchDto: UpdateBranchDto): Promise<BranchDocument> {
    try {
      const existingBranch = await this.branchModel
        .findByIdAndUpdate(id, updateBranchDto, { new: true })
        .exec();
      
      if (!existingBranch) {
        throw new NotFoundException(`Không tìm thấy chi nhánh với ID: ${id}`);
      }
      
      return existingBranch;
    } catch (error) {
      this.logger.error(`Lỗi khi cập nhật chi nhánh: ${error.message}`, error.stack);
      throw error;
    }
  }

  async remove(id: string): Promise<void> {
    try {
      // Kiểm tra xem có sản phẩm nào đang sử dụng chi nhánh này không
      const productsUsingBranch = await this.productsService.countProductsReferencingBranch(id);
      
      if (productsUsingBranch > 0) {
        throw new BadRequestException(
          `Không thể xóa chi nhánh này vì có ${productsUsingBranch} sản phẩm đang tham chiếu đến chi nhánh này. Vui lòng cập nhật thông tin sản phẩm trước khi xóa chi nhánh.`
        );
      }
      
      const result = await this.branchModel.findByIdAndDelete(id).exec();
      
      if (!result) {
        throw new NotFoundException(`Không tìm thấy chi nhánh với ID: ${id}`);
      }
    } catch (error) {
      this.logger.error(`Lỗi khi xóa chi nhánh: ${error.message}`, error.stack);
      throw error;
    }
  }

  // Phương thức để xóa chi nhánh và cập nhật tất cả sản phẩm tham chiếu đến chi nhánh đó
  async removeWithReferences(id: string): Promise<{ success: boolean; message: string; productsUpdated: number }> {
    try {
      // Kiểm tra chi nhánh tồn tại
      const branch = await this.branchModel.findById(id).exec();
      
      if (!branch) {
        throw new NotFoundException(`Không tìm thấy chi nhánh với ID: ${id}`);
      }
      
      // Xóa tham chiếu chi nhánh khỏi tất cả sản phẩm
      const result = await this.productsService.removeBranchFromProducts(id);
      
      // Xóa chi nhánh
      await this.branchModel.findByIdAndDelete(id).exec();
      
      return {
        success: true,
        message: `Chi nhánh đã được xóa thành công và đã cập nhật ${result.count} sản phẩm.`,
        productsUpdated: result.count
      };
    } catch (error) {
      this.logger.error(`Lỗi khi xóa chi nhánh và cập nhật tham chiếu: ${error.message}`, error.stack);
      throw error;
    }
  }

  async getStatistics(): Promise<any> {
    try {
      const totalBranches = await this.branchModel.countDocuments();
      
      return {
        totalBranches
      };
    } catch (error) {
      this.logger.error(`Lỗi khi lấy thống kê chi nhánh: ${error.message}`, error.stack);
      throw error;
    }
  }
} 