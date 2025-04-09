import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { User, UserDocument } from '../schemas/user.schema';
import { UsersService } from '../users.service';
import { ProductResponseDto } from '../../products/dto';

@Injectable()
export class WishlistService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    private readonly usersService: UsersService,
    @InjectModel('Product') private readonly productModel: Model<any>,
  ) {}

  // Get detailed wishlist items for a user
  async getWishlistItems(userId: string): Promise<any[]> {
    const user = await this.usersService.findOne(userId);
    if (!user) {
      throw new NotFoundException('Không tìm thấy người dùng');
    }

    // If wishlist is empty, return empty array
    if (!user.wishlist || user.wishlist.length === 0) {
      return [];
    }

    // Convert string IDs to ObjectIds
    const productIds: Types.ObjectId[] = [];
    for (const id of user.wishlist) {
      try {
        if (Types.ObjectId.isValid(id)) {
          productIds.push(new Types.ObjectId(id));
        } else {
          console.warn(`Invalid ObjectId in wishlist: ${id}`);
        }
      } catch (e) {
        console.error(`Error converting wishlist ID to ObjectId: ${id}`, e);
      }
    }

    // If no valid product IDs, return empty array
    if (productIds.length === 0) {
      return [];
    }

    // Fetch products from the wishlist
    const products = await this.productModel
      .find({ _id: { $in: productIds } })
      .select('_id name slug price currentPrice status images brandId flags')
      .populate('brandId', 'name')
      .lean()
      .exec();

    // Map products to response format
    return products.map((product: any) => {
      // Find primary image or use first available
      let imageUrl = '';
      if (product.images && product.images.length > 0) {
        const primaryImage = product.images.find((img: any) => img.isPrimary);
        imageUrl = primaryImage ? primaryImage.url : product.images[0].url;
      }

      return {
        _id: product._id ? product._id.toString() : '',
        id: product._id ? product._id.toString() : '',
        name: product.name,
        slug: product.slug,
        price: product.price,
        currentPrice: product.currentPrice || product.price,
        status: product.status,
        imageUrl,
        brandId: product.brandId ? (product.brandId._id ? product.brandId._id.toString() : undefined) : undefined,
        brandName: product.brandId ? product.brandId.name : undefined,
        flags: product.flags || {},
        // Add required fields from ProductResponseDto with default values
        description: '',
        category: '',
        brand: product.brandId ? product.brandId.name : '',
        sku: '',
        image: imageUrl,
        stock: 0,
        createdAt: '',
        updatedAt: '',
      };
    });
  }

  // Add product to wishlist
  async addToWishlist(userId: string, productId: string): Promise<UserDocument> {
    // Validate product ID format
    if (!Types.ObjectId.isValid(productId)) {
      throw new NotFoundException(`ID sản phẩm không hợp lệ: ${productId}`);
    }

    // Validate product exists
    const productExists = await this.productModel.exists({ _id: new Types.ObjectId(productId) });
    if (!productExists) {
      throw new NotFoundException(`Không tìm thấy sản phẩm với ID: ${productId}`);
    }

    return this.usersService.addToWishlist(userId, productId);
  }

  // Remove product from wishlist
  async removeFromWishlist(userId: string, productId: string): Promise<UserDocument> {
    // Validate product ID format
    if (!Types.ObjectId.isValid(productId)) {
      throw new NotFoundException(`ID sản phẩm không hợp lệ: ${productId}`);
    }

    return this.usersService.removeFromWishlist(userId, productId);
  }

  // Clear entire wishlist
  async clearWishlist(userId: string): Promise<UserDocument> {
    const user = await this.usersService.findOne(userId);
    if (!user) {
      throw new NotFoundException('Không tìm thấy người dùng');
    }

    user.wishlist = [];
    return user.save();
  }
}
