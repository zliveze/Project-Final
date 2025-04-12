import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { AddressDto } from './dto/address.dto';
import { User, UserDocument } from './schemas/user.schema';
import { AddToWishlistDto, RemoveFromWishlistDto } from './dto/add-to-wishlist.dto'; // Import DTOs

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  async create(@Body() createUserDto: CreateUserDto): Promise<UserDocument> {
    return this.usersService.create(createUserDto);
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin','superadmin')
  async findAll(): Promise<UserDocument[]> {
    return this.usersService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<UserDocument> {
    if (id === 'profile') {
      throw new Error('Không thể truy cập profile qua endpoint này, vui lòng sử dụng /users/profile');
    }
    return this.usersService.findOne(id);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
  ): Promise<UserDocument> {
    if (id === 'profile') {
      throw new Error('Không thể cập nhật profile qua endpoint này, vui lòng sử dụng /users/profile');
    }
    return this.usersService.update(id, updateUserDto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string): Promise<void> {
    if (id === 'profile') {
      throw new Error('Không thể xóa profile qua endpoint này');
    }
    return this.usersService.remove(id);
  }

  @Post(':id/addresses')
  async addAddress(
    @Param('id') id: string,
    @Body() addressDto: AddressDto,
  ): Promise<UserDocument> {
    return this.usersService.addAddress(id, addressDto);
  }

  @Patch(':id/addresses/:addressId')
  async updateAddress(
    @Param('id') id: string,
    @Param('addressId') addressId: string,
    @Body() addressDto: AddressDto,
  ): Promise<UserDocument> {
    return this.usersService.updateAddress(id, addressId, addressDto);
  }

  @Delete(':id/addresses/:addressId')
  async removeAddress(
    @Param('id') id: string,
    @Param('addressId') addressId: string,
  ): Promise<UserDocument> {
    return this.usersService.removeAddress(id, addressId);
  }

  // Updated addToWishlist endpoint to accept variantId in the body
  @Post(':id/wishlist')
  @UseGuards(JwtAuthGuard) // Assuming only logged-in users can add to wishlist
  async addToWishlist(
    @Param('id') id: string,
    @Body() addToWishlistDto: AddToWishlistDto,
  ): Promise<UserDocument> {
    // TODO: Add validation to ensure the user ID from the token matches the param ID, or use @Req() user
    return this.usersService.addToWishlist(id, addToWishlistDto.productId, addToWishlistDto.variantId);
  }

  // Updated removeFromWishlist endpoint to accept variantId in the body or query params
  // Using DELETE with body is sometimes debated, query params might be better
  @Delete(':id/wishlist')
  @UseGuards(JwtAuthGuard) // Assuming only logged-in users can remove from wishlist
  async removeFromWishlist(
    @Param('id') id: string,
    @Body() removeFromWishlistDto: RemoveFromWishlistDto, // Or use @Query()
  ): Promise<UserDocument> {
    // TODO: Add validation to ensure the user ID from the token matches the param ID, or use @Req() user
    return this.usersService.removeFromWishlist(id, removeFromWishlistDto.productId, removeFromWishlistDto.variantId);
  }
}
