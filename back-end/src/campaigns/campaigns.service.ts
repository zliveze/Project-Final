import { Injectable, NotFoundException, BadRequestException, Inject, forwardRef, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Campaign, CampaignDocument } from './schemas/campaign.schema';
import { CreateCampaignDto, ProductInCampaignDto } from './dto/create-campaign.dto';
import { UpdateCampaignDto } from './dto/update-campaign.dto';
import { QueryCampaignDto } from './dto/query-campaign.dto';
import { EventsService } from '../events/events.service';
import { Product } from '../products/schemas/product.schema';
import { Order } from '../orders/schemas/order.schema';

@Injectable()
export class CampaignsService {
  private readonly logger = new Logger(CampaignsService.name);

  constructor(
    @InjectModel(Campaign.name) private campaignModel: Model<CampaignDocument>,
    @InjectModel(Product.name) private readonly productModel: Model<Product>,
    @InjectModel(Order.name) private readonly orderModel: Model<Order>,
    @Inject(forwardRef(() => EventsService)) private readonly eventsService: EventsService
  ) {}

  async create(createCampaignDto: CreateCampaignDto): Promise<Campaign> {
    // Kiểm tra xem sản phẩm đã thuộc về Event nào chưa
    if (createCampaignDto.products && createCampaignDto.products.length > 0) {
      const productIds = createCampaignDto.products.map(p => p.productId.toString());

      // Lấy tất cả Event đang hoạt động
      const activeEvents = await this.eventsService.findActive();

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

      // Lọc ra các sản phẩm đã thuộc về Event
      const productsInEvent = productIds.filter(productId => productEventMap.has(productId));

      // Nếu có sản phẩm đã thuộc về Event, thông báo lỗi
      if (productsInEvent.length > 0) {
        const eventInfo = productEventMap.get(productsInEvent[0]);
        if (eventInfo) {
          throw new BadRequestException(
            `Sản phẩm đã thuộc về Event "${eventInfo.eventName}". Vui lòng xóa sản phẩm khỏi Event trước khi thêm vào Campaign.`
          );
        } else {
          throw new BadRequestException(
            `Sản phẩm đã thuộc về một Event. Vui lòng xóa sản phẩm khỏi Event trước khi thêm vào Campaign.`
          );
        }
      }

      // Lấy thông tin chi tiết sản phẩm từ database (bao gồm tất cả productIds để kiểm tra tên)
      const allProductDetailsForCheck = await this.productModel
        .find({ _id: { $in: productIds.map(id => new Types.ObjectId(id)) } })
        .select('_id name')
        .lean()
        .exec();

      const productDetailsMapForCheck = new Map<string, any>();
      allProductDetailsForCheck.forEach(product => {
        productDetailsMapForCheck.set(product._id.toString(), product);
      });

      // Kiểm tra xem sản phẩm đã thuộc về Campaign nào khác chưa
      // Vì đây là create, không cần loại trừ campaign hiện tại (_id: { $ne: campaign._id })
      const otherActiveCampaigns = await this.campaignModel.find({
        'products.productId': { $in: productIds.map(id => new Types.ObjectId(id)) }
      }).select('products.productId title').lean().exec();

      const productInOtherCampaignMap = new Map<string, string>();
      otherActiveCampaigns.forEach(otherCampaign => {
        if (otherCampaign.products) {
          otherCampaign.products.forEach(p => {
            if (p && p.productId) {
              const pIdStr = p.productId.toString();
              if (productIds.includes(pIdStr) && !productInOtherCampaignMap.has(pIdStr)) {
                productInOtherCampaignMap.set(pIdStr, otherCampaign.title || 'Không có tên');
              }
            }
          });
        }
      });

      const productsInAnotherCampaign = productIds.filter(productId => productInOtherCampaignMap.has(productId));

      if (productsInAnotherCampaign.length > 0) {
        const firstProductIdInAnotherCampaign = productsInAnotherCampaign[0];
        const campaignName = productInOtherCampaignMap.get(firstProductIdInAnotherCampaign);
        const productName = productDetailsMapForCheck.get(firstProductIdInAnotherCampaign)?.name || firstProductIdInAnotherCampaign;
        throw new BadRequestException(
          `Sản phẩm ${productName} (ID: ${firstProductIdInAnotherCampaign}) đã thuộc về Campaign "${campaignName}". Một sản phẩm chỉ có thể thuộc về một Campaign duy nhất.`
        );
      }

      // Làm phong phú dữ liệu sản phẩm với thông tin chi tiết
      const enrichedProducts = await this.enrichProductsData(createCampaignDto.products);
      createCampaignDto.products = enrichedProducts;
    }

    const newCampaign = new this.campaignModel(createCampaignDto);
    return newCampaign.save();
  }

  // Phương thức làm phong phú dữ liệu sản phẩm với thông tin chi tiết
  private async enrichProductsData(productsData: ProductInCampaignDto[]): Promise<ProductInCampaignDto[]> {
    if (!productsData || productsData.length === 0) {
      return [];
    }

    // Lấy danh sách ID sản phẩm
    const productIds = productsData.map(p => new Types.ObjectId(p.productId.toString()));

    // Lấy thông tin chi tiết sản phẩm từ database
    const productDetails = await this.productModel
      .find({ _id: { $in: productIds } })
      .select('_id name images price variants sku status brandId brand')
      .populate('brandId', 'name')
      .lean()
      .exec();

    // Tạo map để dễ dàng truy cập thông tin sản phẩm
    const productDetailsMap = new Map<string, any>();
    productDetails.forEach(product => {
      productDetailsMap.set(product._id.toString(), product);
    });

    // Làm phong phú dữ liệu sản phẩm
    return productsData.map(product => {
      const productId = product.productId.toString();
      const productInfo = productDetailsMap.get(productId);

      if (!productInfo) {
        this.logger.warn(`Không tìm thấy thông tin sản phẩm cho ID: ${productId}`);
        return product;
      }

      // Tạo sản phẩm mới với thông tin chi tiết
      const enrichedProduct: ProductInCampaignDto = {
        ...product,
        name: product.name || productInfo.name,
        image: product.image || (productInfo.images && productInfo.images.length > 0 ?
          productInfo.images.find(img => img.isPrimary)?.url || productInfo.images[0].url : undefined),
        originalPrice: product.originalPrice || productInfo.price,
        sku: product.sku || productInfo.sku,
        status: product.status || productInfo.status,
        brandId: product.brandId || productInfo.brandId,
        brand: product.brand || (productInfo.brandId && productInfo.brandId.name ? productInfo.brandId.name : undefined),
      };

      // Xử lý biến thể
      if (product.variants && product.variants.length > 0) {
        enrichedProduct.variants = product.variants.map(variant => {
          // Tìm thông tin biến thể từ database
          const variantInfo = productInfo.variants?.find(
            (v: any) => v.variantId && variant.variantId && v.variantId.toString() === variant.variantId.toString()
          );

          // Tạo biến thể mới
          const enrichedVariant = {
            ...variant,
            variantName: variant.variantName || variantInfo?.name,
            variantSku: variant.variantSku || variantInfo?.sku,
            variantAttributes: variant.variantAttributes || variantInfo?.options || {},
            variantPrice: variant.variantPrice || variantInfo?.price || productInfo.price,
            originalPrice: variant.originalPrice || variantInfo?.price || productInfo.price,
            image: variant.image || (variantInfo?.images && variantInfo.images.length > 0 ?
              variantInfo.images[0].url : undefined),
          };

          // Xử lý tổ hợp biến thể
          if (variant.combinations && variant.combinations.length > 0) {
            enrichedVariant.combinations = variant.combinations.map(combination => {
              // Tìm thông tin tổ hợp từ database
              const combinationInfo = variantInfo?.combinations?.find(
                (c: any) => c.combinationId && combination.combinationId && c.combinationId.toString() === combination.combinationId.toString()
              );

              // Tạo tổ hợp mới
              return {
                ...combination,
                attributes: combination.attributes || {},
                combinationPrice: combination.combinationPrice || (combinationInfo?.price || 0),
                originalPrice: combination.originalPrice || (combinationInfo?.price || variantInfo?.price || productInfo.price)
              };
            });
          }

          return enrichedVariant;
        });
      }

      return enrichedProduct;
    });
  }

  async findAll(queryDto: QueryCampaignDto): Promise<{
    campaigns: Campaign[];
    total: number;
    page: number;
    limit: number;
  }> {
    const { page = 1, limit = 10, search, type, startDateFrom, startDateTo, endDateFrom, endDateTo } = queryDto;
    const skip = (page - 1) * limit;

    const query = this.campaignModel.find();

    // Apply search filter
    if (search) {
      query.where({
        title: { $regex: search, $options: 'i' },
      });
    }

    // Apply type filter
    if (type) {
      query.where({ type });
    }

    // Apply date filters
    const dateQuery: any = {};

    if (startDateFrom) {
      dateQuery.startDate = { ...dateQuery.startDate, $gte: startDateFrom };
    }

    if (startDateTo) {
      dateQuery.startDate = { ...dateQuery.startDate, $lte: startDateTo };
    }

    if (endDateFrom) {
      dateQuery.endDate = { ...dateQuery.endDate, $gte: endDateFrom };
    }

    if (endDateTo) {
      dateQuery.endDate = { ...dateQuery.endDate, $lte: endDateTo };
    }

    if (Object.keys(dateQuery).length > 0) {
      query.where(dateQuery);
    }

    // Get total count
    const total = await this.campaignModel.countDocuments(query.getQuery());

    // Get paginated data
    const campaigns = await query
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .exec();

    return {
      campaigns,
      total,
      page,
      limit,
    };
  }

  async findOne(id: string): Promise<Campaign> {
    const campaign = await this.campaignModel.findById(id).exec();
    if (!campaign) {
      throw new NotFoundException(`Campaign với ID "${id}" không tồn tại`);
    }
    return campaign;
  }

  async update(id: string, updateCampaignDto: UpdateCampaignDto): Promise<Campaign> {
    // Kiểm tra xem campaign có tồn tại không
    const existingCampaign = await this.findOne(id);

    // Kiểm tra xem có thêm sản phẩm mới vào campaign không
    if (updateCampaignDto.products && updateCampaignDto.products.length > 0) {
      // Lấy danh sách sản phẩm hiện tại trong campaign
      const existingProductIds = new Set(existingCampaign.products.map(p => p.productId.toString()));

      // Lọc ra các sản phẩm mới được thêm vào
      const newProductIds = updateCampaignDto.products
        .filter(p => !existingProductIds.has(p.productId.toString()))
        .map(p => p.productId.toString());

      // Nếu có sản phẩm mới, kiểm tra xem chúng đã thuộc về Event nào chưa
      if (newProductIds.length > 0) {
        // Lấy tất cả Event đang hoạt động
        const activeEvents = await this.eventsService.findActive();

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

        // Lọc ra các sản phẩm đã thuộc về Event
        const productsInEvent = newProductIds.filter(productId => productEventMap.has(productId));

        // Nếu có sản phẩm đã thuộc về Event, thông báo lỗi
        if (productsInEvent.length > 0) {
          const eventInfo = productEventMap.get(productsInEvent[0]);
          if (eventInfo) {
            throw new BadRequestException(
              `Sản phẩm đã thuộc về Event "${eventInfo.eventName}". Vui lòng xóa sản phẩm khỏi Event trước khi thêm vào Campaign.`
            );
          } else {
            throw new BadRequestException(
              `Sản phẩm đã thuộc về một Event. Vui lòng xóa sản phẩm khỏi Event trước khi thêm vào Campaign.`
            );
          }
        }

        // Lấy thông tin chi tiết sản phẩm từ database (bao gồm tất cả newProductIds để kiểm tra tên)
        const allNewProductDetailsForCheck = await this.productModel
          .find({ _id: { $in: newProductIds.map(id => new Types.ObjectId(id)) } })
          .select('_id name')
          .lean()
          .exec();

        const newProductDetailsMapForCheck = new Map<string, any>();
        allNewProductDetailsForCheck.forEach(product => {
          newProductDetailsMapForCheck.set(product._id.toString(), product);
        });

        // Kiểm tra xem các sản phẩm mới này đã thuộc về Campaign nào khác chưa
        const otherActiveCampaigns = await this.campaignModel.find({
          _id: { $ne: existingCampaign._id }, // Loại trừ campaign hiện tại
          'products.productId': { $in: newProductIds.map(id => new Types.ObjectId(id)) }
        }).select('products.productId title').lean().exec();

        const productInOtherCampaignMap = new Map<string, string>();
        otherActiveCampaigns.forEach(otherCampaign => {
          if (otherCampaign.products) {
            otherCampaign.products.forEach(p => {
              if (p && p.productId) {
                const pIdStr = p.productId.toString();
                if (newProductIds.includes(pIdStr) && !productInOtherCampaignMap.has(pIdStr)) {
                  productInOtherCampaignMap.set(pIdStr, otherCampaign.title || 'Không có tên');
                }
              }
            });
          }
        });

        const newProductsInAnotherCampaign = newProductIds.filter(productId => productInOtherCampaignMap.has(productId));

        if (newProductsInAnotherCampaign.length > 0) {
          const firstProductIdInAnotherCampaign = newProductsInAnotherCampaign[0];
          const campaignName = productInOtherCampaignMap.get(firstProductIdInAnotherCampaign);
          const productName = newProductDetailsMapForCheck.get(firstProductIdInAnotherCampaign)?.name || firstProductIdInAnotherCampaign;
          throw new BadRequestException(
            `Sản phẩm mới ${productName} (ID: ${firstProductIdInAnotherCampaign}) đã thuộc về Campaign "${campaignName}". Một sản phẩm chỉ có thể thuộc về một Campaign duy nhất.`
          );
        }
      }

      // Làm phong phú dữ liệu sản phẩm mới với thông tin chi tiết
      const newProducts = updateCampaignDto.products.filter(p => !existingProductIds.has(p.productId.toString()));
      if (newProducts.length > 0) {
        const enrichedNewProducts = await this.enrichProductsData(newProducts);

        // Kết hợp sản phẩm mới và sản phẩm hiện tại
        const existingProducts = updateCampaignDto.products.filter(p => existingProductIds.has(p.productId.toString()));
        updateCampaignDto.products = [...existingProducts, ...enrichedNewProducts];
      }
    }

    const updatedCampaign = await this.campaignModel
      .findByIdAndUpdate(id, updateCampaignDto, { new: true })
      .exec();

    if (!updatedCampaign) {
      throw new NotFoundException(`Campaign với ID "${id}" không tồn tại`);
    }

    return updatedCampaign;
  }

  async remove(id: string): Promise<Campaign> {
    const deletedCampaign = await this.campaignModel.findByIdAndDelete(id).exec();

    if (!deletedCampaign) {
      throw new NotFoundException(`Campaign với ID "${id}" không tồn tại`);
    }

    return deletedCampaign;
  }

  // Phương thức lấy các chiến dịch đang hoạt động
  async getActiveCampaigns(): Promise<Campaign[]> {
    const now = new Date();
    return this.campaignModel
      .find({
        startDate: { $lte: now },
        endDate: { $gte: now },
      })
      .select('_id title description type startDate endDate products')
      .lean()
      .exec();
  }

  // Phương thức thêm sản phẩm vào chiến dịch
  async addProductsToCampaign(id: string, productsData: ProductInCampaignDto[]): Promise<Campaign> {
    // Kiểm tra chiến dịch tồn tại
    const campaign = await this.findOne(id);

    // Kiểm tra dữ liệu đầu vào
    if (!productsData || productsData.length === 0) {
      throw new BadRequestException('Danh sách sản phẩm không được trống');
    }

    // Lấy danh sách ID sản phẩm
    const productIds = productsData.map(p => p.productId.toString());

    // Kiểm tra sản phẩm đã thuộc về Event nào chưa
    const activeEvents = await this.eventsService.findActive();
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

    // Lọc ra các sản phẩm đã thuộc về Event
    const productsInEvent = productIds.filter(productId => productEventMap.has(productId));

    // Nếu có sản phẩm đã thuộc về Event, thông báo lỗi
    if (productsInEvent.length > 0) {
      const eventInfo = productEventMap.get(productsInEvent[0]);
      if (eventInfo) {
        throw new BadRequestException(
          `Sản phẩm đã thuộc về Event "${eventInfo.eventName}". Vui lòng xóa sản phẩm khỏi Event trước khi thêm vào Campaign.`
        );
      } else {
        throw new BadRequestException(
          `Sản phẩm đã thuộc về một Event. Vui lòng xóa sản phẩm khỏi Event trước khi thêm vào Campaign.`
        );
      }
    }

    // Lấy thông tin chi tiết sản phẩm từ database (bao gồm tất cả productIds để kiểm tra tên)
    const allProductDetailsForCheck = await this.productModel
      .find({ _id: { $in: productIds.map(id => new Types.ObjectId(id)) } })
      .select('_id name')
      .lean()
      .exec();

    const productDetailsMapForCheck = new Map<string, any>();
    allProductDetailsForCheck.forEach(product => {
      productDetailsMapForCheck.set(product._id.toString(), product);
    });

    // Kiểm tra xem sản phẩm đã thuộc về Campaign nào khác chưa
    const otherActiveCampaigns = await this.campaignModel.find({
      _id: { $ne: campaign._id }, // Loại trừ campaign hiện tại
      'products.productId': { $in: productIds.map(id => new Types.ObjectId(id)) }
    }).select('products.productId title').lean().exec();

    const productInOtherCampaignMap = new Map<string, string>();
    otherActiveCampaigns.forEach(otherCampaign => {
      if (otherCampaign.products) {
        otherCampaign.products.forEach(p => {
          if (p && p.productId) {
            const pIdStr = p.productId.toString();
            if (productIds.includes(pIdStr) && !productInOtherCampaignMap.has(pIdStr)) {
              productInOtherCampaignMap.set(pIdStr, otherCampaign.title || 'Không có tên');
            }
          }
        });
      }
    });

    const productsInAnotherCampaign = productIds.filter(productId => productInOtherCampaignMap.has(productId));

    if (productsInAnotherCampaign.length > 0) {
      const firstProductIdInAnotherCampaign = productsInAnotherCampaign[0];
      const campaignName = productInOtherCampaignMap.get(firstProductIdInAnotherCampaign);
      const productName = productDetailsMapForCheck.get(firstProductIdInAnotherCampaign)?.name || firstProductIdInAnotherCampaign;
      throw new BadRequestException(
        `Sản phẩm ${productName} (ID: ${firstProductIdInAnotherCampaign}) đã thuộc về Campaign "${campaignName}". Một sản phẩm chỉ có thể thuộc về một Campaign duy nhất.`
      );
    }

    // Kiểm tra trùng lặp sản phẩm
    const existingProductIds = new Set(campaign.products.map(p => p.productId.toString()));
    const newProductIds = productIds.filter(id => !existingProductIds.has(id));

    if (newProductIds.length === 0) {
      throw new BadRequestException('Tất cả sản phẩm đã tồn tại trong chiến dịch');
    }

    // Làm phong phú dữ liệu sản phẩm với thông tin chi tiết
    const enrichedProducts = await this.enrichProductsData(productsData);

    // Thêm sản phẩm mới vào chiến dịch
    const updatedCampaign = await this.campaignModel
      .findByIdAndUpdate(
        id,
        { $push: { products: { $each: enrichedProducts } } },
        { new: true }
      )
      .exec();

    if (!updatedCampaign) {
      throw new NotFoundException(`Campaign with ID ${id} not found`);
    }

    return updatedCampaign;
  }

  // Phương thức xóa sản phẩm khỏi chiến dịch
  async removeProductFromCampaign(id: string, productId: string, variantId?: string): Promise<Campaign> {
    // Kiểm tra chiến dịch tồn tại
    const campaign = await this.findOne(id);

    // Nếu không có variantId, xóa toàn bộ sản phẩm
    if (!variantId) {
      // Xóa sản phẩm khỏi chiến dịch
      const updatedCampaign = await this.campaignModel
        .findByIdAndUpdate(
          id,
          { $pull: { products: { productId: new Types.ObjectId(productId) } } },
          { new: true }
        )
        .exec();

      if (!updatedCampaign) {
        throw new NotFoundException(`Campaign with ID ${id} not found`);
      }

      return updatedCampaign;
    }

    // Nếu có variantId, chỉ xóa biến thể
    const productIndex = campaign.products.findIndex(p => p.productId.toString() === productId);
    if (productIndex === -1) {
      throw new NotFoundException(`Product with ID ${productId} not found in campaign ${id}`);
    }

    // Tạo điều kiện truy vấn để xóa biến thể
    const updateQuery = {};
    updateQuery[`products.${productIndex}.variants`] = { $elemMatch: { variantId: new Types.ObjectId(variantId) } };

    // Xóa biến thể khỏi sản phẩm
    const updatedCampaign = await this.campaignModel
      .findByIdAndUpdate(
        id,
        { $pull: { [`products.${productIndex}.variants`]: { variantId: new Types.ObjectId(variantId) } } },
        { new: true }
      )
      .exec();

    if (!updatedCampaign) {
      throw new NotFoundException(`Campaign with ID ${id} not found`);
    }

    return updatedCampaign;
  }

  // Phương thức cập nhật giá sản phẩm trong chiến dịch
  async updateProductPriceInCampaign(
    id: string,
    productId: string,
    adjustedPrice: number,
    variantId?: string,
    combinationId?: string
  ): Promise<Campaign> {
    // Kiểm tra chiến dịch tồn tại
    const campaign = await this.findOne(id);

    // Kiểm tra giá hợp lệ
    if (adjustedPrice < 0) {
      throw new BadRequestException('Giá sản phẩm không được âm');
    }

    // Tìm sản phẩm trong chiến dịch
    const productIndex = campaign.products.findIndex(p => p.productId.toString() === productId);

    if (productIndex === -1) {
      throw new NotFoundException(`Product with ID ${productId} not found in campaign ${id}`);
    }

    // Nếu không có variantId, cập nhật giá sản phẩm gốc
    if (!variantId) {
      // Tạo điều kiện truy vấn để cập nhật giá sản phẩm
      const updateQuery = {};
      updateQuery[`products.${productIndex}.adjustedPrice`] = adjustedPrice;

      // Cập nhật chiến dịch
      const updatedCampaign = await this.campaignModel
        .findByIdAndUpdate(
          id,
          { $set: updateQuery },
          { new: true }
        )
        .exec();

      if (!updatedCampaign) {
        throw new NotFoundException(`Campaign with ID ${id} not found after update`);
      }

      return updatedCampaign;
    }

    // Nếu có variantId, tìm biến thể
    const variantIndex = campaign.products[productIndex].variants.findIndex(
      v => v.variantId.toString() === variantId
    );

    if (variantIndex === -1) {
      throw new NotFoundException(`Variant with ID ${variantId} not found in product ${productId} of campaign ${id}`);
    }

    // Nếu không có combinationId, cập nhật giá biến thể
    if (!combinationId) {
      // Tạo điều kiện truy vấn để cập nhật giá biến thể
      const updateQuery = {};
      updateQuery[`products.${productIndex}.variants.${variantIndex}.adjustedPrice`] = adjustedPrice;

      // Cập nhật chiến dịch
      const updatedCampaign = await this.campaignModel
        .findByIdAndUpdate(
          id,
          { $set: updateQuery },
          { new: true }
        )
        .exec();

      if (!updatedCampaign) {
        throw new NotFoundException(`Campaign with ID ${id} not found after update`);
      }

      return updatedCampaign;
    }

    // Nếu có combinationId, tìm tổ hợp biến thể
    const combinationIndex = campaign.products[productIndex].variants[variantIndex].combinations.findIndex(
      c => c.combinationId.toString() === combinationId
    );

    if (combinationIndex === -1) {
      throw new NotFoundException(`Combination with ID ${combinationId} not found in variant ${variantId} of product ${productId} in campaign ${id}`);
    }

    // Tạo điều kiện truy vấn để cập nhật giá tổ hợp biến thể
    const updateQuery = {};
    updateQuery[`products.${productIndex}.variants.${variantIndex}.combinations.${combinationIndex}.adjustedPrice`] = adjustedPrice;

    // Cập nhật chiến dịch
    const updatedCampaign = await this.campaignModel
      .findByIdAndUpdate(
        id,
        { $set: updateQuery },
        { new: true }
      )
      .exec();

    if (!updatedCampaign) {
      throw new NotFoundException(`Campaign with ID ${id} not found after update`);
    }

    return updatedCampaign;
  }

  // Phương thức lấy thống kê chiến dịch cho dashboard
  async getCampaignStats(): Promise<{
    totalCampaigns: number;
    activeCampaigns: number;
    expiringSoon: number;
    topPerformingCampaigns: Array<{
      _id: string;
      title: string;
      type: string;
      totalOrders: number;
      totalRevenue: number;
      endDate: Date;
      daysLeft: number;
    }>;
  }> {
    this.logger.log('Starting to fetch campaign stats...');
    const startTime = Date.now();

    const now = new Date();
    const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    try {
      // Đếm tổng số chiến dịch
      const totalCampaigns = await this.campaignModel.countDocuments();
      this.logger.log(`Total campaigns: ${totalCampaigns}`);

      // Đếm chiến dịch đang hoạt động
      const activeCampaigns = await this.campaignModel.countDocuments({
        startDate: { $lte: now },
        endDate: { $gte: now },
      });
      this.logger.log(`Active campaigns: ${activeCampaigns}`);

      // Đếm chiến dịch sắp hết hạn (trong 7 ngày tới)
      const expiringSoon = await this.campaignModel.countDocuments({
        startDate: { $lte: now },
        endDate: { $gte: now, $lte: sevenDaysFromNow },
      });
      this.logger.log(`Expiring soon campaigns: ${expiringSoon}`);

      // Lấy top 5 chiến dịch có hiệu quả cao nhất
      const campaigns = await this.campaignModel.find().lean();
      this.logger.log(`Found ${campaigns.length} campaigns for performance calculation`);

      const campaignPerformance = await Promise.all(
        campaigns.map(async (campaign) => {
          // Lấy danh sách productId từ campaign
          const productIds = campaign.products.map(p => p.productId);

          // Tính tổng đơn hàng và doanh thu từ các sản phẩm trong campaign
          const orderStats = await this.orderModel.aggregate([
            {
              $match: {
                'items.productId': { $in: productIds },
                status: { $in: ['confirmed', 'processing', 'shipping', 'delivered'] }
              }
            },
            {
              $unwind: '$items'
            },
            {
              $match: {
                'items.productId': { $in: productIds }
              }
            },
            {
              $group: {
                _id: null,
                totalOrders: { $addToSet: '$_id' },
                totalRevenue: { $sum: { $multiply: ['$items.quantity', '$items.price'] } }
              }
            }
          ]);

          const stats = orderStats[0] || { totalOrders: [], totalRevenue: 0 };
          // Đảm bảo endDate là Date object
          const endDate = campaign.endDate instanceof Date ? campaign.endDate : new Date(campaign.endDate);
          const daysLeft = Math.max(0, Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));

          return {
            _id: campaign._id.toString(),
            title: campaign.title,
            type: campaign.type,
            totalOrders: stats.totalOrders.length,
            totalRevenue: stats.totalRevenue,
            endDate: endDate,
            daysLeft
          };
        })
      );

      // Sắp xếp theo doanh thu giảm dần và lấy top 5
      const topPerformingCampaigns = campaignPerformance
        .sort((a, b) => b.totalRevenue - a.totalRevenue)
        .slice(0, 5);

      const endTime = Date.now();
      this.logger.log(`Campaign stats fetched successfully in ${endTime - startTime}ms`);

      return {
        totalCampaigns,
        activeCampaigns,
        expiringSoon,
        topPerformingCampaigns
      };
    } catch (error) {
      this.logger.error('Error fetching campaign stats:', error);
      throw error;
    }
  }
}
