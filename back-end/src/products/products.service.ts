import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, SortOrder, Types, PipelineStage } from 'mongoose';
import { Product, ProductDocument } from './schemas/product.schema';
import { Brand, BrandDocument } from '../brands/schemas/brand.schema'; // Import Brand schema
import { Category, CategoryDocument } from '../categories/schemas/category.schema'; // Import Category schema
import { Branch, BranchDocument } from '../branches/schemas/branch.schema'; // Import Branch schema
import { Order, OrderDocument, PaymentStatus } from '../orders/schemas/order.schema'; // Import Order schema
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
import { EventsService } from '../events/events.service'; // Import EventsService
import { CampaignsService } from '../campaigns/campaigns.service'; // Import CampaignsService
import { TasksService } from '../tasks/tasks.service'; // Import TasksService
import { Event } from '../events/entities/event.entity'; // Import Event entity
import { Campaign } from '../campaigns/schemas/campaign.schema'; // Import Campaign entity
import * as XLSX from 'xlsx';
import { ProductPromotionCheckDto } from './dto/product-promotion-check.dto';

@Injectable()
export class ProductsService {
  private readonly logger = new Logger(ProductsService.name);
  private hasTextIndex = false;

  constructor(
    @InjectModel(Product.name) private productModel: Model<ProductDocument>,
    @InjectModel(Brand.name) private brandModel: Model<BrandDocument>, // Inject BrandModel
    @InjectModel(Category.name) private categoryModel: Model<CategoryDocument>, // Inject CategoryModel
    @InjectModel(Branch.name) private branchModel: Model<BranchDocument>, // Inject BranchModel
    @InjectModel(Order.name) private orderModel: Model<OrderDocument>, // Inject OrderModel
    private readonly cloudinaryService: CloudinaryService,
    private readonly eventsService: EventsService,
    private readonly campaignsService: CampaignsService,
    private readonly tasksService: TasksService
  ) {
    // Kiểm tra xem collection có text index hay không
    this.checkTextIndex();
  }

  // Phương thức để kiểm tra text index
  private async checkTextIndex() {
    try {
      const indexes = await this.productModel.collection.indexes();

      // Log tất cả các indexes để debug
      this.logger.log(`Danh sách indexes của collection products: ${JSON.stringify(indexes.map(idx => idx.name))}`);

      // Kiểm tra xem có text index không
      this.hasTextIndex = indexes.some(index => {
        // Kiểm tra theo tên index hoặc theo textIndexVersion
        const isTextIndex =
          (index.name && index.name.includes('text')) ||
          index.textIndexVersion !== undefined;

        if (isTextIndex) {
          this.logger.log(`Tìm thấy text index: ${index.name}`);
        }

        return isTextIndex;
      });

      this.logger.log(`Text index for products ${this.hasTextIndex ? 'found' : 'not found'}`);

      // Nếu không tìm thấy text index, tạo text index mới
      if (!this.hasTextIndex) {
        this.logger.log('Không tìm thấy text index, đang tạo text index mới...');
        try {
          // Tạo text index mới
          await this.productModel.collection.createIndex(
            {
              name: 'text',
              'description.short': 'text',
              'description.full': 'text',
              'tags': 'text',
              'cosmetic_info.ingredients': 'text',
              sku: 'text',
              slug: 'text'
            },
            {
              weights: {
                name: 10,
                sku: 8,
                slug: 8,
                'description.short': 5,
                'description.full': 3,
                'tags': 2,
                'cosmetic_info.ingredients': 1
              },
              name: 'products_text_search_index'
            }
          );
          this.logger.log('Đã tạo text index mới thành công');
          this.hasTextIndex = true;
        } catch (indexError) {
          this.logger.error(`Lỗi khi tạo text index: ${indexError.message}`, indexError.stack);
        }
      }
    } catch (error) {
      this.logger.error('Error checking text index', error.stack);
      this.hasTextIndex = false; // Mặc định false nếu có lỗi
    }
  }

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

      // Kiểm tra và lọc bỏ các URL base64 trong images
      if (productData.images && Array.isArray(productData.images)) {
        this.logger.log(`Kiểm tra ${productData.images.length} hình ảnh để loại bỏ dữ liệu base64 trong quá trình tạo sản phẩm`);

        // Lọc bỏ các hình ảnh có URL dạng base64
        const filteredImages = productData.images.filter(img => {
          if (!img || !img.url) return true; // Giữ lại nếu không có URL

          const isBase64 = img.url.startsWith('data:image');
          if (isBase64) {
            this.logger.warn(`Phát hiện và loại bỏ URL base64 trong hình ảnh khi tạo sản phẩm`);
          }
          return !isBase64;
        });

        if (filteredImages.length !== productData.images.length) {
          this.logger.log(`Đã loại bỏ ${productData.images.length - filteredImages.length} hình ảnh có URL base64`);
        }

        productData.images = filteredImages;
      }

      // Kiểm tra và lọc bỏ các URL base64 trong variants
      if (productData.variants && Array.isArray(productData.variants)) {
        productData.variants = productData.variants.map(variant => {
          if (variant.images && Array.isArray(variant.images)) {
            variant.images = variant.images.filter(img => {
              if (!img || !img.url) return true;
              const isBase64 = img.url.startsWith('data:image');
              if (isBase64) {
                this.logger.warn(`Phát hiện và loại bỏ URL base64 trong hình ảnh biến thể khi tạo sản phẩm`);
              }
              return !isBase64;
            });
          }
          return variant;
        });
      }

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

      // Explicitly remove variants array if it's empty before saving
      // This helps avoid potential issues with sparse unique indexes on empty arrays
      if (Array.isArray(productData.variants) && productData.variants.length === 0) {
        this.logger.log('Variants array is empty, removing it from data before saving.');
        delete productData.variants;
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
      const filter: any = {};

      // Use compound indexes when possible by combining filters
      // For example, if both status and brandId are provided, use the compound index

      // Text search - only add if needed as it's expensive
      if (search) {
        // Xử lý từ khóa tìm kiếm
        const processedSearch = search.trim();

        // Log để debug
        this.logger.log(`Tìm kiếm sản phẩm với từ khóa: "${processedSearch}"`);

        if (this.hasTextIndex) {
          // Cải thiện: Sử dụng text search với phrase match cho cụm từ chính xác
          // Thêm dấu ngoặc kép để tìm kiếm chính xác cụm từ
          if (processedSearch.includes(" ")) {
            // Nếu là cụm từ nhiều từ, tìm kiếm cả cụm từ chính xác và từng từ riêng lẻ
            // với ưu tiên cao hơn cho cụm từ chính xác
            filter.$text = { $search: `"${processedSearch}" ${processedSearch}` };
            this.logger.log(`Sử dụng text index search với cụm từ chính xác: "${processedSearch}"`);
          } else {
            // Nếu chỉ có một từ, tìm kiếm bình thường
            filter.$text = { $search: processedSearch };
            this.logger.log(`Sử dụng text index search với từ khóa đơn: "${processedSearch}"`);
          }
        } else {
          // Chuẩn bị từ khóa cho regex search
          const regexSearch = processedSearch.replace(/_/g, '[_\\s]?');
          const alternativeSearch = processedSearch.replace(/_/g, ' ');

          // Escape các ký tự đặc biệt trong regex
          const regexPattern = processedSearch.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');

          // Mở rộng phạm vi tìm kiếm khi sử dụng regex
          filter.$or = [
            // Tìm kiếm chính xác cụm từ (ưu tiên cao nhất)
            { name: { $regex: `\\b${regexPattern}\\b`, $options: 'i' } },

            // Tìm kiếm cụm từ xuất hiện trong tên sản phẩm
            { name: { $regex: regexPattern, $options: 'i' } },

            // Tìm kiếm trong các trường khác
            { sku: { $regex: regexSearch, $options: 'i' } },
            { slug: { $regex: regexSearch, $options: 'i' } },
            { tags: { $regex: regexSearch, $options: 'i' } },
            { 'description.short': { $regex: regexPattern, $options: 'i' } },
            { 'description.full': { $regex: regexPattern, $options: 'i' } },
          ];

          // Nếu từ khóa có nhiều từ, thêm logic tìm kiếm đặc biệt cho cụm từ
          if (processedSearch.includes(' ')) {
            // Tạo phiên bản không có khoảng trắng của regex pattern
            const nonSpacePattern = regexPattern.replace(/\s+/g, '');

            // Tìm kiếm khi các từ xuất hiện gần nhau (không nhất thiết liên tiếp)
            const words = processedSearch.split(' ').map(word =>
              word.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')
            );

            if (words.length > 1) {
              // Tìm kiếm với các từ theo đúng thứ tự
              const orderedWordsPattern = words.join('.*');

              // Thêm các điều kiện tìm kiếm chính xác hơn
              filter.$or.unshift(
                // Ưu tiên cao nhất: Các từ xuất hiện theo đúng thứ tự và gần nhau
                { name: { $regex: orderedWordsPattern, $options: 'i' } },
              );
            }
          }

          // Nếu từ khóa tìm kiếm có dấu gạch dưới, thêm điều kiện tìm kiếm với khoảng trắng
          if (processedSearch.includes('_')) {
            this.logger.log(`Tìm kiếm bổ sung với từ khóa thay thế: "${alternativeSearch}"`);
            filter.$or.push(
              { name: { $regex: alternativeSearch, $options: 'i' } },
              { sku: { $regex: alternativeSearch, $options: 'i' } },
              { slug: { $regex: alternativeSearch, $options: 'i' } },
              { tags: { $regex: alternativeSearch, $options: 'i' } },
              { 'description.short': { $regex: alternativeSearch, $options: 'i' } },
              { 'description.full': { $regex: alternativeSearch, $options: 'i' } }
            );
          }

          this.logger.log(`Sử dụng regex search với pattern: "${regexPattern}" (từ khóa gốc: "${processedSearch}")`);
        }
      }

      // Filter by brand - use ObjectId for proper indexing
      if (brandId) {
        try {
          filter.brandId = new Types.ObjectId(brandId);
        } catch (e) {
          this.logger.warn(`Invalid brandId format: ${brandId}`);
        }
      }

      // Filter by category - use ObjectId for proper indexing
      if (categoryId) {
        try {
          filter.categoryIds = new Types.ObjectId(categoryId);
        } catch (e) {
          this.logger.warn(`Invalid categoryId format: ${categoryId}`);
        }
      }

      // Filter by status
      if (status) {
        filter.status = status;
      }

      // Filter by price range
      if (minPrice !== undefined || maxPrice !== undefined) {
        filter.price = {};
        if (minPrice !== undefined) {
          filter.price.$gte = minPrice;
        }
        if (maxPrice !== undefined) {
          filter.price.$lte = maxPrice;
        }
      }

      // Filter by tags - optimize by using $all for exact matches
      if (tags) {
        const tagList = tags.split(',').map(tag => tag.trim());
        filter.tags = tagList.length === 1 ? tagList[0] : { $in: tagList };
      }

      // Filter by skin types - optimize by using $all for exact matches
      if (skinTypes) {
        const skinTypeList = skinTypes.split(',').map(type => type.trim());
        filter['cosmetic_info.skinType'] = skinTypeList.length === 1 ?
          skinTypeList[0] : { $in: skinTypeList };
      }

      // Filter by skin concerns - optimize by using $all for exact matches
      if (concerns) {
        const concernList = concerns.split(',').map(concern => concern.trim());
        filter['cosmetic_info.concerns'] = concernList.length === 1 ?
          concernList[0] : { $in: concernList };
      }

      // Filter by flags
      if (isBestSeller !== undefined) {
        filter['flags.isBestSeller'] = typeof isBestSeller === 'string'
          ? isBestSeller === 'true'
          : Boolean(isBestSeller);
      }

      if (isNew !== undefined) {
        filter['flags.isNew'] = typeof isNew === 'string'
          ? isNew === 'true'
          : Boolean(isNew);
      }

      if (isOnSale !== undefined) {
        filter['flags.isOnSale'] = typeof isOnSale === 'string'
          ? isOnSale === 'true'
          : Boolean(isOnSale);
      }

      if (hasGifts !== undefined) {
        filter['flags.hasGifts'] = typeof hasGifts === 'string'
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
        .find(filter, projection)
        .sort(sortOptions)
        .skip(skip)
        .limit(limit)
        .lean()
        .exec();

      // Use countDocuments for better performance than count()
      const total = await this.productModel.countDocuments(filter).exec();
      const totalPages = Math.ceil(total / limit);

      // Map products to response DTOs
      const items = products.map(product => this.mapProductToResponseDto(product));

      // Log kết quả tìm kiếm để debug
      if (search) {
        this.logger.log(`Kết quả tìm kiếm cho "${search}": Tìm thấy ${items.length} sản phẩm`);
        if (items.length > 0) {
          this.logger.log(`Danh sách sản phẩm tìm thấy: ${items.map(p => p.name).join(', ')}`);
        } else {
          this.logger.log(`Không tìm thấy sản phẩm nào với từ khóa "${search}"`);
        }
      }

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

      // Kiểm tra và lọc bỏ các URL base64 trong images
      if (updateProductDto.images && Array.isArray(updateProductDto.images)) {
        this.logger.log(`Kiểm tra ${updateProductDto.images.length} hình ảnh để loại bỏ dữ liệu base64`);

        // Lọc bỏ các hình ảnh có URL dạng base64
        const filteredImages = updateProductDto.images.filter(img => {
          if (!img || !img.url) return true; // Giữ lại nếu không có URL

          const isBase64 = img.url.startsWith('data:image');
          if (isBase64) {
            this.logger.warn(`Phát hiện và loại bỏ URL base64 trong hình ảnh sản phẩm ID: ${id}`);
          }
          return !isBase64;
        });

        if (filteredImages.length !== updateProductDto.images.length) {
          this.logger.log(`Đã loại bỏ ${updateProductDto.images.length - filteredImages.length} hình ảnh có URL base64`);
        }

        updateProductDto.images = filteredImages;
      }

      // Kiểm tra và lọc bỏ các URL base64 trong variants
      if (updateProductDto.variants && Array.isArray(updateProductDto.variants)) {
        updateProductDto.variants = updateProductDto.variants.map(variant => {
          if (variant.images && Array.isArray(variant.images)) {
            variant.images = variant.images.filter(img => {
              if (!img || !img.url) return true;
              const isBase64 = img.url.startsWith('data:image');
              if (isBase64) {
                this.logger.warn(`Phát hiện và loại bỏ URL base64 trong hình ảnh biến thể của sản phẩm ID: ${id}`);
              }
              return !isBase64;
            });
          }
          return variant;
        });
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

  async updateVariantInventory(id: string, branchId: string, variantId: string, quantity: number): Promise<ProductResponseDto> {
    try {
      const product = await this.productModel.findById(id);

      if (!product) {
        throw new NotFoundException(`Không tìm thấy sản phẩm với ID: ${id}`);
      }

      // Check if variant exists
      const variantIndex = product.variants.findIndex(variant => variant.variantId.toString() === variantId);
      if (variantIndex === -1) {
        throw new NotFoundException(`Không tìm thấy biến thể với ID: ${variantId} trong sản phẩm này`);
      }

      // Initialize variantInventory array if it doesn't exist
      if (!product.variantInventory) {
        product.variantInventory = [];
      }

      // Find the inventory entry for the variant in the branch
      const inventoryIndex = product.variantInventory.findIndex(
        inv => inv.branchId.toString() === branchId && inv.variantId.toString() === variantId
      );

      // Store old quantity for calculating the difference
      const oldQuantity = inventoryIndex !== -1 ? product.variantInventory[inventoryIndex].quantity : 0;

      if (inventoryIndex === -1) {
        // Add new inventory entry if it doesn't exist
        product.variantInventory.push({
          branchId: new Types.ObjectId(branchId),
          variantId: new Types.ObjectId(variantId),
          quantity,
          lowStockThreshold: 5
        });
      } else {
        // Update existing inventory entry
        product.variantInventory[inventoryIndex].quantity = quantity;
      }

      // Kiểm tra xem biến thể có tổ hợp không
      const variant = product.variants[variantIndex];
      const hasCombinations = variant.combinations && variant.combinations.length > 0;

      // Nếu biến thể có tổ hợp và số lượng thay đổi, cập nhật tồn kho cho các tổ hợp
      if (hasCombinations && quantity !== oldQuantity) {
        // Khởi tạo mảng combinationInventory nếu chưa có
        if (!product.combinationInventory) {
          product.combinationInventory = [];
        }

        // Tính toán số lượng cần phân bổ cho mỗi tổ hợp
        const combinationsCount = variant.combinations.length;
        const quantityPerCombination = Math.floor(quantity / combinationsCount);
        const remainder = quantity % combinationsCount;

        // Cập nhật tồn kho cho từng tổ hợp
        variant.combinations.forEach((combination, index) => {
          // Tính số lượng cho tổ hợp này (phân bổ số dư cho các tổ hợp đầu tiên)
          const combinationQuantity = quantityPerCombination + (index < remainder ? 1 : 0);

          // Tìm mục tồn kho của tổ hợp này
          const combinationInventoryIndex = product.combinationInventory.findIndex(
            inv => inv.branchId.toString() === branchId &&
                  inv.variantId.toString() === variantId &&
                  inv.combinationId.toString() === combination.combinationId.toString()
          );

          if (combinationInventoryIndex === -1) {
            // Thêm mới nếu chưa tồn tại
            product.combinationInventory.push({
              branchId: new Types.ObjectId(branchId),
              variantId: new Types.ObjectId(variantId),
              combinationId: combination.combinationId,
              quantity: combinationQuantity,
              lowStockThreshold: 5
            });
          } else {
            // Cập nhật nếu đã tồn tại
            product.combinationInventory[combinationInventoryIndex].quantity = combinationQuantity;
          }

          this.logger.log(`Cập nhật tồn kho tổ hợp: Sản phẩm ${id}, Chi nhánh ${branchId}, Biến thể ${variantId}, Tổ hợp ${combination.combinationId}, Số lượng ${combinationQuantity}`);
        });
      }

      // Find the branch inventory entry
      const branchInventoryIndex = product.inventory.findIndex(
        inv => inv.branchId.toString() === branchId
      );

      // Tính toán lại tổng số lượng từ tất cả các biến thể trong chi nhánh này
      const branchVariantInventory = product.variantInventory.filter(
        inv => inv.branchId.toString() === branchId
      );

      const totalVariantQuantity = branchVariantInventory.reduce(
        (sum, inv) => sum + inv.quantity,
        0
      );

      // Update branch inventory with the calculated total
      if (branchInventoryIndex !== -1) {
        // Update existing branch inventory with the total from all variants
        product.inventory[branchInventoryIndex].quantity = totalVariantQuantity;
        this.logger.log(`Cập nhật tồn kho chi nhánh: ${branchId}, Tổng số lượng mới: ${totalVariantQuantity}`);
      } else {
        // Add new branch inventory if it doesn't exist
        product.inventory.push({
          branchId: new Types.ObjectId(branchId),
          quantity: totalVariantQuantity,
          lowStockThreshold: 5
        });
        this.logger.log(`Thêm mới tồn kho chi nhánh: ${branchId}, Số lượng: ${totalVariantQuantity}`);
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

      // Log the inventory update for debugging
      this.logger.log(`Updated variant inventory: Product ${id}, Branch ${branchId}, Variant ${variantId}, Quantity ${quantity}, Branch Total: ${product.inventory.find(inv => inv.branchId.toString() === branchId)?.quantity}`);

      const updatedProduct = await product.save();
      return this.mapProductToResponseDto(updatedProduct);
    } catch (error) {
      this.logger.error(`Error updating variant inventory: ${error.message}`, error.stack);
      throw error;
    }
  }

  async updateCombinationInventory(id: string, branchId: string, variantId: string, combinationId: string, quantity: number): Promise<ProductResponseDto> {
    try {
      const product = await this.productModel.findById(id);

      if (!product) {
        throw new NotFoundException(`Không tìm thấy sản phẩm với ID: ${id}`);
      }

      // Kiểm tra biến thể có tồn tại không
      const variantIndex = product.variants.findIndex(variant => variant.variantId.toString() === variantId);
      if (variantIndex === -1) {
        throw new NotFoundException(`Không tìm thấy biến thể với ID: ${variantId} trong sản phẩm này`);
      }

      // Kiểm tra tổ hợp có tồn tại không
      const variant = product.variants[variantIndex];
      const combinationIndex = variant.combinations?.findIndex(c => c.combinationId.toString() === combinationId);

      if (combinationIndex === undefined || combinationIndex === -1) {
        throw new NotFoundException(`Không tìm thấy tổ hợp với ID: ${combinationId} trong biến thể này`);
      }

      // Khởi tạo mảng combinationInventory nếu chưa có
      if (!product.combinationInventory) {
        product.combinationInventory = [];
      }

      // Tìm mục tồn kho của tổ hợp trong chi nhánh
      const inventoryIndex = product.combinationInventory.findIndex(
        inv => inv.branchId.toString() === branchId &&
              inv.variantId.toString() === variantId &&
              inv.combinationId.toString() === combinationId
      );

      // Lưu lại số lượng cũ để tính sự thay đổi
      const oldQuantity = inventoryIndex !== -1 ? product.combinationInventory[inventoryIndex].quantity : 0;
      const quantityDifference = quantity - oldQuantity;

      if (inventoryIndex === -1) {
        // Thêm mới mục tồn kho nếu chưa tồn tại
        product.combinationInventory.push({
          branchId: new Types.ObjectId(branchId),
          variantId: new Types.ObjectId(variantId),
          combinationId: new Types.ObjectId(combinationId),
          quantity,
          lowStockThreshold: 5
        });
      } else {
        // Cập nhật mục tồn kho hiện tại
        product.combinationInventory[inventoryIndex].quantity = quantity;
      }

      // Cập nhật tổng số lượng của biến thể trong chi nhánh
      // Tìm mục tồn kho của biến thể trong chi nhánh
      const variantInventoryIndex = product.variantInventory.findIndex(
        inv => inv.branchId.toString() === branchId && inv.variantId.toString() === variantId
      );

      // Tính tổng số lượng của tất cả các tổ hợp của biến thể này trong chi nhánh
      const combinationInventories = product.combinationInventory.filter(
        inv => inv.branchId.toString() === branchId && inv.variantId.toString() === variantId
      );

      const totalCombinationQuantity = combinationInventories.reduce(
        (sum, inv) => sum + inv.quantity,
        0
      );

      if (variantInventoryIndex === -1) {
        // Thêm mới mục tồn kho biến thể nếu chưa tồn tại
        product.variantInventory.push({
          branchId: new Types.ObjectId(branchId),
          variantId: new Types.ObjectId(variantId),
          quantity: totalCombinationQuantity,
          lowStockThreshold: 5
        });
      } else {
        // Cập nhật mục tồn kho biến thể hiện tại
        product.variantInventory[variantInventoryIndex].quantity = totalCombinationQuantity;
      }

      // Cập nhật tổng số lượng của chi nhánh
      const branchInventoryIndex = product.inventory.findIndex(
        inv => inv.branchId.toString() === branchId
      );

      // Tính tổng số lượng của tất cả các biến thể trong chi nhánh
      const branchVariantInventory = product.variantInventory.filter(
        inv => inv.branchId.toString() === branchId
      );

      const totalVariantQuantity = branchVariantInventory.reduce(
        (sum, inv) => sum + inv.quantity,
        0
      );

      if (branchInventoryIndex === -1) {
        // Thêm mới mục tồn kho chi nhánh nếu chưa tồn tại
        product.inventory.push({
          branchId: new Types.ObjectId(branchId),
          quantity: totalVariantQuantity,
          lowStockThreshold: 5
        });
      } else {
        // Cập nhật mục tồn kho chi nhánh hiện tại
        product.inventory[branchInventoryIndex].quantity = totalVariantQuantity;
      }

      // Cập nhật trạng thái sản phẩm dựa trên tổng tồn kho
      const totalInventory = product.inventory.reduce(
        (sum, inv) => sum + inv.quantity,
        0
      );

      if (totalInventory === 0 && product.status !== 'discontinued') {
        product.status = 'out_of_stock';
      } else if (totalInventory > 0 && product.status === 'out_of_stock') {
        product.status = 'active';
      }

      // Ghi log cập nhật tồn kho
      this.logger.log(`Cập nhật tồn kho tổ hợp: Sản phẩm ${id}, Chi nhánh ${branchId}, Biến thể ${variantId}, Tổ hợp ${combinationId}, Số lượng ${quantity}`);
      this.logger.log(`Tổng số lượng biến thể ${variantId}: ${totalCombinationQuantity}, Tổng số lượng chi nhánh ${branchId}: ${totalVariantQuantity}`);

      const updatedProduct = await product.save();
      return this.mapProductToResponseDto(updatedProduct);
    } catch (error) {
      this.logger.error(`Error updating combination inventory: ${error.message}`, error.stack);
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

      // Xử lý tổ hợp biến thể nếu có
      if (variantDto.options &&
          ((Array.isArray(variantDto.options.shades) && variantDto.options.shades.length > 0) ||
           (Array.isArray(variantDto.options.sizes) && variantDto.options.sizes.length > 0))) {

        // Tạo tổ hợp từ shades và sizes
        const shades = Array.isArray(variantDto.options.shades) ? variantDto.options.shades : [];
        const sizes = Array.isArray(variantDto.options.sizes) ? variantDto.options.sizes : [];

        // Nếu có cả shades và sizes, tạo tổ hợp từ cả hai
        if (shades.length > 0 && sizes.length > 0) {
          variantDto.combinations = [];

          for (const shade of shades) {
            for (const size of sizes) {
              variantDto.combinations.push({
                combinationId: new Types.ObjectId(),
                attributes: { shade, size },
                price: variantDto.price || 0,
                additionalPrice: 0
              });
            }
          }

          this.logger.log(`Đã tạo ${variantDto.combinations.length} tổ hợp biến thể từ ${shades.length} shades và ${sizes.length} sizes`);
        }
        // Nếu chỉ có shades, tạo tổ hợp từ shades
        else if (shades.length > 0) {
          variantDto.combinations = shades.map(shade => ({
            combinationId: new Types.ObjectId(),
            attributes: { shade },
            price: variantDto.price || 0,
            additionalPrice: 0
          }));

          this.logger.log(`Đã tạo ${variantDto.combinations.length} tổ hợp biến thể từ ${shades.length} shades`);
        }
        // Nếu chỉ có sizes, tạo tổ hợp từ sizes
        else if (sizes.length > 0) {
          variantDto.combinations = sizes.map(size => ({
            combinationId: new Types.ObjectId(),
            attributes: { size },
            price: variantDto.price || 0,
            additionalPrice: 0
          }));

          this.logger.log(`Đã tạo ${variantDto.combinations.length} tổ hợp biến thể từ ${sizes.length} sizes`);
        }
      }

      // Add new variant
      product.variants.push(variantDto);

      // Khi thêm biến thể đầu tiên, cần kiểm tra và xử lý số lượng tồn kho
      if (product.variants.length === 1) {
        this.logger.log(`Sản phẩm ${id} chuyển từ không có biến thể sang có biến thể. Cập nhật lại tồn kho.`);

        // Nếu sản phẩm đã có tồn kho chi nhánh, cần chuyển đổi sang tồn kho biến thể
        if (product.inventory && product.inventory.length > 0) {
          // Khởi tạo mảng variantInventory nếu chưa có
          if (!product.variantInventory) {
            product.variantInventory = [];
          }

          // Với mỗi chi nhánh, tạo một mục tồn kho biến thể mới
          for (const inv of product.inventory) {
            // Chỉ xử lý các chi nhánh có số lượng > 0
            if (inv.quantity > 0) {
              // Thêm tồn kho cho biến thể mới với toàn bộ số lượng của chi nhánh
              product.variantInventory.push({
                branchId: inv.branchId,
                variantId: product.variants[0].variantId,
                quantity: inv.quantity,
                lowStockThreshold: inv.lowStockThreshold || 5
              });

              this.logger.log(`Đã chuyển ${inv.quantity} sản phẩm từ chi nhánh ${inv.branchId} sang biến thể ${product.variants[0].variantId}`);

              // Nếu biến thể có tổ hợp, phân bổ số lượng cho các tổ hợp
              if (product.variants[0].combinations && product.variants[0].combinations.length > 0) {
                // Khởi tạo mảng combinationInventory nếu chưa có
                if (!product.combinationInventory) {
                  product.combinationInventory = [];
                }

                // Phân bổ số lượng đều cho các tổ hợp
                const quantityPerCombination = Math.floor(inv.quantity / product.variants[0].combinations.length);
                const remainder = inv.quantity % product.variants[0].combinations.length;

                product.variants[0].combinations.forEach((combination, index) => {
                  // Thêm số lượng cho tổ hợp, cộng thêm 1 cho các tổ hợp đầu tiên nếu có số dư
                  const combinationQuantity = quantityPerCombination + (index < remainder ? 1 : 0);

                  product.combinationInventory.push({
                    branchId: inv.branchId,
                    variantId: product.variants[0].variantId,
                    combinationId: combination.combinationId,
                    quantity: combinationQuantity,
                    lowStockThreshold: inv.lowStockThreshold || 5
                  });

                  this.logger.log(`Đã phân bổ ${combinationQuantity} sản phẩm cho tổ hợp ${combination.combinationId} của biến thể ${product.variants[0].variantId} tại chi nhánh ${inv.branchId}`);
                });
              }
            }
          }
        }
      }

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

      // Lưu lại các tổ hợp hiện tại (nếu có)
      const existingCombinations = product.variants[variantIndex].combinations || [];

      // Xử lý tổ hợp biến thể nếu có thay đổi trong options
      if (variantDto.options &&
          ((Array.isArray(variantDto.options.shades) && variantDto.options.shades.length > 0) ||
           (Array.isArray(variantDto.options.sizes) && variantDto.options.sizes.length > 0))) {

        // Tạo tổ hợp từ shades và sizes
        const shades = Array.isArray(variantDto.options.shades) ? variantDto.options.shades : [];
        const sizes = Array.isArray(variantDto.options.sizes) ? variantDto.options.sizes : [];

        // Kiểm tra xem có sự thay đổi trong shades hoặc sizes không
        const currentOptions = product.variants[variantIndex].options || {};
        const currentShades = Array.isArray(currentOptions.shades) ? currentOptions.shades : [];
        const currentSizes = Array.isArray(currentOptions.sizes) ? currentOptions.sizes : [];

        // Kiểm tra sự thay đổi bằng cách so sánh mảng
        const shadesChanged = JSON.stringify(shades.sort()) !== JSON.stringify(currentShades.sort());
        const sizesChanged = JSON.stringify(sizes.sort()) !== JSON.stringify(currentSizes.sort());

        // Nếu có sự thay đổi, tạo lại các tổ hợp
        if (shadesChanged || sizesChanged) {
          this.logger.log(`Phát hiện thay đổi trong shades hoặc sizes, tạo lại tổ hợp biến thể`);

          // Nếu có cả shades và sizes, tạo tổ hợp từ cả hai
          if (shades.length > 0 && sizes.length > 0) {
            variantDto.combinations = [];

            for (const shade of shades) {
              for (const size of sizes) {
                // Tìm tổ hợp tương ứng trong các tổ hợp hiện tại (nếu có)
                const existingCombination = existingCombinations.find(c =>
                  c.attributes && c.attributes.shade === shade && c.attributes.size === size
                );

                if (existingCombination) {
                  // Sử dụng lại tổ hợp hiện tại
                  variantDto.combinations.push(existingCombination);
                } else {
                  // Tạo tổ hợp mới
                  variantDto.combinations.push({
                    combinationId: new Types.ObjectId(),
                    attributes: { shade, size },
                    price: variantDto.price || 0,
                    additionalPrice: 0
                  });
                }
              }
            }

            this.logger.log(`Đã tạo ${variantDto.combinations.length} tổ hợp biến thể từ ${shades.length} shades và ${sizes.length} sizes`);
          }
          // Nếu chỉ có shades, tạo tổ hợp từ shades
          else if (shades.length > 0) {
            variantDto.combinations = [];

            for (const shade of shades) {
              // Tìm tổ hợp tương ứng trong các tổ hợp hiện tại (nếu có)
              const existingCombination = existingCombinations.find(c =>
                c.attributes && c.attributes.shade === shade && !c.attributes.size
              );

              if (existingCombination) {
                // Sử dụng lại tổ hợp hiện tại
                variantDto.combinations.push(existingCombination);
              } else {
                // Tạo tổ hợp mới
                variantDto.combinations.push({
                  combinationId: new Types.ObjectId(),
                  attributes: { shade },
                  price: variantDto.price || 0,
                  additionalPrice: 0
                });
              }
            }

            this.logger.log(`Đã tạo ${variantDto.combinations.length} tổ hợp biến thể từ ${shades.length} shades`);
          }
          // Nếu chỉ có sizes, tạo tổ hợp từ sizes
          else if (sizes.length > 0) {
            variantDto.combinations = [];

            for (const size of sizes) {
              // Tìm tổ hợp tương ứng trong các tổ hợp hiện tại (nếu có)
              const existingCombination = existingCombinations.find(c =>
                c.attributes && c.attributes.size === size && !c.attributes.shade
              );

              if (existingCombination) {
                // Sử dụng lại tổ hợp hiện tại
                variantDto.combinations.push(existingCombination);
              } else {
                // Tạo tổ hợp mới
                variantDto.combinations.push({
                  combinationId: new Types.ObjectId(),
                  attributes: { size },
                  price: variantDto.price || 0,
                  additionalPrice: 0
                });
              }
            }

            this.logger.log(`Đã tạo ${variantDto.combinations.length} tổ hợp biến thể từ ${sizes.length} sizes`);
          }

          // Cập nhật tồn kho cho các tổ hợp mới
          if (variantDto.combinations && variantDto.combinations.length > 0) {
            // Lấy danh sách các combinationId cũ
            const oldCombinationIds = existingCombinations.map(c => c.combinationId.toString());
            // Lấy danh sách các combinationId mới
            const newCombinationIds = variantDto.combinations
              .filter(c => c.combinationId && typeof c.combinationId === 'object')
              .map(c => c.combinationId.toString());

            // Tìm các combinationId đã bị xóa
            const removedCombinationIds = oldCombinationIds.filter(id => !newCombinationIds.includes(id));

            // Xóa tồn kho của các tổ hợp đã bị xóa
            if (removedCombinationIds.length > 0 && product.combinationInventory) {
              product.combinationInventory = product.combinationInventory.filter(inv =>
                !removedCombinationIds.includes(inv.combinationId.toString())
              );

              this.logger.log(`Đã xóa tồn kho của ${removedCombinationIds.length} tổ hợp đã bị loại bỏ`);
            }
          }
        }
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

      // Lưu lại số lượng biến thể trước khi xóa
      const variantCountBeforeRemove = product.variants.length;

      // Lưu lại danh sách các tổ hợp của biến thể này (nếu có)
      const variantCombinations = product.variants[variantIndex].combinations || [];
      const combinationIds = variantCombinations.map(c => c.combinationId.toString());

      // Remove variant
      product.variants.splice(variantIndex, 1);

      // Xóa tất cả các mục tồn kho của biến thể này
      if (product.variantInventory && product.variantInventory.length > 0) {
        // Lọc ra các mục tồn kho của biến thể bị xóa
        const variantInventoryToRemove = product.variantInventory.filter(
          inv => inv.variantId.toString() === variantId
        );

        // Lưu lại thông tin tồn kho theo chi nhánh trước khi xóa
        const branchQuantities = new Map<string, number>();
        variantInventoryToRemove.forEach(inv => {
          branchQuantities.set(inv.branchId.toString(), inv.quantity);
        });

        // Xóa các mục tồn kho của biến thể
        product.variantInventory = product.variantInventory.filter(
          inv => inv.variantId.toString() !== variantId
        );

        // Xóa tồn kho của các tổ hợp của biến thể này
        if (product.combinationInventory && product.combinationInventory.length > 0 && combinationIds.length > 0) {
          product.combinationInventory = product.combinationInventory.filter(inv =>
            !combinationIds.includes(inv.combinationId.toString())
          );

          this.logger.log(`Đã xóa tồn kho của ${combinationIds.length} tổ hợp thuộc biến thể ${variantId}`);
        }

        // Cập nhật lại số lượng tồn kho của các chi nhánh
        for (const [branchIdStr, quantity] of branchQuantities.entries()) {
          const branchInventoryIndex = product.inventory.findIndex(
            inv => inv.branchId.toString() === branchIdStr
          );

          if (branchInventoryIndex !== -1) {
            // Tính toán lại tổng số lượng từ các biến thể còn lại trong chi nhánh
            const remainingVariantInventory = product.variantInventory.filter(
              inv => inv.branchId.toString() === branchIdStr
            );

            const newBranchTotal = remainingVariantInventory.reduce(
              (sum, inv) => sum + inv.quantity,
              0
            );

            // Cập nhật số lượng mới cho chi nhánh
            product.inventory[branchInventoryIndex].quantity = newBranchTotal;

            this.logger.log(`Cập nhật tồn kho chi nhánh ${branchIdStr} sau khi xóa biến thể: ${newBranchTotal}`);
          }
        }
      }

      // Nếu đã xóa biến thể cuối cùng, cần xóa tất cả variantInventory và combinationInventory
      if (variantCountBeforeRemove === 1 && product.variants.length === 0) {
        this.logger.log(`Đã xóa biến thể cuối cùng của sản phẩm ${id}. Xóa tất cả tồn kho biến thể và tổ hợp.`);
        product.variantInventory = [];
        product.combinationInventory = [];
      }

      const updatedProduct = await product.save();
      return this.mapProductToResponseDto(updatedProduct);
    } catch (error) {
      this.logger.error(`Error removing product variant: ${error.message}`, error.stack);
      throw error;
    }
  }

  async findAllLight(queryDto: QueryProductDto) {
    try {
      const {
        page = 1,
        limit = 10,
        search,
        brandId,
        categoryId,
        eventId,
        campaignId,
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

      // --- START: Xử lý filter theo eventId hoặc campaignId ---
      if (eventId || campaignId) {
        let productIds: string[] = [];

        if (eventId) {
          // Lấy thông tin sự kiện
          const event = await this.eventsService.findOne(eventId);
          if (event && Array.isArray(event.products)) {
            // Lấy danh sách ID sản phẩm từ sự kiện
            productIds = event.products.map(p => p.productId.toString());
            this.logger.log(`Filtering by ${productIds.length} products from event ${eventId}`);
          }
        } else if (campaignId) {
          // Lấy thông tin chiến dịch
          const campaign = await this.campaignsService.findOne(campaignId);
          if (campaign && Array.isArray(campaign.products)) {
            // Lấy danh sách ID sản phẩm từ chiến dịch
            productIds = campaign.products.map(p => p.productId.toString());
            this.logger.log(`Filtering by ${productIds.length} products from campaign ${campaignId}`);
          }
        }

        // Nếu có danh sách sản phẩm, thêm vào filter
        if (productIds.length > 0) {
          // Chuyển đổi string ID thành ObjectId
          const objectIds = productIds.map(id => new Types.ObjectId(id));
          filter._id = { $in: objectIds };
        } else {
          // Nếu không tìm thấy sản phẩm nào, trả về danh sách rỗng
          return {
            products: [],
            total: 0,
            page: +page,
            limit: +limit,
            totalPages: 0,
          };
        }
      }
      // --- END: Xử lý filter theo eventId hoặc campaignId ---

      // Sử dụng text search nếu có index text thay vì regex cho hiệu suất tốt hơn
      if (search) {
        // Xử lý từ khóa tìm kiếm
        const processedSearch = search.trim();

        // Log để debug
        this.logger.log(`Tìm kiếm sản phẩm với từ khóa: "${processedSearch}"`);

        if (this.hasTextIndex) {
          // Cải thiện: Sử dụng text search với phrase match cho cụm từ chính xác
          // Thêm dấu ngoặc kép để tìm kiếm chính xác cụm từ
          if (processedSearch.includes(" ")) {
            // Nếu là cụm từ nhiều từ, tìm kiếm cả cụm từ chính xác và từng từ riêng lẻ
            // với ưu tiên cao hơn cho cụm từ chính xác
            filter.$text = { $search: `"${processedSearch}" ${processedSearch}` };
            this.logger.log(`Sử dụng text index search với cụm từ chính xác: "${processedSearch}"`);
          } else {
            // Nếu chỉ có một từ, tìm kiếm bình thường
            filter.$text = { $search: processedSearch };
            this.logger.log(`Sử dụng text index search với từ khóa đơn: "${processedSearch}"`);
          }
        } else {
          // Chuẩn bị từ khóa cho regex search
          const regexSearch = processedSearch.replace(/_/g, '[_\\s]?');
          const alternativeSearch = processedSearch.replace(/_/g, ' ');

          // Escape các ký tự đặc biệt trong regex
          const regexPattern = processedSearch.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');

          // Mở rộng phạm vi tìm kiếm khi sử dụng regex
          filter.$or = [
            // Tìm kiếm chính xác cụm từ (ưu tiên cao nhất)
            { name: { $regex: `\\b${regexPattern}\\b`, $options: 'i' } },

            // Tìm kiếm cụm từ xuất hiện trong tên sản phẩm
            { name: { $regex: regexPattern, $options: 'i' } },

            // Tìm kiếm trong các trường khác
            { sku: { $regex: regexSearch, $options: 'i' } },
            { slug: { $regex: regexSearch, $options: 'i' } },
            { tags: { $regex: regexSearch, $options: 'i' } },
            { 'description.short': { $regex: regexPattern, $options: 'i' } },
            { 'description.full': { $regex: regexPattern, $options: 'i' } },
          ];

          // Nếu từ khóa có nhiều từ, thêm logic tìm kiếm đặc biệt cho cụm từ
          if (processedSearch.includes(' ')) {
            // Tạo phiên bản không có khoảng trắng của regex pattern
            const nonSpacePattern = regexPattern.replace(/\s+/g, '');

            // Tìm kiếm khi các từ xuất hiện gần nhau (không nhất thiết liên tiếp)
            const words = processedSearch.split(' ').map(word =>
              word.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')
            );

            if (words.length > 1) {
              // Tìm kiếm với các từ theo đúng thứ tự
              const orderedWordsPattern = words.join('.*');

              // Thêm các điều kiện tìm kiếm chính xác hơn
              filter.$or.unshift(
                // Ưu tiên cao nhất: Các từ xuất hiện theo đúng thứ tự và gần nhau
                { name: { $regex: orderedWordsPattern, $options: 'i' } },
              );
            }
          }

          // Nếu từ khóa tìm kiếm có dấu gạch dưới, thêm điều kiện tìm kiếm với khoảng trắng
          if (processedSearch.includes('_')) {
            this.logger.log(`Tìm kiếm bổ sung với từ khóa thay thế: "${alternativeSearch}"`);
            filter.$or.push(
              { name: { $regex: alternativeSearch, $options: 'i' } },
              { sku: { $regex: alternativeSearch, $options: 'i' } },
              { slug: { $regex: alternativeSearch, $options: 'i' } },
              { tags: { $regex: alternativeSearch, $options: 'i' } },
              { 'description.short': { $regex: alternativeSearch, $options: 'i' } },
              { 'description.full': { $regex: alternativeSearch, $options: 'i' } }
            );
          }

          this.logger.log(`Sử dụng regex search với pattern: "${regexPattern}" (từ khóa gốc: "${processedSearch}")`);
        }
      }

      // Chuyển đổi brandId sang ObjectId nếu hợp lệ - hỗ trợ multiple IDs
      if (brandId) {
        try {
          // Parse comma-separated brandIds
          const brandIds = brandId.split(',').map(id => id.trim()).filter(id => id.length > 0);
          const validBrandIds = brandIds.filter(id => Types.ObjectId.isValid(id));

          if (validBrandIds.length > 0) {
            if (validBrandIds.length === 1) {
              // Single brand
              filter.brandId = new Types.ObjectId(validBrandIds[0]);
            } else {
              // Multiple brands
              filter.brandId = { $in: validBrandIds.map(id => new Types.ObjectId(id)) };
            }
            this.logger.log(`Filtering by ${validBrandIds.length} brand(s): ${validBrandIds.join(', ')}`);
          } else {
            this.logger.warn(`No valid brandIds found in: ${brandId}`);
          }
        } catch (e) {
          this.logger.warn(`Invalid brandId format: ${brandId}`);
        }
      }

      // Chuyển đổi categoryId sang ObjectId nếu hợp lệ - hỗ trợ multiple IDs
      if (categoryId) {
        try {
          // Parse comma-separated categoryIds
          const categoryIds = categoryId.split(',').map(id => id.trim()).filter(id => id.length > 0);
          const validCategoryIds = categoryIds.filter(id => Types.ObjectId.isValid(id));

          if (validCategoryIds.length > 0) {
            // Sử dụng $in để tìm sản phẩm có ít nhất một trong các category được chọn
            filter.categoryIds = { $in: validCategoryIds.map(id => new Types.ObjectId(id)) };
            this.logger.log(`Filtering by ${validCategoryIds.length} category(s): ${validCategoryIds.join(', ')}`);
          } else {
            this.logger.warn(`No valid categoryIds found in: ${categoryId}`);
          }
        } catch (e) {
          this.logger.warn(`Invalid categoryId format: ${categoryId}`);
        }
      }

      if (status) filter.status = status;

      // Tối ưu hóa filter price bằng cách chỉ thêm các điều kiện cần thiết
      if (minPrice !== undefined || maxPrice !== undefined) {
        filter.price = {};
        if (minPrice !== undefined) {
          filter.price.$gte = Number(minPrice);
        }
        if (maxPrice !== undefined) {
          filter.price.$lte = Number(maxPrice);
        }
      }

      // Tối ưu hóa filters với index
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

      // Xử lý các trường boolean một cách chính xác
      if (isBestSeller !== undefined) {
        const isBestSellerBool = typeof isBestSeller === 'string'
          ? isBestSeller === 'true'
          : Boolean(isBestSeller);
        filter['flags.isBestSeller'] = isBestSellerBool;
      }

      if (isNew !== undefined) {
        const isNewBool = typeof isNew === 'string'
          ? isNew === 'true'
          : Boolean(isNew);
        filter['flags.isNew'] = isNewBool;
      }

      if (isOnSale !== undefined) {
        const isOnSaleBool = typeof isOnSale === 'string'
          ? isOnSale === 'true'
          : Boolean(isOnSale);
        filter['flags.isOnSale'] = isOnSaleBool;
      }


      // Build sorting
      const sort: any = {};
      sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

      // Calculate pagination
      const skip = (page - 1) * limit;

      // Thực hiện truy vấn đếm và lấy dữ liệu song song để tối ưu hiệu suất
      const [total, products] = await Promise.all([
        this.productModel.countDocuments(filter),
        this.productModel
          .find(filter)
          .select('_id name slug sku price currentPrice status images brandId categoryIds flags reviews soldCount')
          .populate('brandId', 'name')
          .populate('categoryIds', 'name')
          .sort(sort)
          .skip(skip)
          .limit(+limit)
          .lean()
      ]);

      // Calculate total pages
      const totalPages = Math.ceil(total / limit);

      // --- START: Tích hợp Event/Campaign ---
      // Lấy tất cả events và campaigns đang hoạt động
      const [activeEvents, activeCampaigns] = await Promise.all([
        this.eventsService.findActive(),
        this.campaignsService.getActiveCampaigns()
      ]);

      // Tạo map để lưu giá khuyến mãi tốt nhất cho mỗi sản phẩm
      const promotionMap = new Map<string, { price: number; type: 'event' | 'campaign'; name: string; id?: string }>();

      // Xử lý active events
      activeEvents.forEach(event => {
        event.products.forEach(productInEvent => {
          const productIdStr = productInEvent.productId.toString();
          const currentPromotion = promotionMap.get(productIdStr);
          if (!currentPromotion || productInEvent.adjustedPrice < currentPromotion.price) {
            // Truy cập event._id như một thuộc tính của đối tượng (JS)
            const eventId = event['_id']?.toString() || '';
            promotionMap.set(productIdStr, {
              price: productInEvent.adjustedPrice,
              type: 'event',
              name: event.title,
              id: eventId
            });
          }
        });
      });

      // Xử lý active campaigns
      activeCampaigns.forEach(campaign => {
        campaign.products.forEach(productInCampaign => {
          const productIdStr = productInCampaign.productId.toString();
          const currentPromotion = promotionMap.get(productIdStr);
          if (!currentPromotion || productInCampaign.adjustedPrice < currentPromotion.price) {
            // Truy cập campaign._id như một thuộc tính của đối tượng (JS)
            const campaignId = campaign['_id']?.toString() || '';
            promotionMap.set(productIdStr, {
              price: productInCampaign.adjustedPrice,
              type: 'campaign',
              name: campaign.title,
              id: campaignId
            });
          }
        });
      });
      // --- END: Tích hợp Event/Campaign ---

      // Transform products to include only required information and promotion details
      const lightProducts = products.map(product => {
        // Find primary image or use first available
        let imageUrl = '';
        if (product.images && product.images.length > 0) {
          const primaryImage = product.images.find(img => img.isPrimary);
          imageUrl = primaryImage ? primaryImage.url : product.images[0].url;
        }

        const productIdStr = product._id.toString();
        const promotion = promotionMap.get(productIdStr);
        let finalPrice = product.currentPrice || product.price;
        let promotionInfo: any = null;

        if (promotion && promotion.price < finalPrice) {
          finalPrice = promotion.price;
          promotionInfo = {
            type: promotion.type,
            id: promotion.id || '',
            name: promotion.name,
            adjustedPrice: promotion.price
          };
        }

        return {
          _id: productIdStr,
          name: product.name,
          slug: product.slug,
          sku: product.sku,
          price: product.price, // Giá gốc
          currentPrice: finalPrice, // Giá hiện tại (có thể đã áp dụng KM)
          status: product.status,
          imageUrl,
          brandId: product.brandId ? (product.brandId as any)._id?.toString() : undefined,
          brandName: product.brandId ? (product.brandId as any).name : undefined,
          categoryIds: product.categoryIds && Array.isArray(product.categoryIds)
            ? product.categoryIds.map((cat: any) => ({
                id: cat._id?.toString(),
                name: cat.name || 'Không xác định'
              }))
            : [],
          flags: product.flags,
          reviews: product.reviews,
          soldCount: product.soldCount || 0, // Thêm số lượng đã bán
          promotion: promotionInfo, // Thêm thông tin khuyến mãi
        };
      });

      // Log kết quả tìm kiếm để debug
      if (search) {
        this.logger.log(`Kết quả tìm kiếm cho "${search}": Tìm thấy ${lightProducts.length} sản phẩm`);
        if (lightProducts.length > 0) {
          this.logger.log(`Danh sách sản phẩm tìm thấy: ${lightProducts.map(p => p.name).join(', ')}`);
        } else {
          this.logger.log(`Không tìm thấy sản phẩm nào với từ khóa "${search}"`);

          // Thử tìm kiếm với từ khóa đơn giản hơn để debug
          const simpleSearch = search.replace(/[_\-\s]/g, '');
          if (simpleSearch !== search) {
            this.logger.log(`Thử tìm kiếm với từ khóa đơn giản hơn: "${simpleSearch}"`);

            // Tạo filter mới chỉ để kiểm tra, không ảnh hưởng đến kết quả trả về
            const testFilter = {
              $or: [
                { name: { $regex: simpleSearch, $options: 'i' } },
                { sku: { $regex: simpleSearch, $options: 'i' } },
                { slug: { $regex: simpleSearch, $options: 'i' } },
              ]
            };

            // Thực hiện truy vấn kiểm tra
            const testProducts = await this.productModel
              .find(testFilter)
              .select('name slug sku')
              .limit(5)
              .lean();

            if (testProducts.length > 0) {
              this.logger.log(`Tìm thấy ${testProducts.length} sản phẩm với từ khóa đơn giản "${simpleSearch}": ${testProducts.map(p => p.name).join(', ')}`);
            } else {
              this.logger.log(`Không tìm thấy sản phẩm nào với từ khóa đơn giản "${simpleSearch}"`);
            }
          }
        }
      }

      return {
        products: lightProducts, // Trả về danh sách đã cập nhật
        total,
        page: +page,
        limit: +limit,
        totalPages,
      };
    } catch (error) {
      this.logger.error(`Error in findAllLight: ${error.message}`, error.stack);
      throw error;
    }
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

      // Xây dựng pipeline cho aggregation
      const pipeline: any[] = [];

      // Match stage - điều kiện lọc
      const matchStage: any = {};

      // Thêm filter tìm kiếm
      if (search) {
        // Xử lý từ khóa tìm kiếm
        const processedSearch = search.trim();

        // Log để debug
        this.logger.log(`Admin tìm kiếm sản phẩm với từ khóa: "${processedSearch}"`);

        if (this.hasTextIndex) {
          // Cải thiện: Sử dụng text search với phrase match cho cụm từ chính xác
          if (processedSearch.includes(" ")) {
            // Nếu là cụm từ nhiều từ, tìm kiếm cả cụm từ chính xác và từng từ riêng lẻ
            // với ưu tiên cao hơn cho cụm từ chính xác
            matchStage.$text = { $search: `"${processedSearch}" ${processedSearch}` };
            this.logger.log(`Admin sử dụng text index search với cụm từ chính xác: "${processedSearch}"`);
          } else {
            // Nếu chỉ có một từ, tìm kiếm bình thường
            matchStage.$text = { $search: processedSearch };
            this.logger.log(`Admin sử dụng text index search với từ khóa đơn: "${processedSearch}"`);
          }
        } else {
          // Chuẩn bị từ khóa cho regex search
          const regexSearch = processedSearch.replace(/_/g, '[_\\s]?');

          // Tạo phiên bản thay thế gạch dưới bằng khoảng trắng
          const alternativeSearch = processedSearch.replace(/_/g, ' ');

          // Escape các ký tự đặc biệt trong regex
          const regexPattern = processedSearch.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');

          // Mở rộng phạm vi tìm kiếm khi sử dụng regex
          matchStage.$or = [
            // Tìm kiếm chính xác cụm từ (ưu tiên cao nhất)
            { name: { $regex: `\\b${regexPattern}\\b`, $options: 'i' } },

            // Tìm kiếm cụm từ xuất hiện trong tên sản phẩm
            { name: { $regex: regexPattern, $options: 'i' } },

            // Tìm kiếm trong các trường khác
            { sku: { $regex: regexSearch, $options: 'i' } },
            { slug: { $regex: regexSearch, $options: 'i' } },
            { tags: { $regex: regexSearch, $options: 'i' } },
            { 'description.short': { $regex: regexPattern, $options: 'i' } },
            { 'description.full': { $regex: regexPattern, $options: 'i' } },
          ];

          // Nếu từ khóa có nhiều từ, thêm logic tìm kiếm đặc biệt cho cụm từ
          if (processedSearch.includes(' ')) {
            // Tạo phiên bản không có khoảng trắng của regex pattern
            const nonSpacePattern = regexPattern.replace(/\s+/g, '');

            // Tìm kiếm khi các từ xuất hiện gần nhau (không nhất thiết liên tiếp)
            const words = processedSearch.split(' ').map(word =>
              word.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')
            );

            if (words.length > 1) {
              // Tìm kiếm với các từ theo đúng thứ tự
              const orderedWordsPattern = words.join('.*');

              // Thêm các điều kiện tìm kiếm chính xác hơn
              matchStage.$or.unshift(
                // Ưu tiên cao nhất: Các từ xuất hiện theo đúng thứ tự và gần nhau
                { name: { $regex: orderedWordsPattern, $options: 'i' } },
              );
            }
          }

          // Nếu từ khóa tìm kiếm có dấu gạch dưới, thêm điều kiện tìm kiếm với khoảng trắng
          if (processedSearch.includes('_')) {
            this.logger.log(`Admin tìm kiếm bổ sung với từ khóa thay thế: "${alternativeSearch}"`);
            matchStage.$or.push(
              { name: { $regex: alternativeSearch, $options: 'i' } },
              { sku: { $regex: alternativeSearch, $options: 'i' } },
              { slug: { $regex: alternativeSearch, $options: 'i' } },
              { tags: { $regex: alternativeSearch, $options: 'i' } },
              { 'description.short': { $regex: alternativeSearch, $options: 'i' } },
              { 'description.full': { $regex: alternativeSearch, $options: 'i' } }
            );
          }

          this.logger.log(`Admin sử dụng regex search với pattern: "${regexPattern}" (từ khóa gốc: "${processedSearch}")`);
        }
      }

      // Thêm filter thương hiệu - hỗ trợ multiple IDs
      if (brandId) {
        try {
          // Parse comma-separated brandIds
          const brandIds = brandId.split(',').map(id => id.trim()).filter(id => id.length > 0);
          const validBrandIds = brandIds.filter(id => Types.ObjectId.isValid(id));

          if (validBrandIds.length > 0) {
            if (validBrandIds.length === 1) {
              // Single brand
              matchStage.brandId = new Types.ObjectId(validBrandIds[0]);
            } else {
              // Multiple brands
              matchStage.brandId = { $in: validBrandIds.map(id => new Types.ObjectId(id)) };
            }
            this.logger.log(`Admin filtering by ${validBrandIds.length} brand(s): ${validBrandIds.join(', ')}`);
          } else {
            this.logger.warn(`Admin: No valid brandIds found in: ${brandId}`);
          }
        } catch (e) {
          this.logger.warn(`Invalid brandId format: ${brandId}`);
        }
      }

      // Thêm filter danh mục - hỗ trợ multiple IDs
      if (categoryId) {
        try {
          // Parse comma-separated categoryIds
          const categoryIds = categoryId.split(',').map(id => id.trim()).filter(id => id.length > 0);
          const validCategoryIds = categoryIds.filter(id => Types.ObjectId.isValid(id));

          if (validCategoryIds.length > 0) {
            // Sử dụng $in để tìm sản phẩm có ít nhất một trong các category được chọn
            matchStage.categoryIds = { $in: validCategoryIds.map(id => new Types.ObjectId(id)) };
            this.logger.log(`Admin filtering by ${validCategoryIds.length} category(s): ${validCategoryIds.join(', ')}`);
          } else {
            this.logger.warn(`Admin: No valid categoryIds found in: ${categoryId}`);
          }
        } catch (e) {
          this.logger.warn(`Invalid categoryId format: ${categoryId}`);
        }
      }

      // Thêm filter trạng thái
      if (status) {
        matchStage.status = status;
      }

      // Thêm filter giá
      if (minPrice !== undefined || maxPrice !== undefined) {
        matchStage.price = {};
        if (minPrice !== undefined) {
          matchStage.price.$gte = Number(minPrice);
        }
        if (maxPrice !== undefined) {
          matchStage.price.$lte = Number(maxPrice);
        }
      }

      // Thêm filter tags
      if (tags) {
        matchStage.tags = { $in: tags.split(',').map(tag => tag.trim()) };
      }

      // Thêm filter loại da
      if (skinTypes) {
        matchStage['cosmetic_info.skinType'] = { $in: skinTypes.split(',').map(type => type.trim()) };
      }

      // Thêm filter vấn đề da
      if (concerns) {
        matchStage['cosmetic_info.concerns'] = { $in: concerns.split(',').map(concern => concern.trim()) };
      }

      // Thêm filter flags
      if (isBestSeller !== undefined) {
        const isBestSellerBool = typeof isBestSeller === 'string'
          ? isBestSeller === 'true'
          : Boolean(isBestSeller);
        matchStage['flags.isBestSeller'] = isBestSellerBool;
      }

      if (isNew !== undefined) {
        const isNewBool = typeof isNew === 'string'
          ? isNew === 'true'
          : Boolean(isNew);
        matchStage['flags.isNew'] = isNewBool;
      }

      if (isOnSale !== undefined) {
        const isOnSaleBool = typeof isOnSale === 'string'
          ? isOnSale === 'true'
          : Boolean(isOnSale);
        matchStage['flags.isOnSale'] = isOnSaleBool;
      }

      if (hasGifts !== undefined) {
        const hasGiftsBool = typeof hasGifts === 'string'
          ? hasGifts === 'true'
          : Boolean(hasGifts);
        matchStage['flags.hasGifts'] = hasGiftsBool;
      }

      // Thêm match stage vào pipeline nếu có ít nhất một điều kiện
      if (Object.keys(matchStage).length > 0) {
        pipeline.push({ $match: matchStage });
      }

      // Facet stage để thực hiện đồng thời đếm tổng và phân trang
      pipeline.push({
        $facet: {
          totalCount: [{ $count: 'count' }],
          paginatedResults: [
            { $sort: { [sortBy]: sortOrder === 'asc' ? 1 : -1 } },
            { $skip: skip },
            { $limit: +limit },
            // Lookup với brands
            {
              $lookup: {
                from: 'brands',
                localField: 'brandId',
                foreignField: '_id',
                as: 'brandInfo'
              }
            },
            // Lookup với categories
            {
              $lookup: {
                from: 'categories',
                localField: 'categoryIds',
                foreignField: '_id',
                as: 'categoryInfo'
              }
            },
            // Tính toán các trường bổ sung
            {
              $addFields: {
                totalStock: { $sum: '$inventory.quantity' },
                brandName: { $ifNull: [{ $arrayElemAt: ['$brandInfo.name', 0] }, ''] },
                categoryNames: '$categoryInfo.name',
                mainImage: {
                  $cond: {
                    if: { $gt: [{ $size: '$images' }, 0] },
                    then: {
                      $let: {
                        vars: {
                          primaryImage: {
                            $filter: {
                              input: '$images',
                              as: 'img',
                              cond: { $eq: ['$$img.isPrimary', true] }
                            }
                          }
                        },
                        in: {
                          $cond: {
                            if: { $gt: [{ $size: '$$primaryImage' }, 0] },
                            then: { $arrayElemAt: ['$$primaryImage.url', 0] },
                            else: { $arrayElemAt: ['$images.url', 0] }
                          }
                        }
                      }
                    },
                    else: ''
                  }
                }
              }
            }
          ]
        }
      });

      // Thực hiện truy vấn aggregation
      const result = await this.productModel.aggregate(pipeline);

      // Xử lý kết quả từ aggregation
      const totalItems = result[0].totalCount.length > 0 ? result[0].totalCount[0].count : 0;
      const totalPages = Math.ceil(totalItems / limit);
      const products = result[0].paginatedResults;

      // Log kết quả tìm kiếm để debug
      if (search) {
        this.logger.log(`findAllForAdmin: Kết quả tìm kiếm cho "${search}": Tìm thấy ${products.length} sản phẩm`);
        if (products.length > 0) {
          this.logger.log(`findAllForAdmin: Danh sách sản phẩm tìm thấy: ${products.map(p => p.name).join(', ')}`);
        } else {
          this.logger.log(`findAllForAdmin: Không tìm thấy sản phẩm nào với từ khóa "${search}"`);
        }
      }

      // Chuyển đổi kết quả sang định dạng phù hợp cho frontend
      const formattedProducts = products.map(product => {
        // Định dạng giá thành chuỗi
        const priceString = new Intl.NumberFormat('vi-VN').format(product.price) + 'đ';

        // Lấy tên danh mục đầu tiên hoặc chuỗi rỗng
        const category = product.categoryNames && product.categoryNames.length > 0
          ? product.categoryNames[0]
          : '';

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
          image: product.mainImage || '', // Giữ lại mainImage cho các mục đích hiển thị khác nếu cần
          images: product.images || [], // Trả về toàn bộ mảng images
          stock: product.totalStock || 0,
          status: product.status,
          description: product.description, // Thêm description đầy đủ
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
        total: totalItems,
        page: +page,
        limit: +limit,
        totalPages,
      };
    } catch (error) {
      this.logger.error(`Error in findAllForAdmin: ${error.message}`, error.stack);
      throw error;
    }
  }

  async findAllForExport(queryDto: QueryProductDto): Promise<any[]> {
    this.logger.log(`[findAllForExport] Received queryDto: ${JSON.stringify(queryDto)}`);
    try {
      this.logger.log('Bắt đầu lấy tất cả sản phẩm để xuất Excel');
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
        branchId: queryBranchId // Lấy branchId từ queryDto
      } = queryDto;

      const pipeline: PipelineStage[] = [];
      const matchStage: any = {};
      let objectIdQueryBranchId: Types.ObjectId | undefined = undefined;

      // Xử lý queryBranchId để sử dụng trong $project, không dùng để lọc sản phẩm ở matchStage
      if (queryBranchId && Types.ObjectId.isValid(queryBranchId)) {
        try {
          objectIdQueryBranchId = new Types.ObjectId(queryBranchId);
          this.logger.log(`[findAllForExport] Context branchId for stock calculation: ${queryBranchId}`);
        } catch (e) {
          this.logger.warn(`[findAllForExport] Error converting queryBranchId to ObjectId for stock calculation: ${queryBranchId}. Error: ${e.message}`);
          // objectIdQueryBranchId sẽ vẫn là undefined, tồn kho sẽ được tính tổng
        }
      } else if (queryBranchId) {
        this.logger.warn(`[findAllForExport] Invalid queryBranchId provided, will calculate total stock: ${queryBranchId}`);
      }

      if (search) {
        const processedSearch = search.trim();
        if (this.hasTextIndex) {
          matchStage.$text = { $search: processedSearch };
        } else {
          const regexSearch = processedSearch.replace(/_/g, '[_\\s]?');
          matchStage.$or = [
            { name: { $regex: regexSearch, $options: 'i' } },
            { sku: { $regex: regexSearch, $options: 'i' } },
            { slug: { $regex: regexSearch, $options: 'i' } },
            { tags: { $regex: regexSearch, $options: 'i' } },
            { 'description.short': { $regex: regexSearch, $options: 'i' } },
            { 'description.full': { $regex: regexSearch, $options: 'i' } },
          ];
        }
      }
      if (brandId) matchStage.brandId = new Types.ObjectId(brandId);
      if (categoryId) matchStage.categoryIds = new Types.ObjectId(categoryId);
      if (status) matchStage.status = status;
      if (minPrice !== undefined || maxPrice !== undefined) {
        matchStage.price = {};
        if (minPrice !== undefined) matchStage.price.$gte = Number(minPrice);
        if (maxPrice !== undefined) matchStage.price.$lte = Number(maxPrice);
      }
      if (tags) matchStage.tags = { $in: tags.split(',').map(tag => tag.trim()) };
      if (skinTypes) matchStage['cosmetic_info.skinType'] = { $in: skinTypes.split(',').map(type => type.trim()) };
      if (concerns) matchStage['cosmetic_info.concerns'] = { $in: concerns.split(',').map(concern => concern.trim()) };

      // Sửa lỗi TypeScript: Xử lý đúng kiểu cho các flag boolean
      if (isBestSeller !== undefined) {
        matchStage['flags.isBestSeller'] = typeof isBestSeller === 'string' ? isBestSeller === 'true' : Boolean(isBestSeller);
      }
      if (isNew !== undefined) {
        matchStage['flags.isNew'] = typeof isNew === 'string' ? isNew === 'true' : Boolean(isNew);
      }
      if (isOnSale !== undefined) {
        matchStage['flags.isOnSale'] = typeof isOnSale === 'string' ? isOnSale === 'true' : Boolean(isOnSale);
      }
      if (hasGifts !== undefined) {
        matchStage['flags.hasGifts'] = typeof hasGifts === 'string' ? hasGifts === 'true' : Boolean(hasGifts);
      }

      if (Object.keys(matchStage).length > 0) {
        pipeline.push({ $match: matchStage });
      }

      // Đơn giản hóa pipeline để test
      pipeline.push({ $sort: { [sortBy]: sortOrder === 'asc' ? 1 : -1 } });

      // Lookup để lấy thông tin category và brand với đầy đủ cây phân cấp
      pipeline.push(
        {
          $lookup: {
            from: 'categories', // Tên collection của categories
            localField: 'categoryIds',
            foreignField: '_id',
            as: 'directCategories'
          }
        },
        {
          // Lookup để lấy tất cả categories cha của category mà sản phẩm thuộc về
          $lookup: {
            from: 'categories',
            let: { productCategoryIds: '$categoryIds' },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $in: ['$_id', '$$productCategoryIds']
                  }
                }
              },
              {
                // Graphlookup để lấy tất cả categories cha
                $graphLookup: {
                  from: 'categories',
                  startWith: '$parentId',
                  connectFromField: 'parentId',
                  connectToField: '_id',
                  as: 'ancestors',
                  maxDepth: 10
                }
              },
              {
                $project: {
                  _id: 1,
                  name: 1,
                  level: 1,
                  parentId: 1,
                  ancestors: {
                    _id: 1,
                    name: 1,
                    level: 1,
                    parentId: 1
                  }
                }
              }
            ],
            as: 'categoryHierarchy'
          }
        },
        {
          $lookup: {
            from: 'brands', // Tên collection của brands
            localField: 'brandId',
            foreignField: '_id',
            as: 'brandInfo'
          }
        }
      );

      // Project các trường cần thiết cho 29 cột xuất Excel
      pipeline.push({
        $project: {
          _id: 0, // Loại bỏ _id nếu không cần thiết cho logic sau
          sku: 1,
          barcode: 1,
          name: 1,
          price: 1,
          currentPrice: 1,
          costPrice: 1,
          status: 1,
          description: 1, // Lấy description để xuất
          weightValue: 1, // Trọng lượng
          weightUnit: 1,  // Đơn vị trọng lượng
          loyaltyPoints: 1, // Tích điểm
          flags: 1, // Các flags như đang kinh doanh, được bán trực tiếp
          inventory: 1, // Mảng inventory thô
          images: 1,    // Mảng images thô
          brandInfo: 1, // Kết quả từ lookup brand
          categoryHierarchy: 1 // Lấy đầy đủ thông tin categories với cây phân cấp
        }
      });

      this.logger.log(`[findAllForExport] Pipeline to execute: ${JSON.stringify(pipeline)}`);
      const aggregatedProducts = await this.productModel.aggregate(pipeline).exec();
      this.logger.log(`Lấy được ${aggregatedProducts.length} sản phẩm thô từ aggregation.`);

      // Xử lý và định dạng dữ liệu cuối cùng với 29 cột theo đúng thứ tự
      const productsForExport = aggregatedProducts.map((p, index) => {
        // Log dữ liệu thô của một vài sản phẩm đầu và cuối để kiểm tra
        if (index < 2 || index === aggregatedProducts.length - 1) {
          this.logger.debug(`[findAllForExport] Raw aggregated product data (index ${index}): ${JSON.stringify(p)}`);
        }

        // 1. Loại hàng (Mặc định là "Hàng hoá")
        const loaiHang = 'Hàng hoá';

        // 2. Nhóm hàng (3 Cấp) - Xử lý categories theo cấu trúc phân cấp
        const nhomHang = this.buildHierarchicalCategoryPathFromHierarchy(p.categoryHierarchy);

        // 3. Mã hàng
        const maHang = (p.sku && String(p.sku).trim() !== '') ? String(p.sku).trim() : '';

        // 4. Mã vạch
        const maVach = (p.barcode && String(p.barcode).trim() !== '') ? String(p.barcode).trim() : '';

        // 5. Tên hàng
        const tenHang = (p.name && String(p.name).trim() !== '') ? String(p.name).trim() : '';

        // 6. Thương hiệu (Sửa lỗi: lấy từ brandInfo thay vì loại hàng)
        const thuongHieu = (p.brandInfo && Array.isArray(p.brandInfo) && p.brandInfo.length > 0 && p.brandInfo[0] && p.brandInfo[0].name && String(p.brandInfo[0].name).trim() !== '')
          ? String(p.brandInfo[0].name).trim()
          : '';

        // 7. Giá bán
        const giaBan = (p.currentPrice !== null && p.currentPrice !== undefined) ? Number(p.currentPrice) : (Number(p.price) || 0);

        // 8. Giá vốn
        const giaVon = Number(p.costPrice) || 0;

        // 9. Tồn kho (Lấy theo chi nhánh được chọn)
        let tonKho = 0;
        if (p.inventory && Array.isArray(p.inventory)) {
          if (objectIdQueryBranchId) {
            const branchInv = p.inventory.find((inv: any) => inv && inv.branchId && objectIdQueryBranchId.equals(inv.branchId));
            tonKho = branchInv ? (Number(branchInv.quantity) || 0) : 0;
          } else {
            tonKho = p.inventory.reduce((sum: number, inv: any) => sum + (Number(inv && inv.quantity) || 0), 0);
          }
        }

        // 10-13. KH đặt, Dự kiến hết hàng, Tồn nhỏ nhất, Tồn lớn nhất (Để trống)
        const khDat = '';
        const duKienHetHang = '';
        const tonNhoNhat = '';
        const tonLonNhat = '';

        // 14-16. Đơn vị tính, Mã ĐVT Cơ bản, Quy đổi (Để trống)
        const donViTinh = '';
        const maDVTCoBan = '';
        const quyDoi = '';

        // 17-18. Thuộc tính, Mã HH Liên quan (Để trống)
        const thuocTinh = '';
        const maHHLienQuan = '';

        // 19. Hình ảnh (Lấy tất cả URL, phân cách bằng dấu phẩy)
        let hinhAnh = '';
        if (p.images && Array.isArray(p.images) && p.images.length > 0) {
          const imageUrls = p.images
            .filter((img: any) => img && img.url && String(img.url).trim() !== '')
            .map((img: any) => String(img.url).trim());
          hinhAnh = imageUrls.join(', ');
        }

        // 20. Trọng lượng
        const trongLuong = p.weightValue ? `${p.weightValue}${p.weightUnit || ''}` : '';

        // 21. Tích điểm
        const tichDiem = Number(p.loyaltyPoints) || 0;

        // 22. Đang kinh doanh (Dựa vào status)
        const dangKinhDoanh = p.status === 'active' ? 'Có' : 'Không';

        // 23. Được bán trực tiếp (Để trống hoặc dựa vào flags)
        const duocBanTrucTiep = '';

        // 24. Mô tả (Lấy từ description.full)
        const moTa = (p.description && p.description.full && String(p.description.full).trim() !== '')
          ? String(p.description.full).trim()
          : '';

        // 25-29. Mẫu ghi chú, Vị trí, Hàng thành phần, Bảo hành, Bảo trì định kỳ (Để trống)
        const mauGhiChu = '';
        const viTri = '';
        const hangThanhPhan = '';
        const baoHanh = '';
        const baoTriDinhKy = '';

        const productForExport = {
          'Loại hàng': loaiHang,
          'Nhóm hàng (3 Cấp)': nhomHang,
          'Mã hàng': maHang,
          'Mã vạch': maVach,
          'Tên hàng': tenHang,
          'Thương hiệu': thuongHieu,
          'Giá bán': giaBan,
          'Giá vốn': giaVon,
          'Tồn kho': tonKho,
          'KH đặt': khDat,
          'Dự kiến hết hàng': duKienHetHang,
          'Tồn nhỏ nhất': tonNhoNhat,
          'Tồn lớn nhất': tonLonNhat,
          'Đơn vị tính (ĐVT)': donViTinh,
          'Mã ĐVT Cơ bản': maDVTCoBan,
          'Quy đổi': quyDoi,
          'Thuộc tính': thuocTinh,
          'Mã HH Liên quan': maHHLienQuan,
          'Hình ảnh': hinhAnh,
          'Trọng lượng': trongLuong,
          'Tích điểm': tichDiem,
          'Đang kinh doanh': dangKinhDoanh,
          'Được bán trực tiếp': duocBanTrucTiep,
          'Mô tả': moTa,
          'Mẫu ghi chú': mauGhiChu,
          'Vị trí': viTri,
          'Hàng thành phần': hangThanhPhan,
          'Bảo hành': baoHanh,
          'Bảo trì định kỳ': baoTriDinhKy
        };

        // Log dữ liệu đã map của một vài sản phẩm đầu và cuối
        if (index < 2 || index === aggregatedProducts.length - 1) {
            this.logger.debug(`[findAllForExport] Mapped product data for export (index ${index}): ${JSON.stringify(productForExport)}`);
        }

        return productForExport;
      });

      return productsForExport;

    } catch (error) {
      this.logger.error(`[findAllForExport] Lỗi nghiêm trọng khi lấy tất cả sản phẩm để xuất: ${error.message}`, error.stack);
      // Log thêm chi tiết lỗi nếu có
      if (error.cause) {
        this.logger.error(`[findAllForExport] Nguyên nhân lỗi: ${JSON.stringify(error.cause)}`);
      }
      throw error; // Ném lại lỗi để controller hoặc NestJS xử lý
    }
  }

  // Public method to add an image and return updated DTO
  async addImageToProduct(productId: string, imageObj: { url: string; alt: string; publicId: string; isPrimary: boolean }): Promise<ProductResponseDto> {
    try {
      const productDoc = await this.productModel.findById(productId);
      if (!productDoc) {
        throw new NotFoundException(`Product not found with ID: ${productId} when trying to add image`);
      }

      const images = productDoc.images || [];
      if (imageObj.isPrimary) {
        images.forEach(img => { img.isPrimary = false; });
      }
      images.push(imageObj);
      productDoc.images = images; // Assign the updated array back

      const savedProduct = await productDoc.save();
      this.logger.log(`Image added and product saved successfully for ID: ${productId}`);
      // Use the private mapper method within the service
      return this.mapProductToResponseDto(savedProduct.toObject());
    } catch (error) {
      this.logger.error(`Error adding image to product ID ${productId}: ${error.message}`, error.stack);
      throw error; // Rethrow the error to be handled by the controller
    }
  }

  // Helper method to map a product document to a response DTO
  // Keep this private as it's an internal helper
  private mapProductToResponseDto(product: any): ProductResponseDto {
    // Ensure _id exists before trying to convert it
    const idString = product._id ? product._id.toString() : undefined;

    return {
      ...product,
      _id: idString, // Use the converted string ID
      id: idString, // Also add 'id' field for consistency if needed by frontend
      // Removed duplicate _id: product._id.toString()
      brandId: product.brandId ? product.brandId.toString() : undefined,
      categoryIds: product.categoryIds ? product.categoryIds.map(id => id.toString()) : [],
      variants: product.variants ? product.variants.map(variant => ({
        ...variant,
        variantId: variant.variantId ? variant.variantId.toString() : undefined
      })) : [],
      inventory: product.inventory ? product.inventory.map(inv => ({
        ...inv,
        branchId: inv.branchId ? inv.branchId.toString() : undefined
      })) : [],
      relatedProducts: product.relatedProducts ? product.relatedProducts.map(id => id.toString()) : [],
      relatedEvents: product.relatedEvents ? product.relatedEvents.map(id => id.toString()) : [],
      relatedCampaigns: product.relatedCampaigns ? product.relatedCampaigns.map(id => id.toString()) : [],
    };
  }

  // Phương thức dọn dẹp dữ liệu base64 trong database
  async cleanupBase64Images(): Promise<{ success: boolean; message: string; count: number }> {
    try {
      this.logger.log('Bắt đầu quá trình dọn dẹp dữ liệu base64 trong database');

      // Tìm tất cả sản phẩm có hình ảnh dạng base64
      const products = await this.productModel.find({
        $or: [
          { 'images.url': { $regex: '^data:image' } },
          { 'variants.images.url': { $regex: '^data:image' } }
        ]
      }).exec();

      if (!products || products.length === 0) {
        this.logger.log('Không tìm thấy sản phẩm nào có hình ảnh dạng base64');
        return {
          success: true,
          message: 'Không tìm thấy sản phẩm nào có hình ảnh dạng base64',
          count: 0
        };
      }

      this.logger.log(`Tìm thấy ${products.length} sản phẩm có hình ảnh dạng base64. Tiến hành dọn dẹp...`);
      let processedCount = 0;

      for (const product of products) {
        let needsUpdate = false;

        // Dọn dẹp hình ảnh sản phẩm
        if (product.images && product.images.length > 0) {
          const originalImageCount = product.images.length;
          product.images = product.images.filter(img => !img.url || !img.url.startsWith('data:image'));

          if (originalImageCount !== product.images.length) {
            this.logger.log(`Đã loại bỏ ${originalImageCount - product.images.length} hình ảnh base64 từ sản phẩm ID: ${product._id}`);
            needsUpdate = true;
          }
        }

        // Dọn dẹp hình ảnh biến thể
        if (product.variants && product.variants.length > 0) {
          for (let i = 0; i < product.variants.length; i++) {
            if (product.variants[i].images && product.variants[i].images.length > 0) {
              const originalVariantImageCount = product.variants[i].images.length;
              product.variants[i].images = product.variants[i].images.filter(img => !img.url || !img.url.startsWith('data:image'));

              if (originalVariantImageCount !== product.variants[i].images.length) {
                this.logger.log(`Đã loại bỏ ${originalVariantImageCount - product.variants[i].images.length} hình ảnh base64 từ biến thể của sản phẩm ID: ${product._id}`);
                needsUpdate = true;
              }
            }
          }
        }

        // Lưu lại sản phẩm nếu có thay đổi
        if (needsUpdate) {
          await product.save();
          processedCount++;
        }
      }

      return {
        success: true,
        message: `Đã dọn dẹp thành công dữ liệu base64 trong ${processedCount} sản phẩm`,
        count: processedCount
      };
    } catch (error) {
      this.logger.error(`Lỗi khi dọn dẹp dữ liệu base64: ${error.message}`, error.stack);
      throw new Error(`Lỗi khi dọn dẹp dữ liệu base64: ${error.message}`);
    }
  }

  /**
   * Tạo bản sao của sản phẩm
   * @param id ID của sản phẩm cần nhân bản
   * @returns Bản sao sản phẩm đã được tạo
   */
  async cloneProduct(id: string): Promise<ProductResponseDto> {
    try {
      // Tìm sản phẩm gốc
      const originalProduct = await this.productModel.findById(id);
      if (!originalProduct) {
        throw new NotFoundException(`Không tìm thấy sản phẩm với ID ${id}`);
      }

      // Tạo bản sao của sản phẩm
      const productObj = originalProduct.toObject();

      // Tạo đối tượng mới, bỏ qua các trường không cần thiết/không thể sao chép
      const productToClone: any = {
        name: `${productObj.name} (Bản sao)`,
        sku: `${productObj.sku}_copy_${Date.now().toString().slice(-4)}`,
        slug: `${productObj.slug}-copy-${Date.now().toString().slice(-4)}`,
        price: productObj.price,
        currentPrice: productObj.currentPrice,
        status: productObj.status,
        brandId: productObj.brandId,
        categoryIds: productObj.categoryIds,
        tags: productObj.tags,
        description: productObj.description,
        seo: productObj.seo,
        cosmetic_info: productObj.cosmetic_info,
        flags: productObj.flags,
        inventory: productObj.inventory,
        images: productObj.images,
        gifts: productObj.gifts,
        relatedProducts: productObj.relatedProducts,
        relatedEvents: productObj.relatedEvents,
        relatedCampaigns: productObj.relatedCampaigns,
      };

      // Xử lý các biến thể (nếu có)
      if (productObj.variants && productObj.variants.length > 0) {
        productToClone.variants = productObj.variants.map(variant => {
          // Tạo biến thể mới mà không có variantId
          const { variantId, ...variantWithoutId } = variant;

          // Tạo SKU mới cho biến thể và tạo variantId mới
          return {
            ...variantWithoutId,
            variantId: new Types.ObjectId(), // Tạo ID mới cho biến thể
            sku: `${variant.sku}_copy_${Date.now().toString().slice(-4)}`
          };
        });
      }

      // Tạo sản phẩm mới từ bản sao
      const newProduct = new this.productModel(productToClone);
      const savedProduct = await newProduct.save();

      this.logger.log(`Sản phẩm đã được nhân bản thành công: ${savedProduct.id}`);
      return this.mapProductToResponseDto(savedProduct);
    } catch (error) {
      this.logger.error(`Lỗi khi nhân bản sản phẩm: ${error.message}`, error.stack);
      throw error;
    }
  }

  // Phương thức kiểm tra sản phẩm có trong Event hoặc Campaign nào không
  async checkProductsInPromotions(productIds: string[]): Promise<ProductPromotionCheckDto[]> {
    try {
      this.logger.log(`Kiểm tra ${productIds.length} sản phẩm trong Event và Campaign`);

      // Chuyển đổi productIds thành ObjectId
      const productObjectIds = productIds.map(id => {
        try {
          return new Types.ObjectId(id);
        } catch (error) {
          this.logger.warn(`ID sản phẩm không hợp lệ: ${id}`);
          return id; // Giữ nguyên ID nếu không chuyển đổi được
        }
      });

      // Lấy tất cả Event đang hoạt động
      const activeEvents = await this.eventsService.findActive();

      // Lấy tất cả Campaign đang hoạt động
      const activeCampaigns = await this.campaignsService.getActiveCampaigns();

      // Tạo map để lưu thông tin Event chứa sản phẩm
      const productEventMap = new Map<string, { eventId: string; eventName: string }>();

      // Kiểm tra sản phẩm trong Event
      activeEvents.forEach(event => {
        if (event && event.products) {
          event.products.forEach(product => {
            if (product && product.productId) {
              const productIdStr = product.productId.toString();
              if (event._id) {
                productEventMap.set(productIdStr, {
                  eventId: event._id.toString(),
                  eventName: event.title || 'Không có tên'
                });
              }
            }
          });
        }
      });

      // Tạo map để lưu thông tin Campaign chứa sản phẩm
      const productCampaignMap = new Map<string, { campaignId: string; campaignName: string }>();

      // Kiểm tra sản phẩm trong Campaign
      activeCampaigns.forEach(campaign => {
        if (campaign && campaign.products) {
          campaign.products.forEach(product => {
            if (product && product.productId) {
              const productIdStr = product.productId.toString();
              // Sử dụng id thay vì _id cho Campaign
              if (campaign._id) {
                productCampaignMap.set(productIdStr, {
                  campaignId: campaign._id.toString(),
                  campaignName: campaign.title || 'Không có tên'
                });
              }
            }
          });
        }
      });

      // Tạo kết quả
      const result: ProductPromotionCheckDto[] = productIds.map(productId => {
        const inEvent = productEventMap.has(productId);
        const inCampaign = productCampaignMap.has(productId);

        return {
          productId,
          inEvent,
          eventId: inEvent && productEventMap.get(productId) ? productEventMap.get(productId)!.eventId : undefined,
          eventName: inEvent && productEventMap.get(productId) ? productEventMap.get(productId)!.eventName : undefined,
          inCampaign,
          campaignId: inCampaign && productCampaignMap.get(productId) ? productCampaignMap.get(productId)!.campaignId : undefined,
          campaignName: inCampaign && productCampaignMap.get(productId) ? productCampaignMap.get(productId)!.campaignName : undefined
        };
      });

      return result;
    } catch (error) {
      this.logger.error(`Lỗi khi kiểm tra sản phẩm trong Event và Campaign: ${error.message}`, error.stack);
      throw error;
    }
  }

  // Phương thức để xóa chi nhánh khỏi tất cả các sản phẩm
  async removeBranchFromProducts(branchId: string): Promise<{ success: boolean; count: number }> {
    try {
      const branchObjectId = new Types.ObjectId(branchId);
      this.logger.log(`[RemoveBranch] Starting removal process for branch ID: ${branchId}`);

      // Tìm tất cả sản phẩm có tham chiếu đến chi nhánh này trong inventory, variantInventory, hoặc combinationInventory
      // Thử cả ObjectId và string vì có thể branchId được lưu dưới dạng string
      const products = await this.productModel.find({
        $or: [
          { 'inventory.branchId': branchObjectId },
          { 'inventory.branchId': branchId }, // Thử string
          { 'variantInventory.branchId': branchObjectId },
          { 'variantInventory.branchId': branchId }, // Thử string
          { 'combinationInventory.branchId': branchObjectId },
          { 'combinationInventory.branchId': branchId } // Thử string
        ]
      });

      let count = 0;
      let totalInventoryRemoved = 0;
      let totalVariantInventoryRemoved = 0;
      let totalCombinationInventoryRemoved = 0;

      this.logger.log(`[RemoveBranch] Found ${products.length} products referencing branch ID: ${branchId}`);

      // Xử lý từng sản phẩm
      for (const product of products) {
        let productModified = false;
        const productId = (product._id as any).toString();

        this.logger.log(`[RemoveBranch] Processing product ${productId} (SKU: ${product.sku})`);

        // Lọc bỏ chi nhánh khỏi inventory (sản phẩm thông thường)
        if (Array.isArray(product.inventory) && product.inventory.length > 0) {
          const initialInventoryCount = product.inventory.length;
          const removedInventory = product.inventory.filter(
            inv => inv.branchId && (inv.branchId.toString() === branchId || (inv.branchId as any) === branchId)
          );

          product.inventory = product.inventory.filter(
            inv => inv.branchId && inv.branchId.toString() !== branchId
          );

          if (product.inventory.length !== initialInventoryCount) {
            productModified = true;
            totalInventoryRemoved += removedInventory.length;
            this.logger.log(`[RemoveBranch] Removed ${removedInventory.length} inventory entries from product ${productId}`);
            removedInventory.forEach(inv => {
              this.logger.log(`[RemoveBranch] - Removed inventory: branchId=${inv.branchId}, quantity=${inv.quantity}`);
            });
          }
        } else {
          product.inventory = []; // Đảm bảo inventory là mảng nếu nó null/undefined
        }

        // Lọc bỏ chi nhánh khỏi variantInventory (biến thể đơn lẻ)
        if (Array.isArray(product.variantInventory) && product.variantInventory.length > 0) {
          const initialVariantInventoryCount = product.variantInventory.length;
          const removedVariantInventory = product.variantInventory.filter(
            inv => inv.branchId && (inv.branchId.toString() === branchId || (inv.branchId as any) === branchId)
          );

          product.variantInventory = product.variantInventory.filter(
            inv => inv.branchId && inv.branchId.toString() !== branchId
          );

          if (product.variantInventory.length !== initialVariantInventoryCount) {
            productModified = true;
            totalVariantInventoryRemoved += removedVariantInventory.length;
            this.logger.log(`[RemoveBranch] Removed ${removedVariantInventory.length} variant inventory entries from product ${productId}`);
            removedVariantInventory.forEach(inv => {
              this.logger.log(`[RemoveBranch] - Removed variant inventory: branchId=${inv.branchId}, variantId=${inv.variantId}, quantity=${inv.quantity}`);
            });
          }
        } else {
          product.variantInventory = []; // Đảm bảo variantInventory là mảng
        }

        // Lọc bỏ chi nhánh khỏi combinationInventory (biến thể kết hợp)
        if (Array.isArray(product.combinationInventory) && product.combinationInventory.length > 0) {
          const initialCombinationInventoryCount = product.combinationInventory.length;
          const removedCombinationInventory = product.combinationInventory.filter(
            inv => inv.branchId && (inv.branchId.toString() === branchId || (inv.branchId as any) === branchId)
          );

          product.combinationInventory = product.combinationInventory.filter(
            inv => inv.branchId && inv.branchId.toString() !== branchId
          );

          if (product.combinationInventory.length !== initialCombinationInventoryCount) {
            productModified = true;
            totalCombinationInventoryRemoved += removedCombinationInventory.length;
            this.logger.log(`[RemoveBranch] Removed ${removedCombinationInventory.length} combination inventory entries from product ${productId}`);
            removedCombinationInventory.forEach(inv => {
              this.logger.log(`[RemoveBranch] - Removed combination inventory: branchId=${inv.branchId}, variantId=${inv.variantId}, combinationId=${inv.combinationId}, quantity=${inv.quantity}`);
            });
          }
        } else {
          product.combinationInventory = []; // Đảm bảo combinationInventory là mảng
        }

        // Nếu có sự thay đổi, tính toán lại tổng tồn kho và cập nhật trạng thái
        if (productModified) {
          // Tính tổng tồn kho từ inventory (tồn kho chính của sản phẩm)
          const totalProductInventory = (product.inventory || []).reduce(
            (sum, inv) => sum + (inv.quantity || 0),
            0
          );

          // Tính tổng tồn kho từ variantInventory (nếu sản phẩm có biến thể)
          const totalVariantInventory = (product.variantInventory || []).reduce(
            (sum, inv) => sum + (inv.quantity || 0),
            0
          );

          // Tính tổng tồn kho từ combinationInventory (biến thể kết hợp)
          const totalCombinationInventory = (product.combinationInventory || []).reduce(
            (sum, inv) => sum + (inv.quantity || 0),
            0
          );

          let finalTotalInventory = 0;
          if (Array.isArray(product.variants) && product.variants.length > 0) {
            // Nếu có biến thể, tổng tồn kho dựa trên variantInventory + combinationInventory
            finalTotalInventory = totalVariantInventory + totalCombinationInventory;
          } else {
            // Nếu không có biến thể, tổng tồn kho dựa trên inventory chính
            finalTotalInventory = totalProductInventory;
          }

          this.logger.log(`[RemoveBranch] Product ${productId} inventory summary:`);
          this.logger.log(`[RemoveBranch] - Product inventory: ${totalProductInventory}`);
          this.logger.log(`[RemoveBranch] - Variant inventory: ${totalVariantInventory}`);
          this.logger.log(`[RemoveBranch] - Combination inventory: ${totalCombinationInventory}`);
          this.logger.log(`[RemoveBranch] - Final total inventory: ${finalTotalInventory}`);

          // Cập nhật trạng thái sản phẩm dựa trên tổng tồn kho
          const oldStatus = product.status;
          if (finalTotalInventory === 0 && product.status !== 'discontinued') {
            product.status = 'out_of_stock';
            this.logger.log(`[RemoveBranch] Product ${productId} status updated from '${oldStatus}' to 'out_of_stock' (total inventory = 0)`);
          } else if (finalTotalInventory > 0 && product.status === 'out_of_stock') {
            product.status = 'active';
            this.logger.log(`[RemoveBranch] Product ${productId} status updated from '${oldStatus}' to 'active' (total inventory = ${finalTotalInventory})`);
          } else {
            this.logger.log(`[RemoveBranch] Product ${productId} status remains '${product.status}' (total inventory = ${finalTotalInventory})`);
          }

          // Lưu sản phẩm
          await product.save();
          count++;
          this.logger.log(`[RemoveBranch] Product ${productId} saved successfully`);
        } else {
          this.logger.log(`[RemoveBranch] Product ${productId} had no inventory for branch ${branchId}, skipping`);
        }
      }

      this.logger.log(`[RemoveBranch] Branch removal completed successfully:`);
      this.logger.log(`[RemoveBranch] - Products processed: ${count}`);
      this.logger.log(`[RemoveBranch] - Regular inventory entries removed: ${totalInventoryRemoved}`);
      this.logger.log(`[RemoveBranch] - Variant inventory entries removed: ${totalVariantInventoryRemoved}`);
      this.logger.log(`[RemoveBranch] - Combination inventory entries removed: ${totalCombinationInventoryRemoved}`);
      this.logger.log(`[RemoveBranch] - Total inventory entries removed: ${totalInventoryRemoved + totalVariantInventoryRemoved + totalCombinationInventoryRemoved}`);

      return {
        success: true,
        count
      };
    } catch (error) {
      this.logger.error(`[RemoveBranch] Error removing branch from products: ${error.message}`, error.stack);
      throw error;
    }
  }

  // Phương thức để kiểm tra có bao nhiêu sản phẩm tham chiếu đến một chi nhánh
  async countProductsReferencingBranch(branchId: string): Promise<number> {
    try {
      const branchObjectId = new Types.ObjectId(branchId);

      this.logger.log(`[CountProductsReferencingBranch] Checking products for branch ID: ${branchId}`);

      // Debug: Kiểm tra tổng số sản phẩm
      const totalProducts = await this.productModel.countDocuments({});
      this.logger.log(`[CountProductsReferencingBranch] Total products in database: ${totalProducts}`);

      // Debug: Kiểm tra sản phẩm có inventory
      const productsWithInventory = await this.productModel.countDocuments({
        $or: [
          { 'inventory.0': { $exists: true } },
          { 'variantInventory.0': { $exists: true } },
          { 'combinationInventory.0': { $exists: true } }
        ]
      });
      this.logger.log(`[CountProductsReferencingBranch] Products with any inventory: ${productsWithInventory}`);

      // Debug: Lấy một vài sản phẩm mẫu để kiểm tra cấu trúc
      const sampleProducts = await this.productModel.find({
        $or: [
          { 'inventory.0': { $exists: true } },
          { 'variantInventory.0': { $exists: true } },
          { 'combinationInventory.0': { $exists: true } }
        ]
      }).limit(3).select('sku name inventory variantInventory combinationInventory').lean();

      this.logger.log(`[CountProductsReferencingBranch] Sample products with inventory:`, JSON.stringify(sampleProducts, null, 2));

      // Đếm sản phẩm tham chiếu đến chi nhánh cụ thể
      // Thử cả ObjectId và string vì có thể branchId được lưu dưới dạng string
      const count = await this.productModel.countDocuments({
        $or: [
          { 'inventory.branchId': branchObjectId },
          { 'inventory.branchId': branchId }, // Thử string
          { 'variantInventory.branchId': branchObjectId },
          { 'variantInventory.branchId': branchId }, // Thử string
          { 'combinationInventory.branchId': branchObjectId },
          { 'combinationInventory.branchId': branchId } // Thử string
        ]
      });

      this.logger.log(`[CountProductsReferencingBranch] Products referencing branch ${branchId}: ${count}`);

      // Debug: Kiểm tra chi tiết các sản phẩm tham chiếu
      if (count > 0) {
        const referencingProducts = await this.productModel.find({
          $or: [
            { 'inventory.branchId': branchObjectId },
            { 'inventory.branchId': branchId }, // Thử string
            { 'variantInventory.branchId': branchObjectId },
            { 'variantInventory.branchId': branchId }, // Thử string
            { 'combinationInventory.branchId': branchObjectId },
            { 'combinationInventory.branchId': branchId } // Thử string
          ]
        }).select('sku name inventory variantInventory combinationInventory').lean();

        this.logger.log(`[CountProductsReferencingBranch] Products referencing branch ${branchId}:`, JSON.stringify(referencingProducts, null, 2));
      }

      return count;
    } catch (error) {
      this.logger.error(`Error counting products with branch reference: ${error.message}`, error.stack);
      throw error;
    }
  }

  // Phương thức để dọn dẹp dữ liệu rác - xóa tất cả inventory tham chiếu đến branch không tồn tại
  async cleanupOrphanedInventory(): Promise<{ success: boolean; cleaned: number; details: any }> {
    try {
      this.logger.log(`[CleanupInventory] Starting cleanup of orphaned inventory data`);

      // Lấy danh sách tất cả branch IDs hiện có
      const existingBranches = await this.branchModel.find({}, { _id: 1 }).lean();
      const existingBranchIds = existingBranches.map(branch => branch._id.toString());

      this.logger.log(`[CleanupInventory] Found ${existingBranchIds.length} existing branches`);

      // Tìm tất cả sản phẩm có inventory
      const products = await this.productModel.find({
        $or: [
          { 'inventory.0': { $exists: true } },
          { 'variantInventory.0': { $exists: true } },
          { 'combinationInventory.0': { $exists: true } }
        ]
      });

      let totalCleaned = 0;
      let productsCleaned = 0;
      const cleanupDetails = {
        regularInventory: 0,
        variantInventory: 0,
        combinationInventory: 0
      };

      this.logger.log(`[CleanupInventory] Found ${products.length} products with inventory to check`);

      for (const product of products) {
        let productModified = false;
        const productId = (product._id as any).toString();

        // Dọn dẹp regular inventory
        if (Array.isArray(product.inventory) && product.inventory.length > 0) {
          const initialCount = product.inventory.length;
          product.inventory = product.inventory.filter(inv => {
            const branchIdStr = inv.branchId ? inv.branchId.toString() : null;
            return branchIdStr && existingBranchIds.includes(branchIdStr);
          });

          const removedCount = initialCount - product.inventory.length;
          if (removedCount > 0) {
            productModified = true;
            cleanupDetails.regularInventory += removedCount;
            this.logger.log(`[CleanupInventory] Removed ${removedCount} orphaned regular inventory entries from product ${productId}`);
          }
        }

        // Dọn dẹp variant inventory
        if (Array.isArray(product.variantInventory) && product.variantInventory.length > 0) {
          const initialCount = product.variantInventory.length;
          product.variantInventory = product.variantInventory.filter(inv => {
            const branchIdStr = inv.branchId ? inv.branchId.toString() : null;
            return branchIdStr && existingBranchIds.includes(branchIdStr);
          });

          const removedCount = initialCount - product.variantInventory.length;
          if (removedCount > 0) {
            productModified = true;
            cleanupDetails.variantInventory += removedCount;
            this.logger.log(`[CleanupInventory] Removed ${removedCount} orphaned variant inventory entries from product ${productId}`);
          }
        }

        // Dọn dẹp combination inventory
        if (Array.isArray(product.combinationInventory) && product.combinationInventory.length > 0) {
          const initialCount = product.combinationInventory.length;
          product.combinationInventory = product.combinationInventory.filter(inv => {
            const branchIdStr = inv.branchId ? inv.branchId.toString() : null;
            return branchIdStr && existingBranchIds.includes(branchIdStr);
          });

          const removedCount = initialCount - product.combinationInventory.length;
          if (removedCount > 0) {
            productModified = true;
            cleanupDetails.combinationInventory += removedCount;
            this.logger.log(`[CleanupInventory] Removed ${removedCount} orphaned combination inventory entries from product ${productId}`);
          }
        }

        // Lưu sản phẩm nếu có thay đổi
        if (productModified) {
          await product.save();
          productsCleaned++;

          // Tính toán lại tổng tồn kho và cập nhật trạng thái
          const totalProductInventory = (product.inventory || []).reduce((sum, inv) => sum + (inv.quantity || 0), 0);
          const totalVariantInventory = (product.variantInventory || []).reduce((sum, inv) => sum + (inv.quantity || 0), 0);
          const totalCombinationInventory = (product.combinationInventory || []).reduce((sum, inv) => sum + (inv.quantity || 0), 0);

          let finalTotalInventory = 0;
          if (Array.isArray(product.variants) && product.variants.length > 0) {
            finalTotalInventory = totalVariantInventory + totalCombinationInventory;
          } else {
            finalTotalInventory = totalProductInventory;
          }

          // Cập nhật trạng thái nếu cần
          const oldStatus = product.status;
          if (finalTotalInventory === 0 && product.status !== 'discontinued') {
            product.status = 'out_of_stock';
            await product.save();
            this.logger.log(`[CleanupInventory] Product ${productId} status updated from '${oldStatus}' to 'out_of_stock' after cleanup`);
          } else if (finalTotalInventory > 0 && product.status === 'out_of_stock') {
            product.status = 'active';
            await product.save();
            this.logger.log(`[CleanupInventory] Product ${productId} status updated from '${oldStatus}' to 'active' after cleanup`);
          }
        }
      }

      totalCleaned = cleanupDetails.regularInventory + cleanupDetails.variantInventory + cleanupDetails.combinationInventory;

      this.logger.log(`[CleanupInventory] Cleanup completed successfully:`);
      this.logger.log(`[CleanupInventory] - Products cleaned: ${productsCleaned}`);
      this.logger.log(`[CleanupInventory] - Regular inventory entries removed: ${cleanupDetails.regularInventory}`);
      this.logger.log(`[CleanupInventory] - Variant inventory entries removed: ${cleanupDetails.variantInventory}`);
      this.logger.log(`[CleanupInventory] - Combination inventory entries removed: ${cleanupDetails.combinationInventory}`);
      this.logger.log(`[CleanupInventory] - Total inventory entries removed: ${totalCleaned}`);

      return {
        success: true,
        cleaned: totalCleaned,
        details: {
          productsCleaned,
          ...cleanupDetails
        }
      };
    } catch (error) {
      this.logger.error(`[CleanupInventory] Error during cleanup: ${error.message}`, error.stack);
      throw error;
    }
  }

  // Phương thức để lấy tất cả các loại da duy nhất có trong sản phẩm
  async getSkinTypes(): Promise<{ skinTypes: string[] }> {
    try {
      this.logger.log('Bắt đầu lấy danh sách loại da duy nhất');
      const result = await this.productModel.aggregate([
        // Chỉ lấy các sản phẩm có trường cosmetic_info.skinType tồn tại và là mảng
        { $match: { 'cosmetic_info.skinType': { $exists: true, $ne: null, $not: { $size: 0 } } } },
        // Tách mảng skinType thành các document riêng lẻ
        { $unwind: '$cosmetic_info.skinType' },
        // Nhóm theo giá trị skinType để lấy các giá trị duy nhất
        { $group: { _id: '$cosmetic_info.skinType' } },
        // Sắp xếp theo alphabet
        { $sort: { _id: 1 } },
        // Chỉ lấy trường _id (chứa tên loại da)
        { $project: { _id: 0, skinType: '$_id' } }
      ]);

      const skinTypes = result.map(item => item.skinType);
      this.logger.log(`Tìm thấy ${skinTypes.length} loại da duy nhất: ${JSON.stringify(skinTypes)}`);

      return { skinTypes };
    } catch (error) {
      this.logger.error(`Lỗi khi lấy danh sách loại da: ${error.message}`, error.stack);
      throw error;
    }
  }

  // Phương thức để lấy tất cả các vấn đề da duy nhất có trong sản phẩm
  async getConcerns(): Promise<{ concerns: string[] }> {
    try {
      this.logger.log('Bắt đầu lấy danh sách vấn đề da duy nhất');
      const result = await this.productModel.aggregate([
        // Chỉ lấy các sản phẩm có trường cosmetic_info.concerns tồn tại và là mảng
        { $match: { 'cosmetic_info.concerns': { $exists: true, $ne: null, $not: { $size: 0 } } } },
        // Tách mảng concerns thành các document riêng lẻ
        { $unwind: '$cosmetic_info.concerns' },
        // Nhóm theo giá trị concern để lấy các giá trị duy nhất
        { $group: { _id: '$cosmetic_info.concerns' } },
        // Sắp xếp theo alphabet
        { $sort: { _id: 1 } },
        // Chỉ lấy trường _id (chứa tên vấn đề da)
        { $project: { _id: 0, concern: '$_id' } }
      ]);

      const concerns = result.map(item => item.concern);
      this.logger.log(`Tìm thấy ${concerns.length} vấn đề da duy nhất: ${JSON.stringify(concerns)}`);

      return { concerns };
    } catch (error) {
      this.logger.error(`Lỗi khi lấy danh sách vấn đề da: ${error.message}`, error.stack);
      throw error;
    }
  }

  async importProductsFromExcel(file: Express.Multer.File, branchId: string, userId: string): Promise<{ taskId: string }> {
    const task = this.tasksService.createImportTask(userId);
    this.logger.log(`Starting product import task: ${task.id} for user ${userId}`);

    // Không await ở đây để chạy tác vụ trong nền
    this.processImportFile(file, branchId, task.id, userId).catch(err => {
      this.logger.error(`Lỗi nghiêm trọng trong quá trình import tác vụ ${task.id}: ${err.message}`, err.stack);
      this.tasksService.updateImportTask(task.id, {
        status: 'failed',
        message: `Lỗi hệ thống: ${err.message}`,
      });
    });

    return { taskId: task.id };
  }

  private async processImportFile(file: Express.Multer.File, branchId: string, taskId: string, userId: string): Promise<void> {
    // 🔥 TIMEOUT PROTECTION: Đặt timeout cho toàn bộ quá trình import
    const importStartTime = Date.now();
    const MAX_IMPORT_TIME = 15 * 60 * 1000; // 15 phút cho file lớn

    try {
      this.logger.log(`[Task:${taskId}] Bắt đầu import sản phẩm từ file Excel cho người dùng ${userId}: ${file.originalname}`);

      if (!file || (!file.buffer && !file.path)) {
        throw new BadRequestException('File Excel trống hoặc không hợp lệ');
      }

      if (!branchId) {
        throw new BadRequestException('Yêu cầu chọn chi nhánh để import tồn kho');
      }

      this.logger.log(`Chi nhánh đã chọn cho import: ${branchId}`);

      if (!/^[0-9a-fA-F]{24}$/.test(branchId)) {
        throw new BadRequestException('ID chi nhánh không hợp lệ. Vui lòng chọn chi nhánh khác.');
      }

      this.emitImportProgress(taskId, userId, 0, 'reading', 'Bắt đầu đọc file Excel...');

      let workbook;
      try {
        // Nếu có file.path (đã lưu trên đĩa), đọc từ đĩa
        if (file.path) {
          this.logger.log(`Đọc file Excel từ đường dẫn: ${file.path}`);
          // Thiết lập tùy chọn đọc file Excel
          const readOptions = {
            cellFormula: false,  // Không xử lý công thức
            cellHTML: false,     // Không xử lý HTML
            cellText: false,     // Không xử lý text chuẩn
            cellDates: true,     // Cho phép chuyển đổi ngày tháng đúng
            cellStyles: false,   // Không quan tâm đến style
            dateNF: 'yyyy-mm-dd', // Định dạng ngày tháng
            WTF: true,           // Cho phép ghi log lỗi chi tiết trong quá trình đọc
            type: 'binary' as const,      // Đọc dưới dạng binary
            raw: true,           // Lấy giá trị thô
            cellNF: false,       // Không quan tâm đến định dạng số
            sheets: 0            // Chỉ đọc sheet đầu tiên
          };

          workbook = XLSX.readFile(file.path, readOptions);
        }
        // Nếu có buffer, đọc từ buffer
        else if (file.buffer) {
          this.logger.log(`Đọc file Excel từ buffer, kích thước: ${file.buffer.length} bytes`);
          // Thiết lập tùy chọn đọc buffer
          const readOptions = {
            cellFormula: false,
            cellHTML: false,
            cellText: false,
            cellDates: true,
            cellStyles: false,
            dateNF: 'yyyy-mm-dd',
            WTF: true,
            type: 'buffer' as const,
            raw: true,
            cellNF: false
          };

          workbook = XLSX.read(file.buffer, readOptions);
        } else {
          throw new BadRequestException('Không thể đọc file Excel: Không có dữ liệu file');
        }
      } catch (xlsxError) {
        this.logger.error(`Lỗi khi đọc file Excel: ${xlsxError.message}`, xlsxError.stack);
        throw new BadRequestException(`Không thể đọc file Excel: ${xlsxError.message}`);
      }

      if (!workbook || !workbook.SheetNames || workbook.SheetNames.length === 0) {
        throw new BadRequestException('File Excel không có sheet nào');
      }

      const sheetName = workbook.SheetNames[0]; // Lấy sheet đầu tiên
      this.logger.log(`Đọc sheet: ${sheetName}`);
      const sheet = workbook.Sheets[sheetName];

      // Chuyển đổi sheet thành JSON
      const rawData = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as any[][];

      if (!rawData || rawData.length <= 1) {
        throw new BadRequestException('File Excel không có dữ liệu sản phẩm');
      }

      this.emitImportProgress(taskId, userId, 10, 'parsing', 'Đang phân tích dữ liệu Excel...');

      // Log thông tin để debug
      this.logger.log(`File Excel có ${rawData.length} dòng dữ liệu`);
      // Bỏ qua dòng tiêu đề, chỉ lấy dữ liệu từ dòng thứ 2 trở đi
      const productRows = rawData.slice(1).filter(row => row.length > 0);

      this.logger.log(`Đọc được ${productRows.length} sản phẩm từ file Excel`);

      this.emitImportProgress(taskId, userId, 15, 'parsing', 'Đang chuẩn bị dữ liệu và tối ưu hóa...');

      // 🚀 TỐI ƯU HÓA: Pre-load và cache dữ liệu với progress tracking
      this.logger.log(`[Task:${taskId}] Bắt đầu preload dữ liệu cho ${productRows.length} sản phẩm`);
      this.emitImportProgress(taskId, userId, 18, 'parsing', 'Đang tải dữ liệu thương hiệu và sản phẩm hiện có...');

      const preloadStartTime = Date.now();
      const { brandCache, categoryCache, existingProducts, existingSlugs } = await this.preloadDataForImport(productRows, taskId, userId);
      const preloadDuration = Date.now() - preloadStartTime;

      this.logger.log(`[Task:${taskId}] Preload hoàn thành trong ${preloadDuration}ms`);
      this.emitImportProgress(taskId, userId, 25, 'parsing', 'Hoàn thành tối ưu hóa dữ liệu, bắt đầu xử lý sản phẩm...');

      // Kết quả xử lý
      const result = {
        success: true,
        message: 'Import sản phẩm thành công',
        created: 0,
        updated: 0,
        errors: [] as string[],
        statusChanges: {
          toOutOfStock: 0,
          toActive: 0
        },
        categoriesCreated: 0 // Thêm đếm số categories được tạo
      };

      // 🚀 TỐI ƯU HÓA: Xử lý batch để giảm database operations
      const totalProducts = productRows.length;
      const startProgress = 30; // Tăng từ 20% lên 30% vì preload đã hoàn thành ở 25%
      const endProgress = 90;   // Giảm từ 95% xuống 90% để có thời gian finalize
      const progressRange = endProgress - startProgress;

      // 🔥 BATCH PROCESSING: Xử lý theo lô để tối ưu cho file lớn
      const BATCH_SIZE = totalProducts > 1000 ? 100 : 50; // Batch lớn hơn cho file lớn
      const batches: any[][] = [];
      for (let i = 0; i < totalProducts; i += BATCH_SIZE) {
        batches.push(productRows.slice(i, i + BATCH_SIZE));
      }

      this.logger.log(`[Task:${taskId}] Chia ${totalProducts} sản phẩm thành ${batches.length} batch (${BATCH_SIZE} sản phẩm/batch)`);

      // 🔥 MEMORY MONITORING: Log memory usage cho file lớn
      if (totalProducts > 5000) {
        const memUsage = process.memoryUsage();
        this.logger.log(`[Task:${taskId}] Memory usage: ${Math.round(memUsage.heapUsed / 1024 / 1024)}MB heap, ${Math.round(memUsage.rss / 1024 / 1024)}MB RSS`);
      }

      // Batch arrays để bulk operations
      const newProductsToCreate: any[] = [];
      const productsToUpdate: any[] = [];

      // Xử lý từng batch
      for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
        const batch = batches[batchIndex];
        const batchStartIndex = batchIndex * BATCH_SIZE;

        this.logger.log(`[Task:${taskId}] Xử lý batch ${batchIndex + 1}/${batches.length} (${batch.length} sản phẩm)`);

        // 🔥 TIMEOUT CHECK: Kiểm tra timeout giữa các batch
        const currentTime = Date.now();
        if (currentTime - importStartTime > MAX_IMPORT_TIME) {
          throw new Error(`Import timeout sau ${Math.round((currentTime - importStartTime) / 1000)}s. File quá lớn, vui lòng chia nhỏ file.`);
        }

        // 🔥 MEMORY MANAGEMENT: Thêm delay giữa các batch để tránh memory overflow
        if (batchIndex > 0 && totalProducts > 5000) {
          await new Promise(resolve => setTimeout(resolve, 100)); // 100ms delay cho file lớn
        }

        for (let batchItemIndex = 0; batchItemIndex < batch.length; batchItemIndex++) {
          const row = batch[batchItemIndex];
          const globalIndex = batchStartIndex + batchItemIndex;

        try {
          // Log dữ liệu dòng để debug khi cần thiết
          if (globalIndex < 5 || globalIndex === totalProducts - 1) {
            this.logger.log(`Dòng ${globalIndex + 2}: ${JSON.stringify(row)}`);
          }

          const currentProgress = Math.floor(startProgress + ((globalIndex + 1) / totalProducts) * progressRange);

          // Gửi progress update thông minh cho batch processing:
          // - Luôn gửi cho sản phẩm đầu tiên và cuối cùng của mỗi batch
          // - Gửi mỗi batch hoặc mỗi 1% (tùy theo số lượng ít hơn)
          const shouldSendProgress =
            batchItemIndex === 0 || // Sản phẩm đầu tiên của batch
            globalIndex === totalProducts - 1 || // Sản phẩm cuối cùng
            (globalIndex + 1) % Math.max(BATCH_SIZE, Math.floor(totalProducts / 50)) === 0; // Mỗi batch hoặc mỗi 2%

          if (shouldSendProgress) {
            this.emitImportProgress(taskId, userId, currentProgress, 'processing', `Đã xử lý ${globalIndex + 1}/${totalProducts} sản phẩm (${result.created} mới, ${result.updated} cập nhật) - Batch ${batchIndex + 1}/${batches.length}`);
          }

          // Kiểm tra dữ liệu tối thiểu cần có: Mã hàng (Cột C - index 2) và Tên hàng (Cột E - index 4)
          if (!row[2] || !row[4]) {
            result.errors.push(`Sản phẩm dòng ${globalIndex + 2}: Thiếu Mã hàng hoặc Tên hàng.`);
            continue;
          }

          // Lấy thông tin từ các cột theo yêu cầu mới:
          // Lấy thông tin từ các cột theo hình ảnh Excel cung cấp và yêu cầu mới:
          // Cột A (index 0) là "Loại hàng" - Bỏ qua, không dùng làm tên thương hiệu.
          // Cột B (index 1): Nhóm hàng (Sẽ được dùng làm tên Danh mục)
          // Cột F (index 5): Thương hiệu (Sẽ được dùng làm tên Thương hiệu)
          const categoryName = String(row[1] || '').trim();  // Cột B: Nhóm hàng
          const sku = String(row[2] || '').trim();            // Cột C: Mã hàng
          const barcode = String(row[3] || '').trim();        // Cột D: Mã vạch
          const name = String(row[4] || '').trim();           // Cột E: Tên hàng
          const brandName = String(row[5] || '').trim();      // Cột F: Thương hiệu
          const currentPrice = this.parseNumber(row[6]);       // Cột G: Giá bán
          const costPriceFromExcel = this.parseNumber(row[7]); // Cột H: Giá vốn
          const quantity = this.parseNumber(row[8]);           // Cột I: Tồn kho
          // Cột 19 (index 18): Hình ảnh
          const imageUrls = this.parseImageUrls(row[18]);
          // Cột 24 (index 23): Mô tả
          const fullDescription = String(row[23] || '').trim();

          // Tạo slug từ tên sản phẩm
          let slug = this.generateSlug(name);
          if (!slug && sku) { // Nếu slug rỗng và có SKU, tạo slug từ SKU
            this.logger.warn(`Tên sản phẩm "${name}" (dòng ${globalIndex + 2}) không tạo được slug, thử tạo từ SKU: ${sku}`);
            slug = this.generateSlug(sku);
          }

          if (!slug) { // Nếu vẫn không có slug (cả name và sku đều không tạo được slug)
            result.errors.push(`Sản phẩm dòng ${globalIndex + 2} (SKU: ${sku}): Không thể tạo slug từ tên hoặc SKU.`);
            continue;
          }

          // Chuẩn bị dữ liệu sản phẩm
          const productDto: any = {
            sku,
            name,
            slug,
            price: currentPrice > 0 ? currentPrice : 0, // price này là giá bán gốc
            costPrice: costPriceFromExcel > 0 ? costPriceFromExcel : 0, // Lưu giá vốn vào trường mới
            currentPrice: currentPrice > 0 ? currentPrice : 0,
            // Cập nhật trạng thái dựa trên số lượng tồn kho
            // Nếu quantity = 0 thì status = out_of_stock
            status: quantity > 0 ? 'active' : 'out_of_stock',
            description: {
              short: '',
              full: fullDescription
            },
            barcode
          };

          // 🚀 TỐI ƯU HÓA: Xử lý Thương hiệu với cache
          if (brandName) {
            let brandDocument = brandCache.get(brandName);
            if (!brandDocument) {
              this.logger.log(`Thương hiệu "${brandName}" (từ Excel dòng ${globalIndex + 2}) chưa tồn tại, tạo mới.`);
              brandDocument = new this.brandModel({
                name: brandName,
                slug: this.generateSlug(brandName),
                logo: { url: 'https://via.placeholder.com/150/CCCCCC/808080?Text=No+Logo', alt: `${brandName} logo`, publicId: '' }
              });
              await brandDocument.save();
              // Cache brand mới tạo
              brandCache.set(brandName, brandDocument);
              this.logger.log(`Đã tạo thương hiệu mới: ID ${brandDocument._id}, Tên: ${brandName}`);
            }
            if (brandDocument && brandDocument._id) {
              productDto.brandId = brandDocument._id;
            } else {
              this.logger.warn(`Không thể lấy/tạo ID cho thương hiệu "${brandName}" (dòng ${globalIndex + 2})`);
            }
          }

          // Xử lý Nhóm hàng (Category) với hỗ trợ cấp độ phân cấp
          if (categoryName) {
            try {
              const categoryResult = await this.processHierarchicalCategory(categoryName, globalIndex + 2);
              if (categoryResult.finalCategoryId) {
                productDto.categoryIds = [categoryResult.finalCategoryId]; // Gán vào mảng
                result.categoriesCreated += categoryResult.newCategoriesCount; // Cộng dồn số categories mới tạo
              } else {
                this.logger.warn(`Không thể lấy/tạo ID cho danh mục "${categoryName}" (dòng ${globalIndex + 2})`);
              }
            } catch (error) {
              this.logger.error(`Lỗi khi xử lý danh mục phân cấp "${categoryName}" (dòng ${globalIndex + 2}): ${error.message}`);
              result.errors.push(`Dòng ${globalIndex + 2}: Lỗi xử lý danh mục "${categoryName}": ${error.message}`);
            }
          }

          // Xử lý hình ảnh
          if (imageUrls.length > 0) {
            productDto.images = imageUrls.map((url, index) => ({
              url,
              alt: `${name} - Ảnh ${index + 1}`,
              isPrimary: index === 0
            }));
          }

          // Tạo thông tin inventory với chi nhánh được chọn
          productDto.inventory = [{
            branchId: new Types.ObjectId(branchId), // Đảm bảo branchId là ObjectId
            quantity: quantity >= 0 ? quantity : 0
          }];

          // 🚀 TỐI ƯU HÓA: Sử dụng cache thay vì query database
          const existingProduct = existingProducts.get(sku);

          if (existingProduct) {
            this.logger.log(`Cập nhật sản phẩm có SKU: ${sku}`);
            const updateFields: any = {
              name: productDto.name,
              slug: productDto.slug,
              price: productDto.price,
              costPrice: productDto.costPrice,
              currentPrice: productDto.currentPrice,
              'description.full': productDto.description.full,
              barcode: productDto.barcode,
              // Chỉ cập nhật brandId nếu productDto có brandId (tức là brandName không rỗng trong Excel)
              ...(productDto.brandId && { brandId: productDto.brandId }),
              // Chỉ cập nhật categoryIds nếu productDto có categoryIds (tức là categoryName không rỗng)
              ...(productDto.categoryIds && { categoryIds: productDto.categoryIds })
            };

            if (productDto.images && productDto.images.length > 0) {
              updateFields.images = productDto.images;
            }

            // Cập nhật inventory cho chi nhánh cụ thể
            const inventoryUpdate = existingProduct.inventory.find(inv => inv.branchId.toString() === branchId);
            if (inventoryUpdate) {
              inventoryUpdate.quantity = productDto.inventory[0].quantity;
            } else {
              existingProduct.inventory.push(productDto.inventory[0]);
            }
            updateFields.inventory = existingProduct.inventory;

            // Tính toán lại tổng tồn kho và cập nhật trạng thái
            const totalInventory = existingProduct.inventory.reduce((sum, inv) => sum + inv.quantity, 0);
            updateFields.status = totalInventory > 0 ? 'active' : 'out_of_stock';
            if (updateFields.status !== existingProduct.status) {
              if (updateFields.status === 'out_of_stock') result.statusChanges.toOutOfStock++;
              else result.statusChanges.toActive++;
            }

            // 🔥 BULK OPERATION: Thêm vào batch update thay vì update ngay lập tức
            if (totalProducts > 1000) {
              productsToUpdate.push({
                filter: { sku },
                update: { $set: updateFields }
              });
            } else {
              await this.productModel.updateOne({ sku }, { $set: updateFields });
            }
            result.updated++;
          } else {
            this.logger.log(`Tạo sản phẩm mới với SKU: ${sku}`);
            // 🚀 TỐI ƯU HÓA: Sử dụng cache để tạo unique slug
            let uniqueSlug = slug;
            let counter = 1;
            while (existingSlugs.has(uniqueSlug)) {
              uniqueSlug = `${slug}-${counter}`;
              counter++;
            }
            productDto.slug = uniqueSlug;
            // Thêm slug mới vào cache
            existingSlugs.add(uniqueSlug);

            // 🔥 BULK OPERATION: Thêm vào batch create thay vì save ngay lập tức
            if (totalProducts > 1000) {
              newProductsToCreate.push(productDto);
            } else {
              const newProductInstance = new this.productModel(productDto);
              await newProductInstance.save();
            }
            result.created++;
          }
        } catch (error: any) {
          const currentSkuForRow = String(row[2] || 'N/A').trim();
          this.logger.error(`Lỗi khi xử lý sản phẩm dòng ${globalIndex + 2} (SKU: ${currentSkuForRow}): ${error.message}`, error.stack);
          // Cung cấp thông báo lỗi chi tiết hơn
          if (error.code === 11000) { // Lỗi duplicate key
             const field = Object.keys(error.keyValue)[0];
             result.errors.push(`Sản phẩm dòng ${globalIndex + 2} (SKU: ${currentSkuForRow}): Lỗi trùng lặp giá trị cho trường '${field}'. Giá trị '${error.keyValue[field]}' đã tồn tại.`);
          } else if (error.name === 'ValidationError') {
            let validationErrors = '';
            for (const field in error.errors) {
              validationErrors += `${field}: ${error.errors[field].message}; `;
            }
            result.errors.push(`Sản phẩm dòng ${globalIndex + 2} (SKU: ${currentSkuForRow}): Lỗi xác thực - ${validationErrors}`);
          } else {
            result.errors.push(`Sản phẩm dòng ${globalIndex + 2} (SKU: ${currentSkuForRow}): ${error.message}`);
          }
        }
        }

        // 🔥 BATCH COMPLETION: Log tiến trình sau mỗi batch
        this.logger.log(`[Task:${taskId}] Hoàn thành batch ${batchIndex + 1}/${batches.length}: ${result.created} tạo mới, ${result.updated} cập nhật, ${result.errors.length} lỗi`);
      }

      // 🔥 BULK OPERATIONS: Thực hiện bulk operations cho file lớn
      if (totalProducts > 1000) {
        this.emitImportProgress(taskId, userId, 85, 'finalizing', 'Đang thực hiện bulk operations...');

        // Bulk create new products
        if (newProductsToCreate.length > 0) {
          this.logger.log(`[Task:${taskId}] Bulk creating ${newProductsToCreate.length} new products`);
          try {
            await this.productModel.insertMany(newProductsToCreate, { ordered: false });
            this.logger.log(`[Task:${taskId}] Successfully bulk created ${newProductsToCreate.length} products`);
          } catch (error) {
            this.logger.error(`[Task:${taskId}] Bulk create error: ${error.message}`);
            // Fallback to individual saves
            for (const productDto of newProductsToCreate) {
              try {
                const newProductInstance = new this.productModel(productDto);
                await newProductInstance.save();
              } catch (saveError) {
                result.errors.push(`Lỗi tạo sản phẩm SKU ${productDto.sku}: ${saveError.message}`);
              }
            }
          }
        }

        // Bulk update existing products
        if (productsToUpdate.length > 0) {
          this.logger.log(`[Task:${taskId}] Bulk updating ${productsToUpdate.length} existing products`);
          try {
            const bulkOps = productsToUpdate.map(item => ({
              updateOne: {
                filter: item.filter,
                update: item.update
              }
            }));
            await this.productModel.bulkWrite(bulkOps, { ordered: false });
            this.logger.log(`[Task:${taskId}] Successfully bulk updated ${productsToUpdate.length} products`);
          } catch (error) {
            this.logger.error(`[Task:${taskId}] Bulk update error: ${error.message}`);
            // Fallback to individual updates
            for (const item of productsToUpdate) {
              try {
                await this.productModel.updateOne(item.filter, item.update);
              } catch (updateError) {
                result.errors.push(`Lỗi cập nhật sản phẩm: ${updateError.message}`);
              }
            }
          }
        }
      }

      // Tạo thông báo tổng kết chi tiết hơn
      const summaryMessage = `Hoàn thành: ${result.created} sản phẩm mới, ${result.updated} cập nhật, ${result.categoriesCreated} danh mục mới, ${result.errors.length} lỗi từ tổng số ${totalProducts} sản phẩm. Thay đổi trạng thái: ${result.statusChanges.toOutOfStock} sản phẩm hết hàng, ${result.statusChanges.toActive} sản phẩm còn hàng`;

      this.emitImportProgress(taskId, userId, 95, 'finalizing', `Đang hoàn tất: ${result.created} sản phẩm mới, ${result.updated} cập nhật, ${result.categoriesCreated} danh mục mới, ${result.errors.length} lỗi`);

      this.logger.log(`Hoàn thành import sản phẩm: ${result.created} mới, ${result.updated} cập nhật, ${result.categoriesCreated} danh mục mới, ${result.errors.length} lỗi`);
      this.logger.log(`Thay đổi trạng thái: ${result.statusChanges.toOutOfStock} sản phẩm hết hàng, ${result.statusChanges.toActive} sản phẩm còn hàng`);

      // Gửi thông báo tổng kết chi tiết với dữ liệu summary
      const summaryData = {
        created: result.created,
        updated: result.updated,
        categoriesCreated: result.categoriesCreated,
        errors: result.errors,
        totalProducts: totalProducts,
        statusChanges: result.statusChanges
      };

      this.emitImportProgress(taskId, userId, 100, 'completed', summaryMessage, summaryData);

      // Không cần setTimeout ở đây nữa vì client sẽ poll để lấy trạng thái cuối cùng
      // setTimeout(() => {
      //   this.emitImportProgress(taskId, userId, 100, 'completed', summaryMessage, summaryData);
      // }, 1000);

      return; // Thay đổi: không trả về result nữa vì hàm này chạy nền
    } catch (error) {
      this.logger.error(`[Task:${taskId}] Lỗi khi import sản phẩm từ Excel:`, error.stack);
      // Cập nhật trạng thái lỗi cho tác vụ
      this.tasksService.updateImportTask(taskId, {
        status: 'failed',
        progress: 100,
        message: `Lỗi nghiêm trọng: ${error.message}`,
      });
    }
  }

  /**
   * Xử lý danh mục phân cấp từ chuỗi Excel
   * @param categoryPath Chuỗi danh mục dạng "Cha>>Con>>Cháu"
   * @param rowNumber Số dòng trong Excel để log
   * @returns Object chứa ObjectId của danh mục con cuối cùng và số categories mới tạo
   */
  private async processHierarchicalCategory(categoryPath: string, rowNumber: number): Promise<{finalCategoryId: Types.ObjectId | null, newCategoriesCount: number}> {
    try {
      // Tách chuỗi danh mục theo dấu ">>"
      const categoryLevels = categoryPath.split('>>').map(level => level.trim()).filter(level => level.length > 0);

      if (categoryLevels.length === 0) {
        this.logger.warn(`Chuỗi danh mục rỗng tại dòng ${rowNumber}`);
        return { finalCategoryId: null, newCategoriesCount: 0 };
      }

      let parentId: Types.ObjectId | null = null;
      let currentCategoryId: Types.ObjectId | null = null;
      let newCategoriesCount = 0; // Đếm số categories mới tạo

      // Duyệt qua từng cấp độ danh mục
      for (let level = 0; level < categoryLevels.length; level++) {
        const categoryName = categoryLevels[level];
        const currentLevel = level + 1;

        // Tìm kiếm danh mục theo tên và parentId
        const query: any = {
          name: categoryName,
          level: currentLevel
        };

        // Nếu có parentId thì thêm vào query, nếu không thì tìm danh mục gốc (parentId = null)
        if (parentId) {
          query.parentId = parentId;
        } else {
          query.parentId = null;
        }

        let categoryDocument = await this.categoryModel.findOne(query);

        if (!categoryDocument) {
          // Tạo danh mục mới
          const slug = this.generateSlug(categoryName);

          // Đảm bảo slug là duy nhất
          let uniqueSlug = slug;
          let counter = 1;
          while (await this.categoryModel.findOne({ slug: uniqueSlug })) {
            uniqueSlug = `${slug}-${counter}`;
            counter++;
          }

          // Tạo mô tả tự động
          const description = this.generateCategoryDescription(categoryName, currentLevel, categoryLevels);

          const newCategoryData = {
            name: categoryName,
            slug: uniqueSlug,
            description: description,
            parentId: parentId,
            level: currentLevel,
            status: 'active',
            featured: false,
            order: 0
          };

          categoryDocument = new this.categoryModel(newCategoryData);
          await categoryDocument.save();
          newCategoriesCount++; // Tăng counter khi tạo category mới

          this.logger.log(`Đã tạo danh mục mới cấp ${currentLevel}: "${categoryName}" (ID: ${categoryDocument._id}, Slug: ${uniqueSlug})`);
        } else {
          this.logger.log(`Tìm thấy danh mục cấp ${currentLevel}: "${categoryName}" (ID: ${categoryDocument._id})`);
        }

        // Cập nhật parentId cho cấp tiếp theo
        currentCategoryId = categoryDocument._id as Types.ObjectId;
        parentId = currentCategoryId;
      }

      return { finalCategoryId: currentCategoryId, newCategoriesCount };
    } catch (error) {
      this.logger.error(`Lỗi khi xử lý danh mục phân cấp "${categoryPath}" (dòng ${rowNumber}): ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Tạo mô tả tự động cho danh mục
   * @param categoryName Tên danh mục
   * @param level Cấp độ danh mục
   * @param allLevels Tất cả các cấp độ trong chuỗi
   * @returns Mô tả tự động
   */
  private generateCategoryDescription(categoryName: string, level: number, allLevels: string[]): string {
    if (level === 1) {
      return `Danh mục ${categoryName} - Bộ sưu tập các sản phẩm chất lượng cao thuộc nhóm ${categoryName}.`;
    } else if (level === 2) {
      return `${categoryName} thuộc danh mục ${allLevels[0]} - Các sản phẩm chuyên dụng cho ${categoryName.toLowerCase()}.`;
    } else {
      const parentPath = allLevels.slice(0, level - 1).join(' > ');
      return `${categoryName} - Sản phẩm chuyên biệt thuộc nhóm ${parentPath}.`;
    }
  }

  /**
   * Xây dựng đường dẫn categories từ categoryHierarchy (với ancestors)
   * @param categoryHierarchy Thông tin categories với ancestors từ aggregation
   * @returns Chuỗi categories theo định dạng "Cha>>Con>>Cháu"
   */
  private buildHierarchicalCategoryPathFromHierarchy(categoryHierarchy: any[]): string {
    try {
      if (!categoryHierarchy || !Array.isArray(categoryHierarchy) || categoryHierarchy.length === 0) {
        return 'N/A';
      }

      // Lấy category đầu tiên (category mà sản phẩm được gán trực tiếp)
      const directCategory = categoryHierarchy[0];
      if (!directCategory) {
        return 'N/A';
      }

      // Tạo danh sách tất cả categories (bao gồm cả ancestors và chính nó)
      const allCategories: any[] = [];

      // Thêm ancestors (categories cha)
      if (directCategory.ancestors && Array.isArray(directCategory.ancestors)) {
        allCategories.push(...directCategory.ancestors);
      }

      // Thêm chính category đó
      allCategories.push({
        _id: directCategory._id,
        name: directCategory.name,
        level: directCategory.level,
        parentId: directCategory.parentId
      });

      // Sắp xếp theo level để có thứ tự đúng (cha -> con -> cháu)
      allCategories.sort((a, b) => (a.level || 0) - (b.level || 0));

      // Tạo đường dẫn
      const path = allCategories
        .filter(cat => cat && cat.name)
        .map(cat => String(cat.name).trim())
        .filter(name => name !== '');

      return path.length > 0 ? path.join('>>') : 'N/A';

    } catch (error) {
      this.logger.warn(`Lỗi khi xây dựng đường dẫn category từ hierarchy: ${error.message}`);
      return 'N/A';
    }
  }

  /**
   * Xây dựng đường dẫn categories theo cấu trúc phân cấp cho xuất Excel (method cũ)
   * @param categoriesInfo Thông tin categories từ aggregation
   * @returns Chuỗi categories theo định dạng "Cha>>Con>>Cháu"
   */
  private buildHierarchicalCategoryPath(categoriesInfo: any[]): string {
    try {
      if (!categoriesInfo || !Array.isArray(categoriesInfo) || categoriesInfo.length === 0) {
        return 'N/A';
      }

      // Lọc và chuẩn hóa dữ liệu categories
      const validCategories = categoriesInfo
        .filter(cat => cat && cat.name && cat.level)
        .map(cat => ({
          name: String(cat.name).trim(),
          level: Number(cat.level),
          parentId: cat.parentId ? String(cat.parentId) : null,
          _id: cat._id ? String(cat._id) : null
        }))
        .filter(cat => cat.name !== '');

      if (validCategories.length === 0) {
        return 'N/A';
      }

      // Nếu chỉ có 1 category, trả về luôn
      if (validCategories.length === 1) {
        return validCategories[0].name;
      }

      // Sắp xếp theo level để xây dựng cây phân cấp
      validCategories.sort((a, b) => a.level - b.level);

      // Tạo map để tra cứu nhanh category theo ID
      const categoryMap = new Map();
      validCategories.forEach(cat => {
        if (cat._id) {
          categoryMap.set(cat._id, cat);
        }
      });

      // Tìm category có level cao nhất (category con cuối cùng)
      const leafCategory = validCategories[validCategories.length - 1];

      // Xây dựng đường dẫn từ leaf category lên root
      const path: string[] = [];
      let currentCategory = leafCategory;

      // Giới hạn độ sâu để tránh vòng lặp vô hạn
      let maxDepth = 10;

      while (currentCategory && maxDepth > 0) {
        path.unshift(currentCategory.name); // Thêm vào đầu mảng

        // Tìm category cha
        if (currentCategory.parentId && categoryMap.has(currentCategory.parentId)) {
          currentCategory = categoryMap.get(currentCategory.parentId);
        } else {
          // Không có cha hoặc không tìm thấy cha, dừng lại
          break;
        }
        maxDepth--;
      }

      // Nếu không xây dựng được đường dẫn phân cấp, fallback về cách cũ
      if (path.length === 0) {
        return validCategories.map(cat => cat.name).slice(0, 3).join(' > ');
      }

      // Trả về đường dẫn theo định dạng "Cha>>Con>>Cháu"
      return path.join('>>');

    } catch (error) {
      this.logger.warn(`Lỗi khi xây dựng đường dẫn category phân cấp: ${error.message}`);
      // Fallback về cách hiển thị đơn giản
      if (categoriesInfo && Array.isArray(categoriesInfo)) {
        const categoryNames = categoriesInfo
          .filter(cat => cat && cat.name)
          .map(cat => String(cat.name).trim())
          .filter(name => name !== '')
          .slice(0, 3);
        return categoryNames.length > 0 ? categoryNames.join(' > ') : 'N/A';
      }
      return 'N/A';
    }
  }

  // Helper method to generate slug
  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .replace(/à|á|ạ|ả|ã|â|ầ|ấ|ậ|ẩ|ẫ|ă|ằ|ắ|ặ|ẳ|ẵ/g, 'a')
      .replace(/è|é|ẹ|ẻ|ẽ|ê|ề|ế|ệ|ể|ễ/g, 'e')
      .replace(/ì|í|ị|ỉ|ĩ/g, 'i')
      .replace(/ò|ó|ọ|ỏ|õ|ô|ồ|ố|ộ|ổ|ỗ|ơ|ờ|ớ|ợ|ở|ỡ/g, 'o')
      .replace(/ù|ú|ụ|ủ|ũ|ư|ừ|ứ|ự|ử|ữ/g, 'u')
      .replace(/ỳ|ý|ỵ|ỷ|ỹ/g, 'y')
      .replace(/đ/g, 'd')
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
  }

  // Phương thức hỗ trợ chuyển đổi chuỗi số
  private parseNumber(value: any): number {
    if (value === undefined || value === null || value === '') {
      return 0;
    }

    // Xử lý trường hợp value là chuỗi đã được định dạng số (có dấu phẩy, dấu chấm)
    if (typeof value === 'string') {
      // Xóa bỏ các ký tự không phải số và dấu chấm
      const cleanValue = value.replace(/[^\d.-]/g, '');
      return Number(cleanValue) || 0;
    }

    return Number(value) || 0;
  }

  // Phương thức phân tích chuỗi URL hình ảnh
  private parseImageUrls(urlString: any): string[] {
    if (!urlString) {
      return [];
    }

    if (typeof urlString !== 'string') {
      return [];
    }

    // Phân tách chuỗi URL bằng dấu phẩy và loại bỏ khoảng trắng
    return urlString.split(',')
      .map(url => url.trim())
      .filter(url => url.length > 0 && url.match(/^https?:\/\//));
  }

  /**
   * 🚀 TỐI ƯU HÓA: Pre-load dữ liệu để giảm database queries trong vòng lặp
   */
  private async preloadDataForImport(productRows: any[], taskId: string, userId?: string) {
    this.logger.log(`[Task:${taskId}] 🚀 Bắt đầu pre-load dữ liệu để tối ưu hóa import...`);

    try {
      // Extract unique brand names và category names từ Excel
      const uniqueBrandNames = new Set<string>();
      const uniqueCategoryPaths = new Set<string>();
      const skusToCheck = new Set<string>();
      const productNamesToCheck = new Set<string>(); // Để tạo slugs

      productRows.forEach((row, index) => {
        const brandName = String(row[5] || '').trim();
        const categoryName = String(row[1] || '').trim();
        const sku = String(row[2] || '').trim();
        const productName = String(row[4] || '').trim(); // Tên sản phẩm để tạo slug

        if (brandName) uniqueBrandNames.add(brandName);
        if (categoryName) uniqueCategoryPaths.add(categoryName);
        if (sku) skusToCheck.add(sku);
        if (productName) productNamesToCheck.add(productName);
      });

      this.logger.log(`[Task:${taskId}] Pre-loading: ${uniqueBrandNames.size} brands, ${uniqueCategoryPaths.size} categories, ${skusToCheck.size} SKUs, ${productNamesToCheck.size} product names`);

      // 1. Pre-load tất cả brands cần thiết
      const brandCache = new Map<string, any>();
      if (uniqueBrandNames.size > 0) {
        this.logger.log(`[Task:${taskId}] Loading brands...`);
        if (userId) this.emitImportProgress(taskId, userId, 19, 'parsing', 'Đang tải thông tin thương hiệu...');

        const existingBrands = await Promise.race([
          this.brandModel.find({
            name: { $in: Array.from(uniqueBrandNames) }
          }).lean(),
          new Promise((_, reject) => setTimeout(() => reject(new Error('Brand query timeout')), 10000))
        ]) as any[];

        existingBrands.forEach(brand => {
          brandCache.set(brand.name, brand);
        });
        this.logger.log(`[Task:${taskId}] Cached ${existingBrands.length}/${uniqueBrandNames.size} existing brands`);
      }

      // 2. Pre-load existing products by SKU
      const existingProducts = new Map<string, any>();
      if (skusToCheck.size > 0) {
        this.logger.log(`[Task:${taskId}] Loading existing products by SKU...`);
        if (userId) this.emitImportProgress(taskId, userId, 21, 'parsing', 'Đang kiểm tra sản phẩm hiện có...');

        const products = await Promise.race([
          this.productModel.find({
            sku: { $in: Array.from(skusToCheck) }
          }).lean(),
          new Promise((_, reject) => setTimeout(() => reject(new Error('Product query timeout')), 15000))
        ]) as any[];

        products.forEach(product => {
          existingProducts.set(product.sku, product);
        });
        this.logger.log(`[Task:${taskId}] Found ${products.length}/${skusToCheck.size} existing products`);
      }

      // 3. 🔧 TỐI ƯU HÓA: Chỉ pre-load slugs cần thiết thay vì tất cả
      const existingSlugs = new Set<string>();
      if (productNamesToCheck.size > 0) {
        this.logger.log(`[Task:${taskId}] Generating and checking potential slugs...`);
        if (userId) this.emitImportProgress(taskId, userId, 23, 'parsing', 'Đang kiểm tra slug sản phẩm...');

        // Tạo danh sách các slug có thể từ tên sản phẩm
        const potentialSlugs = Array.from(productNamesToCheck).map(name => this.generateSlug(name));

        if (potentialSlugs.length > 0) {
          // Chỉ query các slugs có thể trùng lặp
          const existingSlugDocs = await Promise.race([
            this.productModel.find({
              slug: { $in: potentialSlugs }
            }, { slug: 1 }).lean(),
            new Promise((_, reject) => setTimeout(() => reject(new Error('Slug query timeout')), 10000))
          ]) as any[];

          existingSlugDocs.forEach(product => {
            if (product.slug) existingSlugs.add(product.slug);
          });
          this.logger.log(`[Task:${taskId}] Found ${existingSlugs.size} existing slugs from ${potentialSlugs.length} potential slugs`);
        }
      }

      // 4. Category cache sẽ được xây dựng động trong quá trình xử lý
      const categoryCache = new Map<string, any>();

      this.logger.log(`[Task:${taskId}] ✅ Hoàn thành pre-load dữ liệu`);

      return {
        brandCache,
        categoryCache,
        existingProducts,
        existingSlugs
      };
    } catch (error) {
      this.logger.error(`[Task:${taskId}] ❌ Lỗi khi pre-load dữ liệu: ${error.message}`, error.stack);

      // Emit progress để thông báo lỗi nhưng vẫn tiếp tục
      if (userId) {
        this.emitImportProgress(taskId, userId, 25, 'parsing', 'Lỗi tối ưu hóa, chuyển sang chế độ xử lý thông thường...');
      }

      // Trả về cache rỗng để tiếp tục import (sẽ chậm hơn nhưng vẫn hoạt động)
      this.logger.warn(`[Task:${taskId}] ⚠️ Sử dụng cache rỗng, import sẽ chậm hơn nhưng vẫn tiếp tục`);
      return {
        brandCache: new Map<string, any>(),
        categoryCache: new Map<string, any>(),
        existingProducts: new Map<string, any>(),
        existingSlugs: new Set<string>()
      };
    }
  }

  private emitImportProgress(taskId: string, userId: string, progress: number, status: 'reading' | 'parsing' | 'processing' | 'finalizing' | 'completed' | 'failed', message: string, summary?: any) {
    if (!taskId || !userId) return;

    try {
      this.tasksService.updateImportTask(taskId, {
        progress,
        status: status === 'completed' ? 'completed' : (status === 'failed' ? 'failed' : 'processing'),
        message,
        summary,
      });
    } catch (error) {
      this.logger.error(`[Task:${taskId}] Lỗi khi cập nhật tiến độ tác vụ: ${error.message}`);
    }
  }

  /**
   * Lấy sản phẩm bán chạy
   * @param period 'all-time' | '30-days'
   * @param limit Số lượng sản phẩm cần lấy
   * @returns Danh sách sản phẩm bán chạy
   */
  async getTopProducts(period: 'all-time' | '30-days' = 'all-time', limit: number = 5) {
    try {
      if (period === 'all-time') {
        // Lấy sản phẩm bán chạy toàn thời gian dựa trên soldCount
        return this.getTopProductsAllTime(limit);
      } else {
        // Lấy sản phẩm bán chạy trong 30 ngày qua từ Order
        return this.getTopProducts30Days(limit);
      }
    } catch (error) {
      this.logger.error(`Error fetching top products: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Lấy sản phẩm bán chạy toàn thời gian dựa trên soldCount
   */
  private async getTopProductsAllTime(limit: number) {
    try {
      const pipeline: PipelineStage[] = [
        {
          $match: {
            status: 'active',
            soldCount: { $gt: 0 } // Chỉ lấy sản phẩm có soldCount > 0
          }
        },
        {
          $sort: {
            soldCount: -1, // Sắp xếp theo soldCount giảm dần
            'reviews.averageRating': -1, // Sắp xếp phụ theo rating
            createdAt: -1 // Sắp xếp phụ theo ngày tạo
          }
        },
        { $limit: +limit },
        {
          $lookup: {
            from: 'brands',
            localField: 'brandId',
            foreignField: '_id',
            as: 'brand'
          }
        },
        {
          $lookup: {
            from: 'categories',
            localField: 'categoryIds',
            foreignField: '_id',
            as: 'categories'
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
            images: 1,
            brandId: 1,
            brandName: { $arrayElemAt: ['$brand.name', 0] },
            categoryIds: {
              $map: {
                input: '$categories',
                as: 'cat',
                in: {
                  id: '$$cat._id',
                  name: '$$cat.name'
                }
              }
            },
            flags: 1,
            reviews: 1,
            soldCount: { $ifNull: ['$soldCount', 0] }
          }
        }
      ];

      const products = await this.productModel.aggregate(pipeline);

      return this.formatTopProductsResponse(products, 'all-time');
    } catch (error) {
      this.logger.error(`Error fetching top products all time: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Lấy sản phẩm bán chạy trong 30 ngày qua từ Order
   */
  private async getTopProducts30Days(limit: number) {
    try {
      // Tính ngày 30 ngày trước
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      // Aggregation pipeline để tính toán sản phẩm bán chạy trong 30 ngày
      const pipeline: PipelineStage[] = [
        {
          $match: {
            createdAt: { $gte: thirtyDaysAgo },
            status: 'delivered' // Chỉ tính đơn hàng đã giao thành công
          }
        },
        {
          $unwind: '$items' // Tách mảng items thành các document riêng lẻ
        },
        {
          $group: {
            _id: { $toObjectId: '$items.productId' }, // Convert string to ObjectId
            totalQuantity: { $sum: '$items.quantity' }, // Tổng số lượng bán trong 30 ngày
            totalOrders: { $sum: 1 } // Tổng số đơn hàng chứa sản phẩm này
          }
        },
        {
          $lookup: {
            from: 'products',
            localField: '_id',
            foreignField: '_id',
            as: 'product'
          }
        },
        {
          $unwind: '$product'
        },
        {
          $match: {
            'product.status': 'active' // Chỉ lấy sản phẩm đang hoạt động
          }
        },
        {
          $sort: {
            totalQuantity: -1, // Sắp xếp theo tổng số lượng bán giảm dần
            totalOrders: -1 // Sắp xếp phụ theo số đơn hàng
          }
        },
        { $limit: +limit },
        {
          $lookup: {
            from: 'brands',
            localField: 'product.brandId',
            foreignField: '_id',
            as: 'brand'
          }
        },
        {
          $lookup: {
            from: 'categories',
            localField: 'product.categoryIds',
            foreignField: '_id',
            as: 'categories'
          }
        },
        {
          $project: {
            _id: '$product._id',
            name: '$product.name',
            slug: '$product.slug',
            sku: '$product.sku',
            price: '$product.price',
            currentPrice: '$product.currentPrice',
            status: '$product.status',
            images: '$product.images',
            brandId: '$product.brandId',
            brandName: { $arrayElemAt: ['$brand.name', 0] },
            categoryIds: {
              $map: {
                input: '$categories',
                as: 'cat',
                in: {
                  id: '$$cat._id',
                  name: '$$cat.name'
                }
              }
            },
            flags: '$product.flags',
            reviews: '$product.reviews',
            soldCount: { $ifNull: ['$product.soldCount', 0] },
            totalQuantity30Days: '$totalQuantity', // Số lượng bán trong 30 ngày
            totalOrders30Days: '$totalOrders' // Số đơn hàng trong 30 ngày
          }
        }
      ];

      // Sử dụng orderModel để thực hiện aggregation
      const products = await this.orderModel.aggregate(pipeline);

      return this.formatTopProductsResponse(products, '30-days');
    } catch (error) {
      this.logger.error(`Error fetching top products 30 days: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Format response cho top products
   */
  private formatTopProductsResponse(products: any[], period: string) {
    const lightProducts = products.map(product => {
      let imageUrl = '';
      if (product.images && product.images.length > 0) {
        const primaryImage = product.images.find(img => img.isPrimary);
        imageUrl = primaryImage ? primaryImage.url : product.images[0].url;
      }

      const baseProduct = {
        _id: product._id.toString(),
        name: product.name,
        slug: product.slug,
        sku: product.sku,
        price: product.price,
        currentPrice: product.currentPrice || product.price,
        status: product.status,
        imageUrl,
        brandId: product.brandId?.toString(),
        brandName: product.brandName,
        categoryIds: product.categoryIds || [],
        flags: product.flags,
        reviews: product.reviews,
        soldCount: product.soldCount
      };

      // Thêm thông tin đặc biệt cho 30 ngày
      if (period === '30-days') {
        return {
          ...baseProduct,
          totalQuantity30Days: product.totalQuantity30Days || 0,
          totalOrders30Days: product.totalOrders30Days || 0
        };
      }

      return baseProduct;
    });

    return {
      products: lightProducts,
      period,
      total: lightProducts.length,
      generatedAt: new Date().toISOString()
    };
  }
}
