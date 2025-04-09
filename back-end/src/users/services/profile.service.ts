import { Injectable, NotFoundException } from '@nestjs/common'; // Removed unused UnauthorizedException
import { Types } from 'mongoose'; // Import Types
import { UpdateProfileDto } from '../dto/profile.dto';
import { AddressDto } from '../dto/address.dto';
import { UsersService } from '../users.service';
import { UserDocument } from '../schemas/user.schema';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class ProfileService {
  constructor(
    private readonly usersService: UsersService,
  ) {}

  // Lấy thông tin profile của người dùng
  async getProfile(userId: string): Promise<UserDocument> {
    const user = await this.usersService.findOne(userId);
    if (!user) {
      throw new NotFoundException('Không tìm thấy người dùng');
    }
    return user;
  }

  // Cập nhật thông tin profile của người dùng
  async updateProfile(userId: string, updateProfileDto: UpdateProfileDto): Promise<UserDocument> {
    const user = await this.usersService.findOne(userId);
    if (!user) {
      throw new NotFoundException('Không tìm thấy người dùng');
    }

    // Loại bỏ trường địa chỉ khỏi việc cập nhật trực tiếp (địa chỉ sẽ được quản lý bởi các API riêng)
    const { addresses, ...updateData } = updateProfileDto;

    return this.usersService.update(userId, updateData);
  }

  // Thêm địa chỉ mới
  async addAddress(userId: string, addressDto: AddressDto): Promise<UserDocument> {
    // Không cần tạo addressId ở đây, Mongoose sẽ tự tạo _id cho subdocument
    // UsersService sẽ xử lý việc thêm địa chỉ vào mảng addresses của user
    return this.usersService.addAddress(userId, addressDto);
  }

  // Cập nhật địa chỉ hiện có
  async updateAddress(userId: string, addressId: string, addressDto: AddressDto): Promise<UserDocument> {
    return this.usersService.updateAddress(userId, addressId, addressDto);
  }

  // Xóa địa chỉ
  async deleteAddress(userId: string, addressId: string): Promise<UserDocument> {
    return this.usersService.removeAddress(userId, addressId);
  }

  // Đặt địa chỉ mặc định
  async setDefaultAddress(userId: string, addressId: string): Promise<UserDocument> {
    const user = await this.usersService.findOne(userId);
    if (!user) {
      throw new NotFoundException('Không tìm thấy người dùng');
    }

    // Tìm địa chỉ cần đặt làm mặc định bằng _id
    const addressToSetDefault = user.addresses.find(address => address._id.toString() === addressId);
    if (!addressToSetDefault) {
      throw new NotFoundException('Không tìm thấy địa chỉ với ID này');
    }

    // Cập nhật trạng thái isDefault cho tất cả địa chỉ
    // Chỉ cần cập nhật isDefault, không cần gửi toàn bộ DTO
    // Tuy nhiên, usersService.updateAddress mong đợi AddressDto, nên ta cần tạo DTO chỉ với isDefault
    for (const address of user.addresses) {
      const shouldBeDefault = address._id.toString() === addressId;
      // Chỉ cập nhật nếu trạng thái isDefault hiện tại khác với trạng thái mong muốn
      if (address.isDefault !== shouldBeDefault) {
        // Tạo DTO chỉ chứa trường isDefault để cập nhật
        const updateDto: Partial<AddressDto> = {
          isDefault: shouldBeDefault
        };
        // Gọi service để cập nhật, truyền _id dưới dạng string
        await this.usersService.updateAddress(userId, address._id.toString(), updateDto as AddressDto); // Cast vì updateAddress mong đợi AddressDto đầy đủ
      }
    }
    
    return this.usersService.findOne(userId);
  }

  // Thêm sản phẩm vào wishlist
  async addToWishlist(userId: string, productId: string): Promise<UserDocument> {
    return this.usersService.addToWishlist(userId, productId);
  }

  // Xóa sản phẩm khỏi wishlist
  async removeFromWishlist(userId: string, productId: string): Promise<UserDocument> {
    return this.usersService.removeFromWishlist(userId, productId);
  }

  // Lấy danh sách wishlist
  async getWishlist(userId: string): Promise<string[]> {
    const user = await this.usersService.findOne(userId);
    if (!user) {
      throw new NotFoundException('Không tìm thấy người dùng');
    }

    return user.wishlist || [];
  }
}
