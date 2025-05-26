import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Branch, BranchDocument } from './schemas/branch.schema';
import { CreateBranchDto } from './dto/create-branch.dto';
import { UpdateBranchDto } from './dto/update-branch.dto';
import { BranchFilterDto } from './dto/branch-filter.dto';
import { ProductsService } from '../products/products.service';
import { ViettelPostService } from '../shared/services/viettel-post.service'; // Import ViettelPostService

@Injectable()
export class BranchesService {
  private readonly logger = new Logger(BranchesService.name);

  constructor(
    @InjectModel(Branch.name) private branchModel: Model<BranchDocument>,
    private readonly productsService: ProductsService,
    private readonly viettelPostService: ViettelPostService, // Inject ViettelPostService
  ) {}

  // Helper function to validate address codes
  private async validateAddressCodes(provinceCode: string, districtCode: string, wardCode: string): Promise<void> {
    try {
      this.logger.log(`Validating address codes: province=${provinceCode}, district=${districtCode}, ward=${wardCode}`);

      // Validate Province
      const provinces = await this.viettelPostService.getProvinces();
      // Tìm province dựa trên PROVINCE_ID
      const provinceId = parseInt(provinceCode);
      const province = provinces.find((p: any) => p.PROVINCE_ID === provinceId);
      if (!province) {
        this.logger.error(`Province not found with ID: ${provinceId}`);
        this.logger.debug(`Available provinces: ${JSON.stringify(provinces.map((p: any) => ({ id: p.PROVINCE_ID, code: p.PROVINCE_CODE, name: p.PROVINCE_NAME })))}`);
        throw new BadRequestException(`Mã tỉnh/thành phố không hợp lệ: ${provinceId}`);
      }

      this.logger.log(`Found province: ${province.PROVINCE_NAME} (ID: ${province.PROVINCE_ID})`);

      // Validate District
      const districts = await this.viettelPostService.getDistricts(province.PROVINCE_ID);
      // Tìm district dựa trên DISTRICT_ID
      const districtId = parseInt(districtCode);
      const district = districts.find((d: any) => d.DISTRICT_ID === districtId);
      if (!district) {
        this.logger.error(`District not found with ID: ${districtId} in province ${province.PROVINCE_NAME}`);
        this.logger.debug(`Available districts: ${JSON.stringify(districts.map((d: any) => ({ id: d.DISTRICT_ID, value: d.DISTRICT_VALUE, name: d.DISTRICT_NAME })))}`);
        throw new BadRequestException(`Mã quận/huyện không hợp lệ: ${districtId} cho tỉnh/thành phố ${province.PROVINCE_NAME}`);
      }

      this.logger.log(`Found district: ${district.DISTRICT_NAME} (ID: ${district.DISTRICT_ID})`);

      // Validate Ward
      const wards = await this.viettelPostService.getWards(district.DISTRICT_ID);
      // Tìm ward dựa trên WARDS_ID
      const wardId = parseInt(wardCode);
      const ward = wards.find((w: any) => w.WARDS_ID === wardId);
      if (!ward) {
        this.logger.error(`Ward not found with ID: ${wardId} in district ${district.DISTRICT_NAME}`);
        this.logger.debug(`Available wards: ${JSON.stringify(wards.map((w: any) => ({ id: w.WARDS_ID, name: w.WARDS_NAME })))}`);
        throw new BadRequestException(`Mã phường/xã không hợp lệ: ${wardId} cho quận/huyện ${district.DISTRICT_NAME}`);
      }

      this.logger.log(`Found ward: ${ward.WARDS_NAME} (ID: ${ward.WARDS_ID})`);
      this.logger.log(`Address validation successful`);

    } catch (error) {
      this.logger.error(`Lỗi xác thực mã địa chỉ: ${error.message}`, error.stack);
      if (error instanceof BadRequestException) {
        throw error;
      }
      // Re-throw other errors from ViettelPostService (e.g., API connection issues)
      throw new BadRequestException(`Lỗi khi xác thực địa chỉ với ViettelPost: ${error.message}`);
    }
  }

  async create(createBranchDto: CreateBranchDto): Promise<BranchDocument> {
    // Validate address codes before creating
    await this.validateAddressCodes(
      createBranchDto.provinceCode,
      createBranchDto.districtCode,
      createBranchDto.wardCode,
    );

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
    // Validate address codes if they are provided in the update DTO
    if (updateBranchDto.provinceCode && updateBranchDto.districtCode && updateBranchDto.wardCode) {
      await this.validateAddressCodes(
        updateBranchDto.provinceCode,
        updateBranchDto.districtCode,
        updateBranchDto.wardCode,
      );
    } else if (updateBranchDto.provinceCode || updateBranchDto.districtCode || updateBranchDto.wardCode) {
      // If only some codes are provided, it's an incomplete address update
      throw new BadRequestException('Để cập nhật địa chỉ, vui lòng cung cấp đầy đủ mã tỉnh/thành phố, quận/huyện và phường/xã.');
    }

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

  // Phương thức để kiểm tra số lượng sản phẩm tham chiếu đến chi nhánh
  async getProductsCount(id: string): Promise<{ branchId: string; productsCount: number; branchName: string }> {
    try {
      // Kiểm tra chi nhánh tồn tại
      const branch = await this.branchModel.findById(id).exec();

      if (!branch) {
        throw new NotFoundException(`Không tìm thấy chi nhánh với ID: ${id}`);
      }

      this.logger.log(`[GetProductsCount] Checking products count for branch ${id} (${branch.name})`);

      // Debug: Kiểm tra tất cả chi nhánh trong database
      const allBranches = await this.branchModel.find({}).select('_id name').lean();
      this.logger.log(`[GetProductsCount] All branches in database:`, JSON.stringify(allBranches, null, 2));

      // Đếm số sản phẩm tham chiếu đến chi nhánh này
      const productsCount = await this.productsService.countProductsReferencingBranch(id);

      this.logger.log(`[GetProductsCount] Branch ${id} (${branch.name}) has ${productsCount} products referencing it`);

      return {
        branchId: id,
        productsCount,
        branchName: branch.name
      };
    } catch (error) {
      this.logger.error(`Lỗi khi kiểm tra số sản phẩm tham chiếu đến chi nhánh: ${error.message}`, error.stack);
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

      // Dọn dẹp dữ liệu rác còn sót lại (nếu có)
      this.logger.log(`[RemoveWithReferences] Running cleanup for orphaned inventory after deleting branch ${id}`);
      try {
        const cleanupResult = await this.productsService.cleanupOrphanedInventory();
        this.logger.log(`[RemoveWithReferences] Cleanup completed: ${cleanupResult.cleaned} orphaned inventory entries removed`);
      } catch (cleanupError) {
        this.logger.warn(`[RemoveWithReferences] Cleanup failed but branch deletion succeeded: ${cleanupError.message}`);
      }

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
