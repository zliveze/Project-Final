import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { UsersService } from '../users.service';
import { User, UserDocument } from '../schemas/user.schema';
import { Product, ProductDocument } from '../../products/schemas/product.schema'; // Import Product schema

@Injectable()
export class WishlistService {
  constructor(
    private readonly usersService: UsersService,
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    @InjectModel(Product.name) private readonly productModel: Model<ProductDocument>, // Inject ProductModel
  ) {}

  // Method to get the user's wishlist with populated product details
  async getWishlist(userId: string | Types.ObjectId): Promise<any[]> { // Return type can be more specific
    const user = await this.userModel.findById(userId)
      .select('wishlist') // Select only the wishlist field
      .populate({
        path: 'wishlist.productId',
        model: 'Product', // Ensure 'Product' matches the name used in MongooseModule.forFeature
        select: 'name slug price currentPrice images brandId status variants', // Select necessary product fields
        populate: { // Populate brand details within the product
            path: 'brandId',
            model: 'Brand', // Ensure 'Brand' matches the name used in MongooseModule.forFeature
            select: 'name slug logo' // Select necessary brand fields
        }
      })
      .lean() // Use lean for better performance if not modifying the result
      .exec();

    if (!user) {
      // Ensure userId is converted to string for the error message
      const userIdString = typeof userId === 'string' ? userId : userId.toString();
      throw new NotFoundException(`Không tìm thấy người dùng với ID ${userIdString}`);
    }

    if (!user.wishlist || user.wishlist.length === 0) {
        return []; // Return empty array if wishlist is empty
    }

    // Format the wishlist items
    const formattedWishlist = user.wishlist.map(item => {
        const product = item.productId as any; // Cast to any to access populated fields easily

        if (!product) {
            // Handle cases where a product might have been deleted but still exists in wishlist
            console.warn(`Product with ID ${item.productId} not found for wishlist item.`);
            return null; // Or return a placeholder object
        }

        // Find the specific variant details from the populated product
        const variant = product.variants.find((v: any) => v.variantId === item.variantId);

        if (!variant) {
            console.warn(`Variant with ID ${item.variantId} not found in product ${product._id}.`);
            // Decide how to handle: skip, use base product info, etc.
            // Using base product info for now, but might need adjustment
             return {
                productId: product._id,
                variantId: item.variantId, // Keep the requested variantId
                name: product.name, // Base product name
                slug: product.slug,
                price: product.price, // Base price
                currentPrice: product.currentPrice, // Base current price
                image: product.images?.find((img: any) => img.isPrimary)?.url || product.images?.[0]?.url || '/placeholder.png', // Base primary image
                brand: product.brandId ? { // Use populated brand info
                    name: (product.brandId as any).name,
                    slug: (product.brandId as any).slug,
                    logo: (product.brandId as any).logo?.url
                } : null,
                inStock: product.status === 'active', // Base product status might not reflect variant stock
                variantInfo: null // Indicate variant wasn't found
            };
        }

        // Determine the correct price (variant price or base price)
        const displayPrice = variant.price ?? product.price;
        const displayCurrentPrice = variant.currentPrice ?? product.currentPrice ?? displayPrice;

        // Determine the correct image (variant image or base image)
        const variantImage = variant.images?.find((img: any) => img.isPrimary)?.url || variant.images?.[0]?.url;
        const productImage = product.images?.find((img: any) => img.isPrimary)?.url || product.images?.[0]?.url;
        const displayImage = variantImage || productImage || '/placeholder.png'; // Fallback placeholder

        // Determine stock status (more complex, might need inventory check)
        // Simple check based on variant quantity or product status for now
        const isInStock = (variant.quantity > 0 || product.status === 'active'); // Simplified stock check

        return {
            productId: product._id,
            variantId: item.variantId,
            name: product.name, // Consider adding variant specifics to name if needed
            slug: product.slug, // Product slug
            price: displayPrice,
            currentPrice: displayCurrentPrice,
            image: displayImage,
            brand: product.brandId ? { // Use populated brand info
                name: (product.brandId as any).name,
                slug: (product.brandId as any).slug,
                logo: (product.brandId as any).logo?.url
            } : null,
            inStock: isInStock,
            variantOptions: variant.options // Include variant options (color, size, etc.)
        };
    }).filter(item => item !== null); // Filter out items where the product was not found

    return formattedWishlist;
  }

  // Calls the updated method in UsersService
  async addToWishlist(userId: string | Types.ObjectId, productIdInput: string | Types.ObjectId, variantId: string): Promise<UserDocument> {
    console.log('WishlistService.addToWishlist called with:', { userId, productIdInput, variantId });

    // Validate inputs
    if (!userId) {
      console.error('userId is required');
      throw new BadRequestException('userId is required');
    }

    if (!productIdInput) {
      console.error('productIdInput is required');
      throw new BadRequestException('productIdInput is required');
    }

    if (!variantId) {
      console.error('variantId is required');
      throw new BadRequestException('variantId is required');
    }

    // Convert productIdInput to ObjectId if it's a string
    let productId;
    try {
      productId = typeof productIdInput === 'string' ? new Types.ObjectId(productIdInput) : productIdInput;
      console.log('Converted productId:', productId);
    } catch (error) {
      console.error('Error converting productId to ObjectId:', error);
      throw new BadRequestException(`Invalid productId format: ${productIdInput}`);
    }

    // Add validation if needed (e.g., check if product and variant exist)
    console.log('Finding product with ID:', productId);
    const product = await this.productModel.findById(productId).exec();
    if (!product) {
        console.error(`Product with ID ${productId.toString()} not found`);
        throw new NotFoundException(`Sản phẩm với ID ${productId.toString()} không tồn tại.`);
    }
    console.log('Product found:', { id: product._id, name: product.name });

    // Check if variant exists in the product - handle both ObjectId and string variantIds
    // First try to find by direct comparison (for string variantIds like 'new-1744355640713')
    console.log('Checking if variant exists in product variants:', { variantId, productVariants: product.variants.map(v => ({ variantId: v.variantId.toString() })) });
    let variantExists = product.variants.some(v => {
      // Handle both string and ObjectId variantIds
      const variantIdStr = v.variantId.toString();
      const match = variantIdStr === variantId || variantIdStr === `new-${variantId}`;
      if (match) {
        console.log('Variant match found:', { variantIdStr, variantId });
      }
      return match;
    });

    // If not found, check if it's a valid ObjectId and try to find by ObjectId comparison
    if (!variantExists) {
      console.error(`Variant with ID ${variantId} not found in product ${productId.toString()}`);
      throw new NotFoundException(`Biến thể với ID ${variantId} không tồn tại trong sản phẩm ${productId.toString()}.`);
    }

    // Ensure userId is passed as string if needed by the underlying service method signature
    const userIdString = typeof userId === 'string' ? userId : userId.toString();
    console.log('Calling usersService.addToWishlist with:', { userIdString, productId: productId.toString(), variantId });

    try {
      // Pass the variantId as is to the service
      const result = await this.usersService.addToWishlist(userIdString, productId, variantId);
      console.log('Wishlist item added successfully');
      return result;
    } catch (error) {
      console.error('Error in WishlistService.addToWishlist:', error);
      throw error;
    }
  }

  // Calls the updated method in UsersService
  async removeFromWishlist(userId: string | Types.ObjectId, productIdInput: string | Types.ObjectId, variantId: string): Promise<UserDocument> {
    const productId = typeof productIdInput === 'string' ? new Types.ObjectId(productIdInput) : productIdInput;
    // Optional: Add validation to check if product/variant exists before attempting removal if desired
    // const product = await this.productModel.findById(productId).exec();
    // if (!product) { // Removed variant check from comment entirely
    //     throw new NotFoundException(`Sản phẩm hoặc biến thể không tồn tại để xóa khỏi wishlist.`);
    // }
    const userIdString = typeof userId === 'string' ? userId : userId.toString();
    // Pass the original variantId string to the service
    return this.usersService.removeFromWishlist(userIdString, productId, variantId);
  }
}
