import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
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
    // Tạo ID cho địa chỉ mới
    const addressWithId = {
      ...addressDto,
      addressId: uuidv4()
    };

    return this.usersService.addAddress(userId, addressWithId);
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

    // Tìm địa chỉ cần đặt làm mặc định
    const addressToSetDefault = user.addresses.find(address => address.addressId === addressId);
    if (!addressToSetDefault) {
      throw new NotFoundException('Không tìm thấy địa chỉ');
    }

    // Cập nhật từng địa chỉ một cách riêng biệt
    for (const address of user.addresses) {
      // Bỏ qua địa chỉ nếu trạng thái đã đúng
      if ((address.addressId === addressId) === address.isDefault) {
        continue;
      }

      // Cập nhật địa chỉ với dữ liệu đầy đủ
      const updatedAddressDto: AddressDto = {
        addressId: address.addressId,
        addressLine: address.addressLine,
        city: address.city,
        state: address.state,
        country: address.country,
        postalCode: address.postalCode,
        isDefault: address.addressId === addressId
      };

      await this.usersService.updateAddress(userId, address.addressId, updatedAddressDto);
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