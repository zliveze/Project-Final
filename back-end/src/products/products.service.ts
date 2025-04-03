import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, SortOrder, Types } from 'mongoose';
import { Product, ProductDocument } from './schemas/product.schema';
import {
  CreateProductDto,
  UpdateProductDto,
  QueryProductDto,
  PaginatedProductsResponseDto,
  ProductResponseDto,
  AdminListProductItemDto,
  AdminListProductResponseDto
} from './dto';
import { CloudinaryService } from '../cloudinary/cloudinary.service';

@Injectable()
export class ProductsService {
  private readonly logger = new Logger(ProductsService.name);

  constructor(
    @InjectModel(Product.name) private productModel: Model<ProductDocument>,
    private readonly cloudinaryService: CloudinaryService
  ) {}

  async create(createProductDto: CreateProductDto): Promise<ProductResponseDto> {
    try {
      // Check if product with the same SKU or slug already exists
      const existingProduct = await this.productModel.findOne({
        $or: [
          { sku: createProductDto.sku },
          { slug: createProductDto.slug }
        ]
      });

      if (existingProduct) {
        throw new BadRequestException(
          existingProduct.sku === createProductDto.sku
            ? 'Sản phẩm với SKU này đã tồn tại'
            : 'Sản phẩm với slug này đã tồn tại'
        );
      }

      // Tạo một bản sao để tránh thay đổi đối tượng gốc
      const productData = { ...createProductDto };

      // Kiểm tra tính hợp lệ của MongoDB ObjectId
      const isValidObjectId = (id: string) => {
        try {
          return Types.ObjectId.isValid(id) && (new Types.ObjectId(id)).toString() === id;
        } catch {
          return false;
        }
      };

      // Chuyển đổi categoryIds từ string[] sang ObjectId[]
      if (productData.categoryIds && productData.categoryIds.length > 0) {
        // Lọc ra các ID hợp lệ
        const validCategoryIds = productData.categoryIds.filter(isValidObjectId);
        if (validCategoryIds.length > 0) {
          const categoryObjectIds = validCategoryIds.map(id => new Types.ObjectId(id));
          productData.categoryIds = categoryObjectIds as any;
        } else {
          // Nếu không có ID hợp lệ, gán mảng rỗng
          productData.categoryIds = [] as any;
        }
      }

      // Chuyển đổi brandId từ string sang ObjectId
      if (productData.brandId && isValidObjectId(productData.brandId)) {
        productData.brandId = new Types.ObjectId(productData.brandId) as any;
      } else if (productData.brandId) {
        delete productData.brandId; // Xóa brandId không hợp lệ
      }

      // Chuyển đổi relatedProducts từ string[] sang ObjectId[]
      if (productData.relatedProducts && productData.relatedProducts.length > 0) {
        const validProductIds = productData.relatedProducts.filter(isValidObjectId);
        if (validProductIds.length > 0) {
          const relatedProductsIds = validProductIds.map(id => new Types.ObjectId(id));
          productData.relatedProducts = relatedProductsIds as any;
        } else {
          productData.relatedProducts = [] as any;
        }
      }

      // Chuyển đổi relatedEvents từ string[] sang ObjectId[]
      if (productData.relatedEvents && productData.relatedEvents.length > 0) {
        const validEventIds = productData.relatedEvents.filter(isValidObjectId);
        if (validEventIds.length > 0) {
          const relatedEventsIds = validEventIds.map(id => new Types.ObjectId(id));
          productData.relatedEvents = relatedEventsIds as any;
        } else {
          productData.relatedEvents = [] as any;
        }
      }

      // Chuyển đổi relatedCampaigns từ string[] sang ObjectId[]
      if (productData.relatedCampaigns && productData.relatedCampaigns.length > 0) {
        const validCampaignIds = productData.relatedCampaigns.filter(isValidObjectId);
        if (validCampaignIds.length > 0) {
          const relatedCampaignsIds = validCampaignIds.map(id => new Types.ObjectId(id));
          productData.relatedCampaigns = relatedCampaignsIds as any;
        } else {
          productData.relatedCampaigns = [] as any;
        }
      }

      // Chuyển đổi branchId trong inventory
      if (productData.inventory && productData.inventory.length > 0) {
        productData.inventory = productData.inventory.map(inv => {
          if (inv.branchId && isValidObjectId(inv.branchId)) {
            return {
              ...inv,
              branchId: new Types.ObjectId(inv.branchId) as any
            };
          }
          return {
            ...inv,
            branchId: undefined
          };
        }).filter(inv => inv.branchId !== undefined);
      }

      // Create new product
      const createdProduct = new this.productModel(productData);
      const savedProduct = await createdProduct.save();

      return this.mapProductToResponseDto(savedProduct);
    } catch (error) {
      this.logger.error(`Error creating product: ${error.message}`, error.stack);
      throw error;
    }
  }

  async findAll(queryDto: QueryProductDto): Promise<PaginatedProductsResponseDto> {
    try {
      const {
        search,
        brandId,
        categoryId,
        status,
        minPrice,
        maxPrice,
        tags,
        skinTypes,
        concerns,
        isBestSeller,
        isNew,
        isOnSale,
        hasGifts,
        sortBy = 'createdAt',
        sortOrder = 'desc',
        page = 1,
        limit = 10
      } = queryDto;

      // Build query with optimized structure
      const query: any = {};

      // Use compound indexes when possible by combining filters
      // For example, if both status and brandId are provided, use the compound index

      // Text search - only add if needed as it's expensive
      if (search) {
        query.$text = { $search: search };
      }

      // Filter by brand - use ObjectId for proper indexing
      if (brandId) {
        try {
          query.brandId = new Types.ObjectId(brandId);
        } catch (e) {
          this.logger.warn(`Invalid brandId format: ${brandId}`);
        }
      }

      // Filter by category - use ObjectId for proper indexing
      if (categoryId) {
        try {
          query.categoryIds = new Types.ObjectId(categoryId);
        } catch (e) {
          this.logger.warn(`Invalid categoryId format: ${categoryId}`);
        }
      }

      // Filter by status
      if (status) {
        query.status = status;
      }

      // Filter by price range
      if (minPrice !== undefined || maxPrice !== undefined) {
        query.price = {};
        if (minPrice !== undefined) {
          query.price.$gte = minPrice;
        }
        if (maxPrice !== undefined) {
          query.price.$lte = maxPrice;
        }
      }

      // Filter by tags - optimize by using $all for exact matches
      if (tags) {
        const tagList = tags.split(',').map(tag => tag.trim());
        query.tags = tagList.length === 1 ? tagList[0] : { $in: tagList };
      }

      // Filter by skin types - optimize by using $all for exact matches
      if (skinTypes) {
        const skinTypeList = skinTypes.split(',').map(type => type.trim());
        query['cosmetic_info.skinType'] = skinTypeList.length === 1 ?
          skinTypeList[0] : { $in: skinTypeList };
      }

      // Filter by skin concerns - optimize by using $all for exact matches
      if (concerns) {
        const concernList = concerns.split(',').map(concern => concern.trim());
        query['cosmetic_info.concerns'] = concernList.length === 1 ?
          concernList[0] : { $in: concernList };
      }

      // Filter by flags
      if (isBestSeller !== undefined) {
        query['flags.isBestSeller'] = typeof isBestSeller === 'string' 
          ? isBestSeller === 'true' 
          : Boolean(isBestSeller);
      }

      if (isNew !== undefined) {
        query['flags.isNew'] = typeof isNew === 'string' 
          ? isNew === 'true' 
          : Boolean(isNew);
      }

      if (isOnSale !== undefined) {
        query['flags.isOnSale'] = typeof isOnSale === 'string' 
          ? isOnSale === 'true' 
          : Boolean(isOnSale);
      }

      if (hasGifts !== undefined) {
        query['flags.hasGifts'] = typeof hasGifts === 'string' 
          ? hasGifts === 'true' 
          : Boolean(hasGifts);
      }

      // Calculate pagination
      const skip = (page - 1) * limit;

      // Prepare sort options
      const sortOptions: { [key: string]: SortOrder } = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };

      // Define projection to return only necessary fields
      const projection = {
        name: 1,
        sku: 1,
        slug: 1,
        price: 1,
        currentPrice: 1,
        status: 1,
        brandId: 1,
        categoryIds: 1,
        tags: 1,
        'flags.isBestSeller': 1,
        'flags.isNew': 1,
        'flags.isOnSale': 1,
        'flags.hasGifts': 1,
        'images': { $slice: 1 }, // Only get the first image for list view
        'inventory.quantity': 1,
        'inventory.branchId': 1,
        createdAt: 1,
        updatedAt: 1
      };

      // Execute query with projection for better performance
      const products = await this.productModel
        .find(query, projection)
        .sort(sortOptions)
        .skip(skip)
        .limit(limit)
        .lean()
        .exec();

      // Use countDocuments for better performance than count()
      const total = await this.productModel.countDocuments(query).exec();
      const totalPages = Math.ceil(total / limit);

      // Map products to response DTOs
      const items = products.map(product => this.mapProductToResponseDto(product));

      return {
        items,
        total,
        page,
        limit,
        pages: totalPages,
        totalPages,
      };
    } catch (error) {
      this.logger.error(`Error finding products: ${error.message}`, error.stack);
      throw error;
    }
  }

  async findOne(id: string): Promise<ProductResponseDto> {
    try {
      // Validate ObjectId format to avoid unnecessary DB queries
      if (!Types.ObjectId.isValid(id)) {
        throw new NotFoundException(`ID sản phẩm không hợp lệ: ${id}`);
      }

      // Use findOne with lean() for better performance
      const product = await this.productModel
        .findOne({ _id: new Types.ObjectId(id) })
        .lean()
        .exec();

      if (!product) {
        throw new NotFoundException(`Không tìm thấy sản phẩm với ID: ${id}`);
      }

      return this.mapProductToResponseDto(product);
    } catch (error) {
      this.logger.error(`Error finding product by ID: ${error.message}`, error.stack);
      throw error;
    }
  }

  async findBySlug(slug: string): Promise<ProductResponseDto> {
    try {
      if (!slug || typeof slug !== 'string') {
        throw new BadRequestException('Slug không hợp lệ');
      }

      // Use findOne with lean() for better performance
      const product = await this.productModel
        .findOne({ slug: slug.trim() })
        .lean()
        .exec();

      if (!product) {
        throw new NotFoundException(`Không tìm thấy sản phẩm với slug: ${slug}`);
      }

      return this.mapProductToResponseDto(product);
    } catch (error) {
      this.logger.error(`Error finding product by slug: ${error.message}`, error.stack);
      throw error;
    }
  }

  async update(id: string, updateProductDto: UpdateProductDto): Promise<ProductResponseDto> {
    try {
      // Check if product exists
      const existingProduct = await this.productModel.findById(id);

      if (!existingProduct) {
        throw new NotFoundException(`Không tìm thấy sản phẩm với ID: ${id}`);
      }

      // Check if slug is being updated and if it's already in use
      if (updateProductDto.slug && updateProductDto.slug !== existingProduct.slug) {
        const slugExists = await this.productModel.findOne({
          slug: updateProductDto.slug,
          _id: { $ne: id }
        });

        if (slugExists) {
          throw new BadRequestException('Slug này đã được sử dụng bởi sản phẩm khác');
        }
      }

      // Check if SKU is being updated and if it's already in use
      if (updateProductDto.sku && updateProductDto.sku !== existingProduct.sku) {
        const skuExists = await this.productModel.findOne({
          sku: updateProductDto.sku,
          _id: { $ne: id }
        });

        if (skuExists) {
          throw new BadRequestException('SKU này đã được sử dụng bởi sản phẩm khác');
        }
      }

      // Update product
      const updatedProduct = await this.productModel
        .findByIdAndUpdate(id, updateProductDto, { new: true })
        .lean()
        .exec();

      return this.mapProductToResponseDto(updatedProduct);
    } catch (error) {
      this.logger.error(`Error updating product: ${error.message}`, error.stack);
      throw error;
    }
  }

  async remove(id: string): Promise<{ success: boolean; message: string }> {
    try {
      const product = await this.productModel.findById(id);

      if (!product) {
        throw new NotFoundException(`Không tìm thấy sản phẩm với ID: ${id}`);
      }

      await this.productModel.findByIdAndDelete(id);

      return {
        success: true,
        message: 'Sản phẩm đã được xóa thành công',
      };
    } catch (error) {
      this.logger.error(`Error removing product: ${error.message}`, error.stack);
      throw error;
    }
  }

  async getStatistics() {
    try {
      // Total products
      const total = await this.productModel.countDocuments();

      // Active products
      const active = await this.productModel.countDocuments({ status: 'active' });

      // Out of stock products
      const outOfStock = await this.productModel.countDocuments({ status: 'out_of_stock' });

      // Discontinued products
      const discontinued = await this.productModel.countDocuments({ status: 'discontinued' });

      // Products with variants
      const withVariants = await this.productModel.countDocuments({
        'variants.0': { $exists: true }
      });

      // Products with gifts
      const withGifts = await this.productModel.countDocuments({
        'gifts.0': { $exists: true }
      });

      // Bestseller products
      const bestSellers = await this.productModel.countDocuments({
        'flags.isBestSeller': true
      });

      // New products
      const newProducts = await this.productModel.countDocuments({
        'flags.isNew': true
      });

      // On sale products
      const onSale = await this.productModel.countDocuments({
        'flags.isOnSale': true
      });

      return {
        total,
        active,
        outOfStock,
        discontinued,
        withVariants,
        withGifts,
        bestSellers,
        newProducts,
        onSale,
      };
    } catch (error) {
      this.logger.error(`Error getting product statistics: ${error.message}`, error.stack);
      throw error;
    }
  }

  async updateInventory(id: string, branchId: string, quantity: number): Promise<ProductResponseDto> {
    try {
      const product = await this.productModel.findById(id);

      if (!product) {
        throw new NotFoundException(`Không tìm thấy sản phẩm với ID: ${id}`);
      }

      // Find the inventory entry for the branch
      const inventoryIndex = product.inventory.findIndex(
        inv => inv.branchId.toString() === branchId
      );

      if (inventoryIndex === -1) {
        // Add new inventory entry if it doesn't exist
        product.inventory.push({
          branchId: new Types.ObjectId(branchId),
          quantity,
          lowStockThreshold: 5
        });
      } else {
        // Update existing inventory entry
        product.inventory[inventoryIndex].quantity = quantity;
      }

      // Update product status based on total inventory
      const totalInventory = product.inventory.reduce(
        (sum, inv) => sum + inv.quantity,
        0
      );

      if (totalInventory === 0 && product.status !== 'discontinued') {
        product.status = 'out_of_stock';
      } else if (totalInventory > 0 && product.status === 'out_of_stock') {
        product.status = 'active';
      }

      const updatedProduct = await product.save();
      return this.mapProductToResponseDto(updatedProduct);
    } catch (error) {
      this.logger.error(`Error updating product inventory: ${error.message}`, error.stack);
      throw error;
    }
  }

  async updateProductFlags(id: string, flags: any): Promise<ProductResponseDto> {
    try {
      const product = await this.productModel.findById(id);

      if (!product) {
        throw new NotFoundException(`Không tìm thấy sản phẩm với ID: ${id}`);
      }

      // Update flags
      product.flags = {
        ...product.flags,
        ...flags
      };

      const updatedProduct = await product.save();
      return this.mapProductToResponseDto(updatedProduct);
    } catch (error) {
      this.logger.error(`Error updating product flags: ${error.message}`, error.stack);
      throw error;
    }
  }

  async addVariant(id: string, variantDto: any): Promise<ProductResponseDto> {
    try {
      const product = await this.productModel.findById(id);

      if (!product) {
        throw new NotFoundException(`Không tìm thấy sản phẩm với ID: ${id}`);
      }

      // Check if variant with the same SKU already exists
      const variantExists = product.variants.some(v => v.sku === variantDto.sku);

      if (variantExists) {
        throw new BadRequestException(`Biến thể với SKU ${variantDto.sku} đã tồn tại`);
      }

      // Add new variant
      product.variants.push(variantDto);

      const updatedProduct = await product.save();
      return this.mapProductToResponseDto(updatedProduct);
    } catch (error) {
      this.logger.error(`Error adding product variant: ${error.message}`, error.stack);
      throw error;
    }
  }

  async updateVariant(id: string, variantId: string, variantDto: any): Promise<ProductResponseDto> {
    try {
      const product = await this.productModel.findById(id);

      if (!product) {
        throw new NotFoundException(`Không tìm thấy sản phẩm với ID: ${id}`);
      }

      // Find the variant
      const variantIndex = product.variants.findIndex(
        v => v.variantId.toString() === variantId
      );

      if (variantIndex === -1) {
        throw new NotFoundException(`Không tìm thấy biến thể với ID: ${variantId}`);
      }

      // Check if SKU is being changed and if it's already in use
      if (
        variantDto.sku &&
        variantDto.sku !== product.variants[variantIndex].sku &&
        product.variants.some(v => v.sku === variantDto.sku)
      ) {
        throw new BadRequestException(`Biến thể với SKU ${variantDto.sku} đã tồn tại`);
      }

      // Update variant
      product.variants[variantIndex] = {
        ...product.variants[variantIndex],
        ...variantDto,
        variantId: product.variants[variantIndex].variantId
      };

      const updatedProduct = await product.save();
      return this.mapProductToResponseDto(updatedProduct);
    } catch (error) {
      this.logger.error(`Error updating product variant: ${error.message}`, error.stack);
      throw error;
    }
  }

  async removeVariant(id: string, variantId: string): Promise<ProductResponseDto> {
    try {
      const product = await this.productModel.findById(id);

      if (!product) {
        throw new NotFoundException(`Không tìm thấy sản phẩm với ID: ${id}`);
      }

      // Find the variant
      const variantIndex = product.variants.findIndex(
        v => v.variantId.toString() === variantId
      );

      if (variantIndex === -1) {
        throw new NotFoundException(`Không tìm thấy biến thể với ID: ${variantId}`);
      }

      // Remove variant
      product.variants.splice(variantIndex, 1);

      const updatedProduct = await product.save();
      return this.mapProductToResponseDto(updatedProduct);
    } catch (error) {
      this.logger.error(`Error removing product variant: ${error.message}`, error.stack);
      throw error;
    }
  }

  async findAllLight(queryDto: QueryProductDto) {
    const {
      page = 1,
      limit = 10,
      search,
      brandId,
      categoryId,
      status,
      minPrice,
      maxPrice,
      tags,
      skinTypes,
      concerns,
      isBestSeller,
      isNew,
      isOnSale,
      hasGifts,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = queryDto;

    // Build filter conditions
    const filter: any = {};

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { sku: { $regex: search, $options: 'i' } },
      ];
    }

    if (brandId) filter.brandId = brandId;

    if (categoryId) filter.categoryIds = categoryId;

    if (status) filter.status = status;

    const priceFilter: any = {};
    if (minPrice !== undefined) priceFilter.$gte = minPrice;
    if (maxPrice !== undefined) priceFilter.$lte = maxPrice;
    if (Object.keys(priceFilter).length > 0) filter.price = priceFilter;

    if (tags) {
      const tagsArray = tags.split(',').map(tag => tag.trim());
      filter.tags = { $in: tagsArray };
    }

    if (skinTypes) {
      const skinTypesArray = skinTypes.split(',').map(type => type.trim());
      filter['cosmetic_info.skinType'] = { $in: skinTypesArray };
    }

    if (concerns) {
      const concernsArray = concerns.split(',').map(concern => concern.trim());
      filter['cosmetic_info.concerns'] = { $in: concernsArray };
    }

    if (isBestSeller !== undefined) filter['flags.isBestSeller'] = isBestSeller;
    if (isNew !== undefined) filter['flags.isNew'] = isNew;
    if (isOnSale !== undefined) filter['flags.isOnSale'] = isOnSale;
    if (hasGifts !== undefined) filter['flags.hasGifts'] = hasGifts;

    // Build sorting
    const sort: any = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Execute query with optimized projection to include only necessary fields
    const products = await this.productModel
      .find(filter)
      .select('_id name slug sku price currentPrice status images brandId flags reviews')
      .populate('brandId', 'name')
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean();

    // Count total products matching the filters
    const total = await this.productModel.countDocuments(filter);

    // Calculate total pages
    const totalPages = Math.ceil(total / limit);

    // Transform products to include only required information
    const lightProducts = products.map(product => {
      // Find primary image or use first available
      let imageUrl = '';
      if (product.images && product.images.length > 0) {
        const primaryImage = product.images.find(img => img.isPrimary);
        imageUrl = primaryImage ? primaryImage.url : product.images[0].url;
      }

      return {
        _id: product._id.toString(),
        name: product.name,
        slug: product.slug,
        sku: product.sku,
        price: product.price,
        currentPrice: product.currentPrice || product.price,
        status: product.status,
        imageUrl,
        brandId: product.brandId ? (product.brandId as any)._id?.toString() : undefined,
        brandName: product.brandId ? (product.brandId as any).name : undefined,
        flags: product.flags,
        reviews: product.reviews,
      };
    });

    return {
      products: lightProducts,
      total,
      page: +page,
      limit: +limit,
      totalPages,
    };
  }

  async findAllForAdmin(queryDto: QueryProductDto): Promise<AdminListProductResponseDto> {
    try {
      const { 
        page = 1, 
        limit = 10, 
        search, 
        brandId, 
        categoryId, 
        status,
        minPrice,
        maxPrice,
        tags,
        skinTypes,
        concerns,
        isBestSeller,
        isNew,
        isOnSale,
        hasGifts,
        sortBy = 'createdAt',
        sortOrder = 'desc',
      } = queryDto;

      // Tính toán skip
      const skip = (page - 1) * limit;

      // Xây dựng query
      const query: any = {};

      // Thêm filter tìm kiếm
      if (search) {
        query.$or = [
          { name: { $regex: search, $options: 'i' } },
          { sku: { $regex: search, $options: 'i' } },
        ];
      }

      // Thêm filter thương hiệu
      if (brandId) {
        query.brandId = brandId;
      }

      // Thêm filter danh mục
      if (categoryId) {
        query.categoryIds = categoryId;
      }

      // Thêm filter trạng thái
      if (status) {
        query.status = status;
      }

      // Thêm filter giá
      if (minPrice !== undefined || maxPrice !== undefined) {
        query.price = {};
        if (minPrice !== undefined) {
          query.price.$gte = minPrice;
        }
        if (maxPrice !== undefined) {
          query.price.$lte = maxPrice;
        }
      }

      // Thêm filter tags
      if (tags) {
        query.tags = { $in: tags.split(',') };
      }

      // Thêm filter loại da
      if (skinTypes) {
        query['cosmetic_info.skinType'] = { $in: skinTypes.split(',') };
      }

      // Thêm filter vấn đề da
      if (concerns) {
        query['cosmetic_info.concerns'] = { $in: concerns.split(',') };
      }

      // Thêm filter flags
      if (isBestSeller !== undefined) {
        query['flags.isBestSeller'] = typeof isBestSeller === 'string' 
          ? isBestSeller === 'true' 
          : Boolean(isBestSeller);
      }
      if (isNew !== undefined) {
        query['flags.isNew'] = typeof isNew === 'string' 
          ? isNew === 'true' 
          : Boolean(isNew);
      }
      if (isOnSale !== undefined) {
        query['flags.isOnSale'] = typeof isOnSale === 'string' 
          ? isOnSale === 'true' 
          : Boolean(isOnSale);
      }
      if (hasGifts !== undefined) {
        query['flags.hasGifts'] = typeof hasGifts === 'string' 
          ? hasGifts === 'true' 
          : Boolean(hasGifts);
      }

      // Đánh chỉ mục hint để sử dụng chỉ mục phù hợp
      const sortOptions: any = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };

      // Tính toán tổng số sản phẩm
      const total = await this.productModel.countDocuments(query);
      const totalPages = Math.ceil(total / limit);

      // Truy vấn sản phẩm với aggregation pipeline
      const products = await this.productModel.aggregate([
        { $match: query },
        {
          $lookup: {
            from: 'brands',
            localField: 'brandId',
            foreignField: '_id',
            as: 'brandInfo'
          }
        },
        {
          $lookup: {
            from: 'categories',
            localField: 'categoryIds',
            foreignField: '_id',
            as: 'categoryInfo'
          }
        },
        {
          $addFields: {
            totalStock: {
              $sum: '$inventory.quantity'
            },
            primaryImage: {
              $ifNull: [
                { $arrayElemAt: [{ $filter: { input: '$images', as: 'img', cond: { $eq: ['$$img.isPrimary', true] } } }, 0] },
                { $arrayElemAt: ['$images', 0] },
                { url: '' }
              ]
            },
          }
        },
        {
          $project: {
            _id: 1,
            name: 1,
            slug: 1,
            sku: 1,
            price: 1,
            currentPrice: 1,
            status: 1,
            brandId: 1,
            categoryIds: 1,
            brandName: { $ifNull: [{ $arrayElemAt: ['$brandInfo.name', 0] }, ''] },
            categoryNames: '$categoryInfo.name',
            image: '$primaryImage.url',
            stock: '$totalStock',
            flags: 1,
            createdAt: 1,
            updatedAt: 1,
          }
        },
        { $sort: sortOptions },
        { $skip: skip },
        { $limit: +limit },
      ]);

      // Format result theo đúng cấu trúc cho giao diện admin
      const formattedProducts: AdminListProductItemDto[] = products.map(product => {
        // Định dạng giá thành chuỗi
        const priceString = new Intl.NumberFormat('vi-VN').format(product.price) + 'đ';
        
        // Lấy tên danh mục đầu tiên hoặc chuỗi rỗng
        const category = product.categoryNames && product.categoryNames.length > 0 
          ? product.categoryNames[0] 
          : '';

        // Chuyển _id thành id để phù hợp với giao diện
        return {
          id: product._id.toString(),
          name: product.name,
          slug: product.slug,
          sku: product.sku,
          price: priceString,
          originalPrice: product.price,
          currentPrice: product.currentPrice || product.price,
          category,
          categoryIds: product.categoryIds?.map(id => id.toString()) || [],
          brand: product.brandName || '',
          brandId: product.brandId?.toString() || '',
          image: product.image || '',
          stock: product.stock || 0,
          status: product.status,
          flags: product.flags || {
            isBestSeller: false,
            isNew: false,
            isOnSale: false,
            hasGifts: false
          },
          createdAt: product.createdAt ? new Date(product.createdAt).toISOString() : '',
          updatedAt: product.updatedAt ? new Date(product.updatedAt).toISOString() : '',
        };
      });

      return {
        items: formattedProducts,
        total,
        page: +page,
        limit: +limit,
        totalPages,
      };
    } catch (error) {
      this.logger.error(`Error in findAllForAdmin: ${error.message}`, error.stack);
      throw error;
    }
  }

  // Helper method to map a product document to a response DTO
  private mapProductToResponseDto(product: any): ProductResponseDto {
    return {
      ...product,
      _id: product._id.toString(),
      brandId: product.brandId ? product.brandId.toString() : undefined,
      categoryIds: product.categoryIds ? product.categoryIds.map(id => id.toString()) : [],
      variants: product.variants ? product.variants.map(variant => ({
        ...variant,
        variantId: variant.variantId.toString()
      })) : [],
      inventory: product.inventory ? product.inventory.map(inv => ({
        ...inv,
        branchId: inv.branchId.toString()
      })) : [],
      relatedProducts: product.relatedProducts ? product.relatedProducts.map(id => id.toString()) : [],
      relatedEvents: product.relatedEvents ? product.relatedEvents.map(id => id.toString()) : [],
      relatedCampaigns: product.relatedCampaigns ? product.relatedCampaigns.map(id => id.toString()) : [],
    };
  }
}
