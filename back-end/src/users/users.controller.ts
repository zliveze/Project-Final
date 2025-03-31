import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { AddressDto } from './dto/address.dto';
import { User, UserDocument } from './schemas/user.schema';

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
    return this.usersService.findOne(id);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
  ): Promise<UserDocument> {
    return this.usersService.update(id, updateUserDto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string): Promise<void> {
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

  @Post(':id/wishlist/:productId')
  async addToWishlist(
    @Param('id') id: string,
    @Param('productId') productId: string,
  ): Promise<UserDocument> {
    return this.usersService.addToWishlist(id, productId);
  }

  @Delete(':id/wishlist/:productId')
  async removeFromWishlist(
    @Param('id') id: string,
    @Param('productId') productId: string,
  ): Promise<UserDocument> {
    return this.usersService.removeFromWishlist(id, productId);
  }
}
