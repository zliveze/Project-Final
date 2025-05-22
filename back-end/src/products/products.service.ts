import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, SortOrder, Types, PipelineStage } from 'mongoose'; // Import PipelineStage
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
import { EventsService } from '../events/events.service'; // Import EventsService
import { WebsocketService } from '../websocket/websocket.service'; // Import WebsocketService
import { CampaignsService } from '../campaigns/campaigns.service'; // Import CampaignsService
import { Event } from '../events/entities/event.entity'; // Import Event entity
import { Campaign } from '../campaigns/schemas/campaign.schema'; // Import Campaign entity
import * as XLSX from 'xlsx';
import { ProductPromotionCheckDto } from './dto/product-promotion-check.dto';

@Injectable()
export class ProductsService {
  private readonly logger = new Logger(ProductsService.name);
  private hasTextIndex = false; // Flag để kiểm tra xem có text index hay không

  constructor(
    @InjectModel(Product.name) private productModel: Model<ProductDocument>,
    private readonly cloudinaryService: CloudinaryService,
    private readonly eventsService: EventsService,
    private readonly websocketService: WebsocketService,
    private readonly campaignsService: CampaignsService
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

      // Chuyển đổi brandId sang ObjectId nếu hợp lệ
      if (brandId) {
        try {
          filter.brandId = new Types.ObjectId(brandId);
        } catch (e) {
          this.logger.warn(`Invalid brandId format: ${brandId}`);
        }
      }

      // Chuyển đổi categoryId sang ObjectId nếu hợp lệ
      if (categoryId) {
        try {
          // Sử dụng $in để tìm sản phẩm nếu categoryIds là mảng
          filter.categoryIds = { $in: [new Types.ObjectId(categoryId)] };
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

      if (hasGifts !== undefined) {
        const hasGiftsBool = typeof hasGifts === 'string'
          ? hasGifts === 'true'
          : Boolean(hasGifts);
        filter['flags.hasGifts'] = hasGiftsBool;
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

      // Thêm filter thương hiệu
      if (brandId) {
        try {
          matchStage.brandId = new Types.ObjectId(brandId);
        } catch (e) {
          this.logger.warn(`Invalid brandId format: ${brandId}`);
        }
      }

      // Thêm filter danh mục
      if (categoryId) {
        try {
          matchStage.categoryIds = new Types.ObjectId(categoryId);
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
          image: product.mainImage || '',
          stock: product.totalStock || 0,
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
      // Tìm tất cả sản phẩm có tham chiếu đến chi nhánh này
      const products = await this.productModel.find({
        'inventory.branchId': branchId
      });

      let count = 0;

      // Xử lý từng sản phẩm
      for (const product of products) {
        // Lọc bỏ chi nhánh khỏi inventory
        product.inventory = product.inventory.filter(
          inv => inv.branchId.toString() !== branchId
        );

        // Cập nhật trạng thái sản phẩm dựa trên tổng inventory còn lại
        const totalInventory = product.inventory.reduce(
          (sum, inv) => sum + inv.quantity,
          0
        );

        if (totalInventory === 0 && product.status !== 'discontinued') {
          product.status = 'out_of_stock';
        }

        // Lưu sản phẩm
        await product.save();
        count++;
      }

      return {
        success: true,
        count
      };
    } catch (error) {
      this.logger.error(`Error removing branch from products: ${error.message}`, error.stack);
      throw error;
    }
  }

  // Phương thức để kiểm tra có bao nhiêu sản phẩm tham chiếu đến một chi nhánh
  async countProductsReferencingBranch(branchId: string): Promise<number> {
    try {
      return await this.productModel.countDocuments({
        'inventory.branchId': branchId
      });
    } catch (error) {
      this.logger.error(`Error counting products with branch reference: ${error.message}`, error.stack);
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

  async importProductsFromExcel(file: Express.Multer.File, branchId: string, userId?: string): Promise<{ success: boolean; message: string; created: number; updated: number; errors: string[]; statusChanges?: { toOutOfStock: number; toActive: number } }> {
    try {
      this.logger.log(`Bắt đầu import sản phẩm từ file Excel: ${file.originalname}`);

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

      if (userId) {
        this.emitImportProgress(userId, 0, 'reading', 'Bắt đầu đọc file Excel...');
      }

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

      if (userId) {
        this.emitImportProgress(userId, 10, 'parsing', 'Đang phân tích dữ liệu Excel...');
      }

      // Log thông tin để debug
      this.logger.log(`File Excel có ${rawData.length} dòng dữ liệu`);
      // Bỏ qua dòng tiêu đề, chỉ lấy dữ liệu từ dòng thứ 2 trở đi
      const productRows = rawData.slice(1).filter(row => row.length > 0);

      this.logger.log(`Đọc được ${productRows.length} sản phẩm từ file Excel`);

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
        }
      };

      // Xử lý từng sản phẩm trong file Excel
      const totalProducts = productRows.length;
      const startProgress = 15;
      const endProgress = 95;
      const progressRange = endProgress - startProgress;

      for (let i = 0; i < totalProducts; i++) {
        const row = productRows[i];

        try {
          // Log dữ liệu dòng để debug khi cần thiết
          if (i < 5 || i === totalProducts - 1) {
            this.logger.log(`Dòng ${i + 2}: ${JSON.stringify(row)}`);
          }

          const currentProgress = Math.floor(startProgress + ((i + 1) / totalProducts) * progressRange);
          if (userId && (i === 0 || i === totalProducts - 1 ||
              i % Math.max(1, Math.floor(totalProducts / 16)) === 0)) {
            this.emitImportProgress(userId, currentProgress, 'processing', `Đã xử lý ${i + 1}/${totalProducts} sản phẩm (${result.created} mới, ${result.updated} cập nhật)`);
          }

          // Kiểm tra dữ liệu tối thiểu cần có
          if (!row[2] || !row[4]) {
            result.errors.push(`Sản phẩm dòng ${i + 2}: Thiếu mã hàng hoặc tên sản phẩm`);
            continue;
          }

          // Lấy thông tin từ các cột theo yêu cầu
          const category = String(row[1] || '').trim(); // Cột 2: Nhóm hàng(3 Cấp)
          const sku = String(row[2] || '').trim(); // Cột 3: Mã hàng
          const barcode = String(row[3] || '').trim(); // Cột 4: Mã vạch
          const name = String(row[4] || '').trim(); // Cột 5: Tên hàng
          const currentPrice = this.parseNumber(row[6]); // Cột 7: Giá bán
          const originalPrice = this.parseNumber(row[7]); // Cột 8: Giá vốn
          const quantity = this.parseNumber(row[8]); // Cột 9: Tồn kho
          const imageUrls = this.parseImageUrls(row[18]); // Cột 19: Hình ảnh (url1,url2...)

          // Tạo slug từ tên sản phẩm
          const slug = this.generateSlug(name);

          // Chuẩn bị mô tả đầy đủ với mã vạch
          let fullDescription = '';
          if (barcode) {
            fullDescription = `Mã vạch: ${barcode}\n\n`;
          }

          // Chuẩn bị dữ liệu sản phẩm
          const productDto: any = {
            sku,
            name,
            slug,
            price: currentPrice > 0 ? currentPrice : 0,
            originalPrice: originalPrice > 0 ? originalPrice : 0,
            currentPrice: currentPrice > 0 ? currentPrice : 0,
            // Cập nhật trạng thái dựa trên số lượng tồn kho
            // Nếu quantity = 0 thì status = out_of_stock
            status: quantity > 0 ? 'active' : 'out_of_stock',
            description: {
              short: '',
              full: fullDescription
            }
          };

          // Xử lý hình ảnh
          if (imageUrls.length > 0) {
            productDto.images = imageUrls.map((url, index) => ({
              url,
              alt: `${name} - Ảnh ${index + 1}`,
              isPrimary: index === 0 // Ảnh đầu tiên là ảnh chính
            }));
          }

          // Tạo thông tin inventory với chi nhánh được chọn
          productDto.inventory = [{
            branchId,
            quantity: quantity >= 0 ? quantity : 0
          }];

          // Thêm danh mục nếu có
          if (category) {
            // Chúng ta sẽ cần thêm việc tìm/tạo danh mục ở đây
            // Hiện tại chỉ ghi log thông tin
            this.logger.log(`Danh mục của sản phẩm ${sku}: ${category}`);
          }

          // Kiểm tra xem sản phẩm đã tồn tại hay chưa (theo SKU)
          const existingProduct = await this.productModel.findOne({ sku });

          if (existingProduct) {
            // Cập nhật sản phẩm hiện có
            this.logger.log(`Cập nhật sản phẩm có SKU: ${sku}`);

            // Kiểm tra sản phẩm đã có inventory cho chi nhánh này chưa
            const hasInventory = existingProduct.inventory?.some(inv => inv.branchId.toString() === branchId);

            if (hasInventory) {
              // Cập nhật số lượng cho chi nhánh
              await this.productModel.updateOne(
                { sku, 'inventory.branchId': new Types.ObjectId(branchId) },
                { $set: { 'inventory.$.quantity': productDto.inventory[0].quantity } }
              );
            } else {
              // Thêm mới inventory cho chi nhánh
              await this.productModel.updateOne(
                { sku },
                { $push: { inventory: { branchId: new Types.ObjectId(branchId), quantity: productDto.inventory[0].quantity } } }
              );
            }

            // Lấy lại sản phẩm để tính toán tổng tồn kho và cập nhật trạng thái
            const updatedProduct = await this.productModel.findOne({ sku });
            if (updatedProduct) {
              // Tính tổng tồn kho từ tất cả các chi nhánh
              const totalInventory = updatedProduct.inventory.reduce(
                (sum, inv) => sum + inv.quantity,
                0
              );

              // Cập nhật trạng thái dựa trên tổng tồn kho
              let newStatus = updatedProduct.status;
              if (totalInventory === 0 && updatedProduct.status !== 'discontinued') {
                newStatus = 'out_of_stock';
                if (updatedProduct.status !== 'out_of_stock') {
                  result.statusChanges.toOutOfStock++;
                }
              } else if (totalInventory > 0 && updatedProduct.status === 'out_of_stock') {
                newStatus = 'active';
                result.statusChanges.toActive++;
              }

              // Cập nhật các trường khác
              const updateFields: any = {
                name: productDto.name,
                slug: productDto.slug,
                price: productDto.price,
                originalPrice: productDto.originalPrice,
                currentPrice: productDto.currentPrice,
                'description.full': productDto.description.full,
                status: newStatus
              };

              // Cập nhật hình ảnh nếu có
              if (productDto.images && productDto.images.length > 0) {
                updateFields.images = productDto.images;
              }

              await this.productModel.updateOne(
                { sku },
                { $set: updateFields }
              );
            } else {
              // Cập nhật các trường khác nếu không thể lấy lại sản phẩm
              const updateFields: any = {
                name: productDto.name,
                slug: productDto.slug,
                price: productDto.price,
                originalPrice: productDto.originalPrice,
                currentPrice: productDto.currentPrice,
                'description.full': productDto.description.full
              };

              // Cập nhật hình ảnh nếu có
              if (productDto.images && productDto.images.length > 0) {
                updateFields.images = productDto.images;
              }

              await this.productModel.updateOne(
                { sku },
                { $set: updateFields }
              );
            }

            result.updated++;
          } else {
            // Tạo sản phẩm mới
            this.logger.log(`Tạo sản phẩm mới với SKU: ${sku}`);

            // Chuyển đổi ObjectId cho branchId
            productDto.inventory[0].branchId = new Types.ObjectId(branchId);

            const newProduct = new this.productModel(productDto);
            await newProduct.save();

            result.created++;
          }
        } catch (error) {
          this.logger.error(`Lỗi khi xử lý sản phẩm dòng ${i + 2}:`, error.stack);
          result.errors.push(`Sản phẩm dòng ${i + 2}: ${error.message}`);
        }
      }

      // Tạo thông báo tổng kết chi tiết hơn
      const summaryMessage = `Hoàn thành: ${result.created} sản phẩm mới, ${result.updated} cập nhật, ${result.errors.length} lỗi từ tổng số ${totalProducts} sản phẩm. Thay đổi trạng thái: ${result.statusChanges.toOutOfStock} sản phẩm hết hàng, ${result.statusChanges.toActive} sản phẩm còn hàng`;

      if (userId) {
        this.emitImportProgress(userId, 95, 'finalizing', `Đang hoàn tất: ${result.created} sản phẩm mới, ${result.updated} cập nhật, ${result.errors.length} lỗi`);
      }

      this.logger.log(`Hoàn thành import sản phẩm: ${result.created} mới, ${result.updated} cập nhật, ${result.errors.length} lỗi`);
      this.logger.log(`Thay đổi trạng thái: ${result.statusChanges.toOutOfStock} sản phẩm hết hàng, ${result.statusChanges.toActive} sản phẩm còn hàng`);

      if (userId) {
        // Gửi thông báo tổng kết chi tiết với dữ liệu summary
        const summaryData = {
          created: result.created,
          updated: result.updated,
          errors: result.errors,
          totalProducts: totalProducts,
          statusChanges: result.statusChanges
        };

        this.emitImportProgress(userId, 100, 'completed', summaryMessage, summaryData);
        setTimeout(() => {
          this.emitImportProgress(userId, 100, 'completed', summaryMessage, summaryData);
        }, 1000);
      }

      return result;
    } catch (error) {
      this.logger.error(`Lỗi khi import sản phẩm từ Excel:`, error.stack);
      throw new BadRequestException(`Lỗi khi import sản phẩm: ${error.message}`);
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

  private emitImportProgress(userId: string, progress: number, status: string, message: string, summary?: any) {
    if (!userId) return;

    try {
      this.websocketService.emitImportProgress(userId, progress, status, message, summary);
    } catch (error) {
      this.logger.error(`Lỗi khi gửi cập nhật tiến độ: ${error.message}`);
    }
  }
}
