import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Branch, BranchDocument } from './schemas/branch.schema';
import { CreateBranchDto } from './dto/create-branch.dto';
import { UpdateBranchDto } from './dto/update-branch.dto';
import { BranchFilterDto } from './dto/branch-filter.dto';
import { ProductsService } from '../products/products.service';
import { ViettelPostService } from '../shared/services/viettel-post.service';

@Injectable()
export class BranchesService {
  private readonly logger = new Logger(BranchesService.name);

  constructor(
    @InjectModel(Branch.name) private branchModel: Model<BranchDocument>,
    private readonly productsService: ProductsService,
    private readonly viettelPostService: ViettelPostService,
  ) {}

  private async validateAddressCodes(provinceCode: string, districtCode: string, wardCode: string): Promise<void> {
    try {
      const provinceId = parseInt(provinceCode);
      const districtId = parseInt(districtCode);
      const wardId = parseInt(wardCode);

      // Validate Province
      const provinces = await this.viettelPostService.getProvinces();
      const province = provinces.find((p: any) => p.PROVINCE_ID === provinceId);
      if (!province) {
        throw new BadRequestException(`Mã tỉnh/thành phố không hợp lệ: ${provinceId}`);
      }

      // Validate District
      const districts = await this.viettelPostService.getDistricts(province.PROVINCE_ID);
      const district = districts.find((d: any) => d.DISTRICT_ID === districtId);
      if (!district) {
        throw new BadRequestException(`Mã quận/huyện không hợp lệ: ${districtId} cho tỉnh/thành phố ${province.PROVINCE_NAME}`);
      }

      // Validate Ward
      const wards = await this.viettelPostService.getWards(district.DISTRICT_ID);
      const ward = wards.find((w: any) => w.WARDS_ID === wardId);
      if (!ward) {
        throw new BadRequestException(`Mã phường/xã không hợp lệ: ${wardId} cho quận/huyện ${district.DISTRICT_NAME}`);
      }

    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException(`Lỗi khi xác thực địa chỉ với ViettelPost: ${error.message}`);
    }
  }

  async create(createBranchDto: CreateBranchDto): Promise<BranchDocument> {
    await this.validateAddressCodes(
      createBranchDto.provinceCode,
      createBranchDto.districtCode,
      createBranchDto.wardCode,
    );

    try {
      const newBranch = new this.branchModel(createBranchDto);
      return await newBranch.save();
    } catch (error) {
      this.logger.error(`Lỗi khi tạo chi nhánh: ${error.message}`);
      throw error;
    }
  }

  async findAll(filterDto: BranchFilterDto): Promise<any> {
    try {
      const { page = 1, limit = 10, search, sort } = filterDto;
      const skip = (page - 1) * limit;

      const query: any = {};

      if (search) {
        query.$or = [
          { name: { $regex: search, $options: 'i' } },
          { address: { $regex: search, $options: 'i' } },
          { contact: { $regex: search, $options: 'i' } }
        ];
      }

      let sortOption = {};
      if (sort) {
        const [field, order] = sort.split(',');
        sortOption = { [field]: order === 'desc' ? -1 : 1 };
      } else {
        sortOption = { createdAt: -1 };
      }

      // Parallel execution for better performance
      const [total, branches] = await Promise.all([
        this.branchModel.countDocuments(query),
        this.branchModel
          .find(query)
          .sort(sortOption)
          .skip(skip)
          .limit(limit)
          .lean()
          .exec()
      ]);

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
      this.logger.error(`Lỗi khi lấy danh sách chi nhánh: ${error.message}`);
      throw error;
    }
  }

  async findOne(id: string): Promise<BranchDocument> {
    try {
      const branch = await this.branchModel.findById(id).lean().exec();
      if (!branch) {
        throw new NotFoundException(`Không tìm thấy chi nhánh với ID: ${id}`);
      }
      return branch as BranchDocument;
    } catch (error) {
      this.logger.error(`Lỗi khi tìm chi nhánh: ${error.message}`);
      throw error;
    }
  }

  async update(id: string, updateBranchDto: UpdateBranchDto): Promise<BranchDocument> {
    if (updateBranchDto.provinceCode && updateBranchDto.districtCode && updateBranchDto.wardCode) {
      await this.validateAddressCodes(
        updateBranchDto.provinceCode,
        updateBranchDto.districtCode,
        updateBranchDto.wardCode,
      );
    } else if (updateBranchDto.provinceCode || updateBranchDto.districtCode || updateBranchDto.wardCode) {
      throw new BadRequestException('Để cập nhật địa chỉ, vui lòng cung cấp đầy đủ mã tỉnh/thành phố, quận/huyện và phường/xã.');
    }

    try {
      const existingBranch = await this.branchModel
        .findByIdAndUpdate(id, updateBranchDto, { new: true, lean: true })
        .exec();

      if (!existingBranch) {
        throw new NotFoundException(`Không tìm thấy chi nhánh với ID: ${id}`);
      }

      return existingBranch as BranchDocument;
    } catch (error) {
      this.logger.error(`Lỗi khi cập nhật chi nhánh: ${error.message}`);
      throw error;
    }
  }

  async remove(id: string): Promise<void> {
    try {
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
      this.logger.error(`Lỗi khi xóa chi nhánh: ${error.message}`);
      throw error;
    }
  }

  async getProductsCount(id: string): Promise<{ branchId: string; productsCount: number; branchName: string }> {
    try {
      const branch = await this.branchModel.findById(id).select('name').lean().exec();

      if (!branch) {
        throw new NotFoundException(`Không tìm thấy chi nhánh với ID: ${id}`);
      }

      const productsCount = await this.productsService.countProductsReferencingBranch(id);

      return {
        branchId: id,
        productsCount,
        branchName: branch.name
      };
    } catch (error) {
      this.logger.error(`Lỗi khi kiểm tra số sản phẩm tham chiếu đến chi nhánh: ${error.message}`);
      throw error;
    }
  }

  async removeWithReferences(id: string): Promise<{ success: boolean; message: string; productsUpdated: number }> {
    try {
      const branch = await this.branchModel.findById(id).select('name').lean().exec();

      if (!branch) {
        throw new NotFoundException(`Không tìm thấy chi nhánh với ID: ${id}`);
      }

      const result = await this.productsService.removeBranchFromProducts(id);
      await this.branchModel.findByIdAndDelete(id).exec();

      // Cleanup orphaned inventory
      try {
        const cleanupResult = await this.productsService.cleanupOrphanedInventory();
        this.logger.log(`Cleanup completed: ${cleanupResult.cleaned} orphaned inventory entries removed`);
      } catch (cleanupError) {
        this.logger.warn(`Cleanup failed but branch deletion succeeded: ${cleanupError.message}`);
      }

      return {
        success: true,
        message: `Chi nhánh đã được xóa thành công và đã cập nhật ${result.count} sản phẩm.`,
        productsUpdated: result.count
      };
    } catch (error) {
      this.logger.error(`Lỗi khi xóa chi nhánh và cập nhật tham chiếu: ${error.message}`);
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
      this.logger.error(`Lỗi khi lấy thống kê chi nhánh: ${error.message}`);
      throw error;
    }
  }
}
