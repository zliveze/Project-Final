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
    const { productId, variantId, quantity, selectedOptions, price: dtoPrice } = addToCartDto;

    // Only validate userId and productId as MongoDB ObjectIDs
    // variantId can be a custom string format (e.g., "new-1234567890")
    if (!Types.ObjectId.isValid(userId) || !Types.ObjectId.isValid(productId)) {
        console.error(`[CartsService] Invalid IDs provided - User: ${userId}, Product: ${productId}`);
        throw new BadRequestException('ID người dùng hoặc sản phẩm không hợp lệ.');
    }
    const objectIdUserId = new Types.ObjectId(userId);
    const objectIdProductId = new Types.ObjectId(productId);
    // Don't convert variantId to ObjectId if it's a custom format
    // We'll use the string value directly when searching for the variant

    // 1. Validate Product and find the specific Variant within it (if variantId is provided)
    console.log(`[CartsService] Finding product with ID: ${objectIdProductId}`);
    const product = await this.productModel.findById(objectIdProductId);
    if (!product) {
        console.error(`[CartsService] Product NOT FOUND with ID: ${productId}`);
        throw new NotFoundException(`Sản phẩm với ID ${productId} không tồn tại.`);
    }

    // Variable to store the variant or use product price for products without variants
    let variant: ProductVariant | null = null;
    let priceToUse: number = product.currentPrice || product.price;

    // Check if variantId is provided (for products with variants)
    if (variantId) {
        console.log(`[CartsService] Product FOUND. Finding variant with variantId: ${variantId} within product.`);

        // Find the variant within the product's embedded array
        // Handle both MongoDB ObjectId and custom string format (e.g., "new-1234567890")
        const foundVariant = product.variants.find(v => {
            // Convert both to string for comparison
            const variantIdStr = v.variantId?.toString() || '';
            return variantIdStr === variantId;
        });

        // Assign the found variant or null to the variant variable
        variant = foundVariant || null;

        if (!variant) {
            console.error(`[CartsService] addItemToCart: Variant NOT FOUND with variantId: ${variantId} within product ID: ${productId}`);
            throw new NotFoundException(`Biến thể với ID ${variantId} không thuộc sản phẩm ${productId}.`);
        } else {
            console.log(`[CartsService] addItemToCart: Variant FOUND within product:`, variant);

            // Kiểm tra xem biến thể có giá khuyến mãi không
            if (variant.promotionPrice) {
                console.log(`[CartsService] Using variant promotion price: ${variant.promotionPrice}`);
                priceToUse = variant.promotionPrice;
            } else {
                priceToUse = variant.price;
            }

            // Kiểm tra xem có tổ hợp được chọn không
            const combinationId = selectedOptions?.combinationId;
            if (combinationId && variant.combinations) {
                const combination = variant.combinations.find(c => c.combinationId.toString() === combinationId);
                if (combination) {
                    console.log(`[CartsService] Found combination with ID: ${combinationId}`);

                    // Kiểm tra xem tổ hợp có giá khuyến mãi không
                    if (combination.promotionPrice) {
                        console.log(`[CartsService] Using combination promotion price: ${combination.promotionPrice}`);
                        priceToUse = combination.promotionPrice;
                    } else if (combination.price) {
                        priceToUse = combination.price;
                    } else if (combination.additionalPrice) {
                        priceToUse = variant.promotionPrice || variant.price + combination.additionalPrice;
                    }
                }
            }
        }
    } else {
        // Handle products without variants
        console.log(`[CartsService] No variantId provided. Treating as product without variants.`);

        // Check if product has variants but none was selected
        if (product.variants && product.variants.length > 0) {
            console.error(`[CartsService] Product has variants but no variantId was provided.`);
            throw new BadRequestException(`Sản phẩm này có nhiều biến thể. Vui lòng chọn một biến thể.`);
        }
    }

    // 2. Find or create cart
    console.log(`[CartsService] Finding or creating cart for userId: ${objectIdUserId}`);
    const cart = await this.findOrCreateCart(objectIdUserId);
    console.log(`[CartsService] Cart found or created. Cart ID: ${cart._id}`);

    // 3. Check stock BEFORE modifying cart
    console.log(`[CartsService] Checking existing item index for ${variantId ? 'variantId: ' + variantId : 'product without variant'}`);

    // For products with variants, find by variantId and combinationId (if provided)
    // For products without variants, find by productId and check that variantId is empty or not set
    const existingItemIndex = variantId ?
        cart.items.findIndex(item => {
            // First check if variantId matches
            const variantMatches = item.variantId?.toString() === variantId || item.variantId === variantId;

            // If variantId matches and we have selectedOptions with combinationId
            if (variantMatches && selectedOptions && selectedOptions.combinationId) {
                // Check if the item has the same combinationId
                return item.selectedOptions &&
                       item.selectedOptions.combinationId === selectedOptions.combinationId;
            }

            // If no combinationId in selectedOptions, just match by variantId
            // This handles the case for variants without combinations
            return variantMatches &&
                   (!selectedOptions || !selectedOptions.combinationId) &&
                   (!item.selectedOptions || !item.selectedOptions.combinationId);
        }) :
        cart.items.findIndex(item =>
            item.productId.toString() === productId &&
            (!item.variantId || item.variantId === '')
        );

    console.log(`[CartsService] Checking for ${variantId ? `variantId: ${variantId}` : 'product without variant'}, found at index: ${existingItemIndex}`);

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
      cart.items[existingItemIndex].price = priceToUse; // Update price on quantity change too
    } else {
      console.log(`[CartsService] Adding new item.`);
      // Convert variant.options (VariantOptions) to Record<string, string>
      const optionsForCart: Record<string, string> = {};
      if (selectedOptions) {
          console.log(`[CartsService] Using selectedOptions from DTO:`, selectedOptions);
          Object.assign(optionsForCart, selectedOptions);
      } else if (variant && variant.options) {
          console.log(`[CartsService] Using options from found variant:`, variant.options);
          if (variant.options.color) {
              const colorName = variant.options.color.split('"')[0].trim();
              optionsForCart['Color'] = colorName || variant.options.color;
          }
          if (variant.options.sizes && variant.options.sizes.length > 0) optionsForCart['Size'] = variant.options.sizes[0];
          if (variant.options.shades && variant.options.shades.length > 0) optionsForCart['Shade'] = variant.options.shades[0];
      }
      console.log(`[CartsService] Final optionsForCart:`, optionsForCart);

      // Create a new cart item
      const newItem: CartItem = {
        productId: objectIdProductId,
        variantId: variantId || '', // Use empty string for products without variants
        quantity,
        selectedOptions: optionsForCart, // Use the converted/provided options
        price: dtoPrice || priceToUse, // Use price from DTO if provided, otherwise use calculated price
      };

      console.log(`[CartsService] Created new cart item with variantId: ${newItem.variantId} (${typeof newItem.variantId})`, newItem);
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
  async updateCartItem(userId: string, variantId: string | null, updateCartItemDto: UpdateCartItemDto): Promise<CartDocument> {
    console.log(`[CartsService] updateCartItem START - userId: ${userId}, variantId: ${variantId}, DTO:`, updateCartItemDto);
    const { quantity, selectedOptions, price: dtoPrice } = updateCartItemDto;

    if (!Types.ObjectId.isValid(userId)) {
        throw new BadRequestException('ID người dùng không hợp lệ.');
    }
     if (quantity <= 0) {
        console.log(`[CartsService] Quantity <= 0, removing item instead.`);
        return this.removeItemFromCart(userId, variantId);
    }

    const objectIdUserId = new Types.ObjectId(userId);
    // Don't convert variantId to ObjectId - use the string value directly

    // 1. Find cart
    console.log(`[CartsService] Finding cart for userId: ${objectIdUserId}`);
    const cart = await this.cartModel.findOne({ userId: objectIdUserId });
    if (!cart) {
      throw new NotFoundException('Không tìm thấy giỏ hàng.');
    }
    console.log(`[CartsService] Cart found. Cart ID: ${cart._id}`);

    // 2. Find item index
    console.log(`[CartsService] Finding item index for ${variantId ? 'variantId: ' + variantId : 'product without variant'}`);

    // For products with variants, find by variantId and combinationId (if provided in selectedOptions)
    // For products without variants, find by empty variantId or null
    let itemIndex = -1;
    let actualVariantIdFromParam = variantId;
    let combinationIdFromParam: string | null = null;

    if (variantId && variantId.includes(':')) {
      [actualVariantIdFromParam, combinationIdFromParam] = variantId.split(':');
    }

    if (variantId) { // Handles products with variants (with or without combinations)
      itemIndex = cart.items.findIndex(item => {
        const variantMatches = item.variantId === actualVariantIdFromParam;

        if (variantMatches) {
          // If a combinationId was passed in the param, we MUST match it
          if (combinationIdFromParam) {
            return item.selectedOptions && item.selectedOptions.combinationId === combinationIdFromParam;
          }
          // If no combinationId was passed in param, ensure the cart item ALSO doesn't have one,
          // OR if selectedOptions from DTO has a combinationId, match that.
          // This logic might need refinement based on how combination-less variants are handled.
          if (selectedOptions && selectedOptions.combinationId) {
             return item.selectedOptions && item.selectedOptions.combinationId === selectedOptions.combinationId;
          }
          // If no combinationId in DTO, then this item should also not have a combinationId
          return !item.selectedOptions || !item.selectedOptions.combinationId;
        }
        return false;
      });
    } else { // Handles products without variants (variantId is null)
      itemIndex = cart.items.findIndex(item => !item.variantId || item.variantId === '');
    }


    if (itemIndex === -1) {
      // Construct a more informative error message
      let errorMessage = "Không tìm thấy sản phẩm trong giỏ hàng.";
      if (actualVariantIdFromParam && actualVariantIdFromParam !== 'none') {
        errorMessage = `Không tìm thấy sản phẩm với biến thể ID ${actualVariantIdFromParam}`;
        if (combinationIdFromParam) {
          errorMessage += ` và tổ hợp ID ${combinationIdFromParam}`;
        }
        errorMessage += " trong giỏ hàng.";
      } else if (variantId === 'none' || !variantId) {
         errorMessage = "Không tìm thấy sản phẩm không có biến thể trong giỏ hàng.";
      }
      throw new NotFoundException(errorMessage);
    }
    console.log(`[CartsService] Item found at index: ${itemIndex} for variantId: ${variantId} (actual: ${actualVariantIdFromParam}, combo: ${combinationIdFromParam})`);

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

    // Variable to store the variant or use product price for products without variants
    let variant: ProductVariant | null = null;
    let priceToUse: number = productContainingVariant.currentPrice || productContainingVariant.price;

    // Check if variantId is provided (for products with variants)
    // Use actualVariantIdFromParam (which is the true variantId) to find the variant in the product
    if (actualVariantIdFromParam && actualVariantIdFromParam !== 'none') {
      const foundVariant = productContainingVariant.variants.find(v => {
          // Ensure v.variantId is converted to string for comparison
          const variantIdInProductString = v.variantId ? String(v.variantId) : '';
          return variantIdInProductString === actualVariantIdFromParam;
      });

      variant = foundVariant || null;

      if (!variant) {
          // Log the correct ID that was not found
          console.error(`[CartsService] Variant NOT FOUND within product. Actual VariantId: ${actualVariantIdFromParam}`);
          cart.items.splice(itemIndex, 1);
          await cart.save();
          // Display the composite ID in the error message if it was provided
          const displayId = (variantId && variantId.includes(':')) ? variantId : actualVariantIdFromParam;
          throw new NotFoundException(`Biến thể với ID ${displayId} không còn tồn tại trong sản phẩm. Mục đã bị xóa.`);
      }

      // Kiểm tra xem biến thể có giá khuyến mãi không
      if (variant.promotionPrice) {
          console.log(`[CartsService] Using variant promotion price: ${variant.promotionPrice}`);
          priceToUse = variant.promotionPrice;
      } else {
          priceToUse = variant.price;
      }

      // If a combination was involved, the price might need to be adjusted based on the combination
      if (combinationIdFromParam && variant.combinations) {
        const combination = variant.combinations.find(c => c.combinationId.toString() === combinationIdFromParam);
        if (combination) {
          // Kiểm tra xem tổ hợp có giá khuyến mãi không
          if (combination.promotionPrice) {
              console.log(`[CartsService] Using combination promotion price: ${combination.promotionPrice}`);
              priceToUse = combination.promotionPrice;
          } else if (typeof combination.price === 'number') {
            priceToUse = combination.price;
          } else if (typeof combination.additionalPrice === 'number') {
            priceToUse = variant.promotionPrice || variant.price + combination.additionalPrice;
          } else {
            priceToUse = variant.promotionPrice || variant.price; // Fallback to variant price
          }
        } else {
          // Combination not found, this is an issue.
          console.error(`[CartsService] Combination NOT FOUND within variant. CombinationId: ${combinationIdFromParam}`);
          // Decide how to handle: error out, or use variant price? For now, error out.
          cart.items.splice(itemIndex, 1);
          await cart.save();
          throw new NotFoundException(`Tổ hợp với ID ${combinationIdFromParam} không thuộc biến thể ${actualVariantIdFromParam}. Mục đã bị xóa.`);
        }
      }
    } else { // This 'else' corresponds to (actualVariantIdFromParam is null or 'none')
      // For products without variants, check if the product has variants
      if (productContainingVariant.variants && productContainingVariant.variants.length > 0) {
        console.error(`[CartsService] Product has variants but no variantId was provided.`);
        cart.items.splice(itemIndex, 1);
        await cart.save();
        throw new BadRequestException(`Sản phẩm này có nhiều biến thể nhưng không có biến thể nào được chọn. Mục đã bị xóa.`);
      }
    }
    console.log(`[CartsService] Variant found within product:`, variant);

    // TODO: Implement proper stock checking based on product.inventory
    console.log(`[CartsService] Skipping stock check (TODO).`);
    // Remove incorrect stock check:
    // if (variant.stock < quantity) {
    //   throw new BadRequestException(`Không đủ hàng tồn kho cho biến thể ${variant.options?.color || variantId}. Chỉ còn ${variant.stock}.`);
    // }

    // 4. Update quantity and selectedOptions
    console.log(`[CartsService] Updating quantity for item at index ${itemIndex} to ${quantity}`);
    cart.items[itemIndex].quantity = quantity;
    // Optionally update price if needed (use price from DTO if provided, otherwise use calculated price)
    cart.items[itemIndex].price = dtoPrice || priceToUse;

    // Update selectedOptions if provided
    if (selectedOptions) {
      console.log(`[CartsService] Updating selectedOptions:`, selectedOptions);
      // Merge existing options with new options
      cart.items[itemIndex].selectedOptions = {
        ...cart.items[itemIndex].selectedOptions,
        ...selectedOptions
      };
    }

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
  async removeItemFromCart(userId: string, variantId: string | null): Promise<CartDocument> {
     console.log(`[CartsService] removeItemFromCart START - userId: ${userId}, variantId: ${variantId}`);
     if (!Types.ObjectId.isValid(userId)) {
        throw new BadRequestException('ID người dùng không hợp lệ.');
    }
    const objectIdUserId = new Types.ObjectId(userId);
    // Don't convert variantId to ObjectId - use the string value directly

    console.log(`[CartsService] Finding cart for userId: ${objectIdUserId}`);
    const cart = await this.cartModel.findOne({ userId: objectIdUserId });
    if (!cart) {
      throw new NotFoundException('Không tìm thấy giỏ hàng.');
    }
    console.log(`[CartsService] Cart found. Cart ID: ${cart._id}`);

    const initialLength = cart.items.length;
    console.log(`[CartsService] Filtering items to remove variantId: ${variantId}`);

    // Handle both products with and without variants
    if (variantId) {
      // For products with variants, filter by variantId
      // If the variantId contains a combinationId separator (e.g., "variantId:combinationId"),
      // then we need to extract both parts and filter accordingly
      if (variantId.includes(':')) {
        const [actualVariantId, combinationId] = variantId.split(':');
        cart.items = cart.items.filter(
          (item) => {
            // If this item doesn't match the variantId, keep it
            if (item.variantId !== actualVariantId) return true;

            // If this item matches the variantId but doesn't have the combinationId, keep it
            if (!item.selectedOptions || !item.selectedOptions.combinationId) return true;

            // If this item matches both variantId and combinationId, remove it
            return item.selectedOptions.combinationId !== combinationId;
          }
        );
      } else {
        // For regular variantIds without combinationId, filter by variantId only
        cart.items = cart.items.filter(
          (item) => item.variantId !== variantId
        );
      }
    } else {
      // For products without variants, filter by empty variantId or null
      cart.items = cart.items.filter(
        (item) => item.variantId && item.variantId !== ''
      );
    }

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
