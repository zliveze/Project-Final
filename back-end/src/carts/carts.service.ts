// back-end/src/carts/carts.service.ts
import { Injectable, NotFoundException, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Cart, CartDocument, CartItem } from './schemas/cart.schema';
import { AddToCartDto } from './dto/add-to-cart.dto';
import { UpdateCartItemDto } from './dto/update-cart-item.dto';
import { Product, ProductDocument, ProductVariant, VariantOptions } from '../products/schemas/product.schema'; // Import ProductVariant and VariantOptions
// Remove unused Variant import if not needed elsewhere
// import { Variant, VariantDocument } from '../products/schemas/variant.schema'; 
import { User, UserDocument } from '../users/schemas/user.schema'; // Assuming User schema exists

@Injectable()
export class CartsService {
  constructor(
    @InjectModel(Cart.name) private cartModel: Model<CartDocument>,
    @InjectModel(Product.name) private productModel: Model<ProductDocument>,
    // Remove VariantModel injection if variants are embedded
    // @InjectModel(Variant.name) private variantModel: Model<VariantDocument>,
  ) {}

  // Helper function to calculate total amount
  private calculateTotalAmount(items: CartItem[]): number {
    // Ensure price and quantity are numbers before calculation
    return items.reduce((sum, item) => {
        const price = typeof item.price === 'number' ? item.price : 0;
        const quantity = typeof item.quantity === 'number' ? item.quantity : 0;
        return sum + price * quantity;
    }, 0);
  }


  // Helper function to find or create a cart for a user
  private async findOrCreateCart(userId: string | Types.ObjectId): Promise<CartDocument> {
    // Adjust populate for variantId if it's embedded (it won't populate from a separate collection)
    const cart = await this.cartModel.findOne({ userId }).populate({
        path: 'items.productId',
        model: 'Product', 
        select: 'name slug images variants inventory brandId', // Add brandId
        populate: { // Populate brand details from Product
            path: 'brandId',
            model: 'Brand',
            select: 'name slug' 
        }
      });
      // Remove populate for variantId as it's embedded
      // .populate({
      //   path: 'items.variantId',
      //   model: 'Variant', 
      //   select: 'options price stock sku', 
      // });

    if (cart) {
      console.log(`[CartsService] Found existing cart for userId: ${userId}`);
      cart.totalAmount = this.calculateTotalAmount(cart.items);
      return cart;
    }
    console.log(`[CartsService] No cart found, creating new cart for userId: ${userId}`);
    const newCart = new this.cartModel({ userId, items: [], totalAmount: 0 });
    return newCart.save();
  }

  // Get user's cart
  async getCart(userId: string): Promise<CartDocument> {
     try {
        if (!Types.ObjectId.isValid(userId)) {
            throw new BadRequestException('User ID không hợp lệ.');
        }
        const objectIdUserId = new Types.ObjectId(userId);
        console.log(`[CartsService] getCart called for userId: ${userId}`);
        const cart = await this.findOrCreateCart(objectIdUserId);
        console.log(`[CartsService] getCart returning cart for userId: ${userId}`);
        return cart;
     } catch (error) {
        if (error instanceof BadRequestException || error instanceof NotFoundException) {
            throw error;
        }
        console.error("[CartsService] Error getting cart:", error);
        throw new InternalServerErrorException('Không thể lấy giỏ hàng.');
     }
  }


  // Add item to cart
  async addItemToCart(userId: string, addToCartDto: AddToCartDto): Promise<CartDocument> {
    console.log(`[CartsService] addItemToCart START - userId: ${userId}, DTO:`, addToCartDto);
    const { productId, variantId, quantity, selectedOptions } = addToCartDto;

    if (!Types.ObjectId.isValid(userId) || !Types.ObjectId.isValid(productId) || !Types.ObjectId.isValid(variantId)) {
        console.error(`[CartsService] Invalid IDs provided - User: ${userId}, Product: ${productId}, Variant: ${variantId}`);
        throw new BadRequestException('ID người dùng, sản phẩm hoặc biến thể không hợp lệ.');
    }
    const objectIdUserId = new Types.ObjectId(userId);
    const objectIdProductId = new Types.ObjectId(productId);
    const objectIdVariantId = new Types.ObjectId(variantId);

    // 1. Validate Product and find the specific Variant within it
    console.log(`[CartsService] Finding product with ID: ${objectIdProductId}`);
    const product = await this.productModel.findById(objectIdProductId);
    if (!product) {
        console.error(`[CartsService] Product NOT FOUND with ID: ${productId}`);
        throw new NotFoundException(`Sản phẩm với ID ${productId} không tồn tại.`);
    }
    console.log(`[CartsService] Product FOUND. Finding variant with variantId: ${variantId} within product.`);

    // Find the variant within the product's embedded array
    const variant = product.variants.find(v => v.variantId?.toString() === variantId);

    if (!variant) {
        console.error(`[CartsService] addItemToCart: Variant NOT FOUND with variantId: ${variantId} within product ID: ${productId}`);
        throw new NotFoundException(`Biến thể với ID ${variantId} không thuộc sản phẩm ${productId}.`);
    } else {
         console.log(`[CartsService] addItemToCart: Variant FOUND within product:`, variant);
    }
     // Note: 'variant' here is the embedded object of type ProductVariant.

    // 2. Find or create cart
    console.log(`[CartsService] Finding or creating cart for userId: ${objectIdUserId}`);
    const cart = await this.findOrCreateCart(objectIdUserId);
    console.log(`[CartsService] Cart found or created. Cart ID: ${cart._id}`);

    // 3. Check stock BEFORE modifying cart
     console.log(`[CartsService] Checking existing item index for variantId: ${objectIdVariantId}`);
     const existingItemIndex = cart.items.findIndex(
      (item) => item.variantId?.toString() === objectIdVariantId.toString()
    );
    console.log(`[CartsService] Existing item index: ${existingItemIndex}`);

    let quantityInCart = 0;
    if(existingItemIndex > -1) {
        quantityInCart = cart.items[existingItemIndex].quantity;
    }
    const requestedTotalQuantity = quantityInCart + quantity;
    console.log(`[CartsService] Quantity in cart: ${quantityInCart}, Requested quantity: ${quantity}, Total requested: ${requestedTotalQuantity}`);

    // TODO: Implement proper stock checking based on product.inventory and potentially branchId.
    console.log(`[CartsService] Skipping stock check (TODO).`);
    // Example placeholder check (replace with actual logic):
    // const totalStock = product.inventory.reduce((sum, inv) => sum + inv.quantity, 0);
    // if (totalStock < requestedTotalQuantity) {
    //    throw new BadRequestException(`Không đủ hàng tồn kho cho sản phẩm ${product.name}. Chỉ còn ${totalStock}. Bạn yêu cầu ${requestedTotalQuantity}.`);
    // }


    // 4. Add or Update item
    console.log(`[CartsService] Preparing to add/update item.`);
    if (existingItemIndex > -1) {
      console.log(`[CartsService] Updating quantity for existing item at index ${existingItemIndex} to ${requestedTotalQuantity}`);
      cart.items[existingItemIndex].quantity = requestedTotalQuantity;
      cart.items[existingItemIndex].price = variant.price; // Update price on quantity change too
    } else {
      console.log(`[CartsService] Adding new item.`);
      // Convert variant.options (VariantOptions) to Record<string, string>
      const optionsForCart: Record<string, string> = {};
      if (selectedOptions) { 
          console.log(`[CartsService] Using selectedOptions from DTO:`, selectedOptions);
          Object.assign(optionsForCart, selectedOptions);
      } else if (variant.options) { 
          console.log(`[CartsService] Using options from found variant:`, variant.options);
          if (variant.options.color) {
              const colorName = variant.options.color.split('"')[0].trim();
              optionsForCart['Color'] = colorName || variant.options.color; 
          }
          if (variant.options.sizes && variant.options.sizes.length > 0) optionsForCart['Size'] = variant.options.sizes[0]; 
          if (variant.options.shades && variant.options.shades.length > 0) optionsForCart['Shade'] = variant.options.shades[0]; 
      }
      console.log(`[CartsService] Final optionsForCart:`, optionsForCart);

      const newItem: CartItem = {
        productId: objectIdProductId, // Remove 'as any'
        variantId: objectIdVariantId,
        quantity,
        selectedOptions: optionsForCart, // Use the converted/provided options
        price: variant.price, // Use price from embedded variant
      };
      console.log(`[CartsService] New item created:`, newItem);
      cart.items.push(newItem);
    }

    // 5. Recalculate total amount
    console.log(`[CartsService] Recalculating total amount.`);
    cart.totalAmount = this.calculateTotalAmount(cart.items);
    console.log(`[CartsService] New total amount: ${cart.totalAmount}`);

    // 6. Save and return cart
    try {
        console.log(`[CartsService] Attempting to save cart... Cart ID: ${cart._id}`);
        await cart.save();
        console.log(`[CartsService] Cart saved successfully. Repopulating... Cart ID: ${cart._id}`);
        // Re-populate after saving to get the latest data structure
        const populatedCart = await this.cartModel.findById(cart._id).populate({
            path: 'items.productId',
            model: 'Product',
            select: 'name slug images variants inventory brandId', // Add brandId
            populate: { // Populate brand details from Product
                path: 'brandId',
                model: 'Brand',
                select: 'name slug'
            }
        });
        // No need to populate variantId separately if embedded
        if (!populatedCart) {
            console.error(`[CartsService] Failed to repopulate cart after saving. Cart ID: ${cart._id}`);
            throw new InternalServerErrorException('Không thể lấy thông tin giỏ hàng sau khi cập nhật.');
        }
        console.log(`[CartsService] addItemToCart END - Returning populated cart.`);
        return populatedCart;
    } catch (error) {
        console.error("[CartsService] Error during cart.save() or repopulation:", error); // Log the specific error
        // Rethrow a more specific error if possible, otherwise keep InternalServerError
        if (error.name === 'ValidationError') {
             throw new BadRequestException(`Lỗi validation khi lưu giỏ hàng: ${error.message}`);
        }
        throw new InternalServerErrorException('Không thể thêm sản phẩm vào giỏ hàng do lỗi lưu trữ.');
    }
  }

  // Update item quantity in cart
  async updateCartItem(userId: string, variantId: string, updateCartItemDto: UpdateCartItemDto): Promise<CartDocument> {
    console.log(`[CartsService] updateCartItem START - userId: ${userId}, variantId: ${variantId}, DTO:`, updateCartItemDto);
    const { quantity } = updateCartItemDto;

    if (!Types.ObjectId.isValid(userId) || !Types.ObjectId.isValid(variantId)) {
        throw new BadRequestException('ID người dùng hoặc biến thể không hợp lệ.');
    }
     if (quantity <= 0) {
        console.log(`[CartsService] Quantity <= 0, removing item instead.`);
        return this.removeItemFromCart(userId, variantId);
    }

    const objectIdUserId = new Types.ObjectId(userId);
    const objectIdVariantId = new Types.ObjectId(variantId);

    // 1. Find cart
    console.log(`[CartsService] Finding cart for userId: ${objectIdUserId}`);
    const cart = await this.cartModel.findOne({ userId: objectIdUserId });
    if (!cart) {
      throw new NotFoundException('Không tìm thấy giỏ hàng.');
    }
    console.log(`[CartsService] Cart found. Cart ID: ${cart._id}`);

    // 2. Find item index
    console.log(`[CartsService] Finding item index for variantId: ${objectIdVariantId}`);
    const itemIndex = cart.items.findIndex(
      (item) => item.variantId?.toString() === objectIdVariantId.toString()
    );

    if (itemIndex === -1) {
      throw new NotFoundException(`Không tìm thấy sản phẩm với biến thể ID ${variantId} trong giỏ hàng.`);
    }
    console.log(`[CartsService] Item found at index: ${itemIndex}`);

    // 3. Validate Variant and Stock (within updateCartItem)
    console.log(`[CartsService] Finding product containing variant. ProductId from cart item: ${cart.items[itemIndex].productId}`);
    const productContainingVariant = await this.productModel.findOne({ _id: cart.items[itemIndex].productId });
    if (!productContainingVariant) {
        console.error(`[CartsService] Product NOT FOUND for item in cart. ProductId: ${cart.items[itemIndex].productId}`);
        cart.items.splice(itemIndex, 1); 
        await cart.save();
        throw new NotFoundException(`Sản phẩm gốc của mục trong giỏ hàng không tồn tại. Mục đã bị xóa.`);
    }
    console.log(`[CartsService] Product containing variant found. Finding variant within product...`);

    const variant = productContainingVariant.variants.find(v => v.variantId?.toString() === variantId);
    if (!variant) {
        console.error(`[CartsService] Variant NOT FOUND within product. VariantId: ${variantId}`);
        cart.items.splice(itemIndex, 1); 
        await cart.save();
        throw new NotFoundException(`Biến thể với ID ${variantId} không còn tồn tại trong sản phẩm. Mục đã bị xóa.`);
    }
    console.log(`[CartsService] Variant found within product:`, variant);

    // TODO: Implement proper stock checking based on product.inventory
    console.log(`[CartsService] Skipping stock check (TODO).`);
    // Remove incorrect stock check:
    // if (variant.stock < quantity) {
    //   throw new BadRequestException(`Không đủ hàng tồn kho cho biến thể ${variant.options?.color || variantId}. Chỉ còn ${variant.stock}.`);
    // }

    // 4. Update quantity
    console.log(`[CartsService] Updating quantity for item at index ${itemIndex} to ${quantity}`);
    cart.items[itemIndex].quantity = quantity;
    // Optionally update price if needed (use price from embedded variant)
    cart.items[itemIndex].price = variant.price; 
    console.log(`[CartsService] Item updated:`, cart.items[itemIndex]);

    // 5. Recalculate total amount
    console.log(`[CartsService] Recalculating total amount.`);
    cart.totalAmount = this.calculateTotalAmount(cart.items);
    console.log(`[CartsService] New total amount: ${cart.totalAmount}`);

    // 6. Save and return cart
    try {
        console.log(`[CartsService] Saving updated cart... Cart ID: ${cart._id}`);
        await cart.save();
        console.log(`[CartsService] Cart saved successfully. Repopulating... Cart ID: ${cart._id}`);
        // Re-populate after saving
        const populatedCart = await this.cartModel.findById(cart._id).populate({
            path: 'items.productId',
            model: 'Product',
            select: 'name slug images variants inventory brandId', // Add brandId
             populate: { // Populate brand details from Product
                path: 'brandId',
                model: 'Brand',
                select: 'name slug'
            }
        });
         if (!populatedCart) {
            console.error(`[CartsService] Failed to repopulate cart after updating. Cart ID: ${cart._id}`);
            throw new InternalServerErrorException('Không thể lấy thông tin giỏ hàng sau khi cập nhật.');
        }
        console.log(`[CartsService] updateCartItem END - Returning populated cart.`);
        return populatedCart;
    } catch (error) {
        console.error("[CartsService] Error saving updated cart:", error);
        // Rethrow a more specific error if possible
        if (error.name === 'ValidationError') {
             throw new BadRequestException(`Lỗi validation khi lưu giỏ hàng: ${error.message}`);
        }
        throw new InternalServerErrorException('Không thể cập nhật sản phẩm trong giỏ hàng.');
    }
  }

  // Remove item from cart
  async removeItemFromCart(userId: string, variantId: string): Promise<CartDocument> {
     console.log(`[CartsService] removeItemFromCart START - userId: ${userId}, variantId: ${variantId}`);
     if (!Types.ObjectId.isValid(userId) || !Types.ObjectId.isValid(variantId)) {
        throw new BadRequestException('ID người dùng hoặc biến thể không hợp lệ.');
    }
    const objectIdUserId = new Types.ObjectId(userId);
    const objectIdVariantId = new Types.ObjectId(variantId);

    console.log(`[CartsService] Finding cart for userId: ${objectIdUserId}`);
    const cart = await this.cartModel.findOne({ userId: objectIdUserId });
    if (!cart) {
      throw new NotFoundException('Không tìm thấy giỏ hàng.');
    }
    console.log(`[CartsService] Cart found. Cart ID: ${cart._id}`);

    const initialLength = cart.items.length;
    console.log(`[CartsService] Filtering items to remove variantId: ${objectIdVariantId}`);
    cart.items = cart.items.filter(
      (item) => item.variantId?.toString() !== objectIdVariantId.toString()
    );

    if (cart.items.length === initialLength) {
       console.log(`[CartsService] Item with variantId ${variantId} not found in cart. Returning cart as is.`);
       return cart; // Item not found, return cart as is
    }
    console.log(`[CartsService] Item removed. New item count: ${cart.items.length}`);

    console.log(`[CartsService] Recalculating total amount.`);
    cart.totalAmount = this.calculateTotalAmount(cart.items);
    console.log(`[CartsService] New total amount: ${cart.totalAmount}`);

    try {
        console.log(`[CartsService] Saving cart after removal...`);
        await cart.save();
        console.log(`[CartsService] Cart saved successfully. Repopulating...`);
        // Re-populate after saving
        const populatedCart = await this.cartModel.findById(cart._id).populate({
            path: 'items.productId',
            model: 'Product',
            select: 'name slug images variants inventory brandId', // Add brandId
             populate: { // Populate brand details from Product
                path: 'brandId',
                model: 'Brand',
                select: 'name slug'
            }
        });
         if (!populatedCart) {
            console.error(`[CartsService] Failed to repopulate cart after removing item. Cart ID: ${cart._id}`);
            throw new InternalServerErrorException('Không thể lấy thông tin giỏ hàng sau khi xóa sản phẩm.');
        }
        console.log(`[CartsService] removeItemFromCart END - Returning populated cart.`);
        return populatedCart;
    } catch (error) {
        console.error("[CartsService] Error saving cart after removal:", error);
        // Rethrow a more specific error if possible
        if (error.name === 'ValidationError') {
             throw new BadRequestException(`Lỗi validation khi lưu giỏ hàng: ${error.message}`);
        }
        throw new InternalServerErrorException('Không thể xóa sản phẩm khỏi giỏ hàng.');
    }
  }

  // Clear the entire cart
  async clearCart(userId: string): Promise<CartDocument> {
     console.log(`[CartsService] clearCart START - userId: ${userId}`);
     if (!Types.ObjectId.isValid(userId)) {
        throw new BadRequestException('User ID không hợp lệ.');
    }
    const objectIdUserId = new Types.ObjectId(userId);
    // Use findOneAndUpdate for atomicity
    console.log(`[CartsService] Clearing cart for userId: ${objectIdUserId}`);
    const updatedCart = await this.cartModel.findOneAndUpdate(
        { userId: objectIdUserId },
        { $set: { items: [], totalAmount: 0 } },
        { new: true, upsert: true } // upsert: create if not found
    );

     if (!updatedCart) {
         // This should not happen with upsert: true, but handle defensively
         console.error("[CartsService] Error clearing cart, findOneAndUpdate returned null");
         throw new InternalServerErrorException('Không thể xóa giỏ hàng.');
     }
     console.log(`[CartsService] clearCart END - Cart cleared successfully.`);
    return updatedCart; // Already contains the updated state
  }
}
