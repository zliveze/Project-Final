import { Injectable, NotFoundException, BadRequestException, Logger, Inject, forwardRef } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Event } from './entities/event.entity';
import { CreateEventDto, UpdateEventDto, ProductInEventDto } from './dto';
import { Product } from '../products/schemas/product.schema';
import { CampaignsService } from '../campaigns/campaigns.service';

@Injectable()
export class EventsService {
  private readonly logger = new Logger(EventsService.name);

  constructor(
    @InjectModel(Event.name) private readonly eventModel: Model<Event>,
    @InjectModel(Product.name) private readonly productModel: Model<Product>,
    @Inject(forwardRef(() => CampaignsService)) private readonly campaignsService: CampaignsService
  ) {}

  async create(createEventDto: CreateEventDto): Promise<Event> {
    const createdEvent = new this.eventModel(createEventDto);
    return createdEvent.save();
  }

  async findAll(query: any = {}): Promise<Event[]> {
    const events = await this.eventModel.find(query).exec();
    return this.populateProductDetails(events);
  }

  async findActive(): Promise<Event[]> {
    const now = new Date();
    const events = await this.eventModel
      .find({
        startDate: { $lte: now },
        endDate: { $gte: now },
      })
      .exec();
    return this.populateProductDetails(events);
  }

  async findOne(id: string): Promise<Event> {
    const event = await this.eventModel.findById(id).exec();
    if (!event) {
      throw new NotFoundException(`Event with ID ${id} not found`);
    }
    const populatedEvents = await this.populateProductDetails([event]);
    return populatedEvents[0];
  }

  async update(id: string, updateEventDto: UpdateEventDto): Promise<Event> {
    const updatedEvent = await this.eventModel
      .findByIdAndUpdate(id, updateEventDto, { new: true })
      .exec();

    if (!updatedEvent) {
      throw new NotFoundException(`Event with ID ${id} not found`);
    }

    return updatedEvent;
  }

  async remove(id: string): Promise<Event> {
    const deletedEvent = await this.eventModel.findByIdAndDelete(id).exec();

    if (!deletedEvent) {
      throw new NotFoundException(`Event with ID ${id} not found`);
    }

    return deletedEvent;
  }

  async findEventsByProductId(productId: string): Promise<Event[]> {
    const events = await this.eventModel
      .find({ 'products.productId': productId })
      .exec();
    return this.populateProductDetails(events);
  }

  async findEventsByVariantId(variantId: string): Promise<Event[]> {
    const events = await this.eventModel
      .find({ 'products.variantId': variantId })
      .exec();
    return this.populateProductDetails(events);
  }

  async addProductsToEvent(id: string, productsData: ProductInEventDto[]): Promise<Event> {
    // Kiểm tra sự kiện tồn tại
    const event = await this.findOne(id);

    // Kiểm tra dữ liệu đầu vào
    if (!productsData || productsData.length === 0) {
      throw new BadRequestException('Danh sách sản phẩm không được trống');
    }

    // Lấy danh sách productIds từ dữ liệu đầu vào
    const productIds = [...new Set(productsData.map(p => p.productId.toString()))];

    // Kiểm tra xem sản phẩm đã thuộc về Campaign nào chưa
    const activeCampaigns = await this.campaignsService.getActiveCampaigns();

    // Tạo map để lưu thông tin Campaign chứa sản phẩm
    const productCampaignMap = new Map<string, { campaignId: string; campaignName: string }>();

    // Kiểm tra sản phẩm trong Campaign
    activeCampaigns.forEach(campaign => {
      if (campaign && campaign.products) {
        campaign.products.forEach(product => {
          if (product && product.productId) {
            const productIdStr = product.productId.toString();
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

    // Lọc ra các sản phẩm đã thuộc về Campaign
    const productsInCampaign = productIds.filter(productId => productCampaignMap.has(productId));

    // Nếu có sản phẩm đã thuộc về Campaign, thông báo lỗi
    if (productsInCampaign.length > 0) {
      const campaignInfo = productCampaignMap.get(productsInCampaign[0]);
      if (campaignInfo) {
        throw new BadRequestException(
          `Sản phẩm đã thuộc về Campaign "${campaignInfo.campaignName}". Vui lòng xóa sản phẩm khỏi Campaign trước khi thêm vào Event.`
        );
      } else {
        throw new BadRequestException(
          `Sản phẩm đã thuộc về một Campaign. Vui lòng xóa sản phẩm khỏi Campaign trước khi thêm vào Event.`
        );
      }
    }

    // Kiểm tra trùng lặp sản phẩm
    const existingProductIds = new Set(event.products.map(p => p.productId.toString()));
    const newProductIds = productIds.filter(id => !existingProductIds.has(id));

    if (newProductIds.length === 0) {
      throw new BadRequestException('Tất cả sản phẩm đã tồn tại trong sự kiện');
    }

    // Lấy thông tin chi tiết sản phẩm từ database
    const productDetails = await this.productModel
      .find({ _id: { $in: newProductIds } })
      .select('_id name slug images price variants sku status brandId brand reviews soldCount')
      .populate('brandId', 'name')
      .lean()
      .exec();

    // Tạo map để dễ dàng truy cập thông tin sản phẩm
    const productDetailsMap = new Map<string, any>();
    productDetails.forEach(product => {
      productDetailsMap.set(product._id.toString(), product);
    });

    // Xử lý và làm phong phú dữ liệu sản phẩm
    const enrichedProducts = productsData.filter(product =>
      newProductIds.includes(product.productId.toString())
    ).map(product => {
      const productInfo = productDetailsMap.get(product.productId.toString());
      if (!productInfo) return product;

      // Lấy ảnh chính hoặc ảnh đầu tiên
      let imageUrl = '';
      if (productInfo.images && productInfo.images.length > 0) {
        const primaryImage = productInfo.images.find((img: any) => img.isPrimary);
        imageUrl = primaryImage ? primaryImage.url : productInfo.images[0].url;
      }

      // Tạo sản phẩm mới với thông tin cơ bản
      const enrichedProduct: any = {
        productId: product.productId,
        name: product.name || productInfo.name,
        slug: product.slug || productInfo.slug,
        image: product.image || imageUrl,
        originalPrice: product.originalPrice || productInfo.price,
        adjustedPrice: product.adjustedPrice,
        sku: product.sku || productInfo.sku,
        status: product.status || productInfo.status,
        brandId: product.brandId || productInfo.brandId,
        brand: product.brand || (productInfo.brand?.name || (productInfo.brandId && typeof productInfo.brandId === 'object' && productInfo.brandId.name) || ''),
        variants: []
      };

      // Xử lý biến thể và tổ hợp biến thể
      if (product.variants && product.variants.length > 0) {
        enrichedProduct.variants = product.variants.map(variant => {
          // Tìm thông tin biến thể từ database
          const variantInfo = productInfo.variants?.find(
            (v: any) => v.variantId && variant.variantId && v.variantId.toString() === variant.variantId.toString()
          );

          // Tạo biến thể mới
          const enrichedVariant: any = {
            variantId: variant.variantId,
            variantName: variant.variantName || (variantInfo?.name || ''),
            variantSku: variant.variantSku || (variantInfo?.sku || ''),
            variantPrice: variant.variantPrice || (variantInfo?.price || 0),
            adjustedPrice: variant.adjustedPrice,
            originalPrice: variant.originalPrice || (variantInfo?.price || productInfo.price),
            variantAttributes: variant.variantAttributes || {},
            image: variant.image || imageUrl,
            combinations: []
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
                combinationId: combination.combinationId,
                attributes: combination.attributes || {},
                combinationPrice: combination.combinationPrice || (combinationInfo?.price || 0),
                adjustedPrice: combination.adjustedPrice,
                originalPrice: combination.originalPrice || (combinationInfo?.price || variantInfo?.price || productInfo.price)
              };
            });
          }

          return enrichedVariant;
        });
      }

      return enrichedProduct;
    });

    // Thêm sản phẩm mới vào sự kiện
    const updatedEvent = await this.eventModel
      .findByIdAndUpdate(
        id,
        { $push: { products: { $each: enrichedProducts } } },
        { new: true }
      )
      .exec();

    if (!updatedEvent) {
      throw new NotFoundException(`Event with ID ${id} not found`);
    }

    const populatedEvents = await this.populateProductDetails([updatedEvent]);
    return populatedEvents[0];
  }

  async removeProductFromEvent(id: string, productId: string, variantId?: string, combinationId?: string): Promise<Event> {
    // Kiểm tra sự kiện tồn tại
    const event = await this.findOne(id);

    // Tìm sản phẩm trong sự kiện
    const productIndex = event.products.findIndex(p => p.productId.toString() === productId);

    if (productIndex === -1) {
      throw new NotFoundException(`Product with ID ${productId} not found in event ${id}`);
    }

    // Nếu không có variantId, xóa toàn bộ sản phẩm
    if (!variantId) {
      // Xóa sản phẩm khỏi sự kiện
      const updatedEvent = await this.eventModel
        .findByIdAndUpdate(
          id,
          { $pull: { products: { productId: new Types.ObjectId(productId) } } },
          { new: true }
        )
        .exec();

      if (!updatedEvent) {
        throw new NotFoundException(`Event with ID ${id} not found`);
      }

      const populatedEvents = await this.populateProductDetails([updatedEvent]);
      return populatedEvents[0];
    }

    // Nếu có variantId, tìm biến thể trong sản phẩm
    const product = event.products[productIndex];
    const variants = product.variants || [];
    const variantIndex = variants.findIndex(v => v.variantId.toString() === variantId);

    if (variantIndex === -1) {
      throw new NotFoundException(`Variant with ID ${variantId} not found in product ${productId}`);
    }

    // Nếu không có combinationId, xóa biến thể
    if (!combinationId) {
      // Xóa biến thể khỏi sản phẩm
      const updateQuery = {};
      updateQuery[`products.${productIndex}.variants`] = variants.filter(v => v.variantId.toString() !== variantId);

      const updatedEvent = await this.eventModel
        .findByIdAndUpdate(
          id,
          { $set: updateQuery },
          { new: true }
        )
        .exec();

      if (!updatedEvent) {
        throw new NotFoundException(`Event with ID ${id} not found`);
      }

      const populatedEvents = await this.populateProductDetails([updatedEvent]);
      return populatedEvents[0];
    }

    // Nếu có combinationId, tìm tổ hợp trong biến thể
    const variant = variants[variantIndex];
    const combinations = variant.combinations || [];
    const combinationIndex = combinations.findIndex(c => c.combinationId.toString() === combinationId);

    if (combinationIndex === -1) {
      throw new NotFoundException(`Combination with ID ${combinationId} not found in variant ${variantId}`);
    }

    // Xóa tổ hợp khỏi biến thể
    combinations.splice(combinationIndex, 1);

    // Cập nhật sự kiện
    const updateQuery = {};
    updateQuery[`products.${productIndex}.variants.${variantIndex}.combinations`] = combinations;

    const updatedEvent = await this.eventModel
      .findByIdAndUpdate(
        id,
        { $set: updateQuery },
        { new: true }
      )
      .exec();

    if (!updatedEvent) {
      throw new NotFoundException(`Event with ID ${id} not found`);
    }

    const populatedEvents = await this.populateProductDetails([updatedEvent]);
    return populatedEvents[0];
  }

  async updateProductPriceInEvent(
    id: string,
    productId: string,
    adjustedPrice: number,
    variantId?: string,
    combinationId?: string
  ): Promise<Event> {
    // Kiểm tra sự kiện tồn tại
    const event = await this.findOne(id);

    // Kiểm tra giá hợp lệ
    if (adjustedPrice < 0) {
      throw new BadRequestException('Giá sản phẩm không được âm');
    }

    // Tìm sản phẩm trong sự kiện
    const productIndex = event.products.findIndex(p => p.productId.toString() === productId);

    if (productIndex === -1) {
      throw new NotFoundException(`Product with ID ${productId} not found in event ${id}`);
    }

    // Nếu không có variantId, cập nhật giá sản phẩm gốc
    if (!variantId) {
      // Tạo điều kiện truy vấn để cập nhật giá sản phẩm
      const updateQuery = {};
      updateQuery[`products.${productIndex}.adjustedPrice`] = adjustedPrice;

      // Cập nhật sự kiện
      const updatedEvent = await this.eventModel
        .findByIdAndUpdate(
          id,
          { $set: updateQuery },
          { new: true }
        )
        .exec();

      if (!updatedEvent) {
        throw new NotFoundException(`Event with ID ${id} not found after update`);
      }

      // Populate thông tin sản phẩm
      const populatedEvents = await this.populateProductDetails([updatedEvent]);
      return populatedEvents[0];
    }

    // Nếu có variantId, tìm biến thể trong sản phẩm
    const product = event.products[productIndex];
    const variants = product.variants || [];
    const variantIndex = variants.findIndex(v => v.variantId.toString() === variantId);

    if (variantIndex === -1) {
      throw new NotFoundException(`Variant with ID ${variantId} not found in product ${productId}`);
    }

    // Nếu không có combinationId, cập nhật giá biến thể
    if (!combinationId) {
      // Tạo điều kiện truy vấn để cập nhật giá biến thể
      const updateQuery = {};
      updateQuery[`products.${productIndex}.variants.${variantIndex}.adjustedPrice`] = adjustedPrice;

      // Cập nhật sự kiện
      const updatedEvent = await this.eventModel
        .findByIdAndUpdate(
          id,
          { $set: updateQuery },
          { new: true }
        )
        .exec();

      if (!updatedEvent) {
        throw new NotFoundException(`Event with ID ${id} not found after update`);
      }

      // Populate thông tin sản phẩm
      const populatedEvents = await this.populateProductDetails([updatedEvent]);
      return populatedEvents[0];
    }

    // Nếu có combinationId, tìm tổ hợp trong biến thể
    const variant = variants[variantIndex];
    const combinations = variant.combinations || [];
    const combinationIndex = combinations.findIndex(c => c.combinationId.toString() === combinationId);

    if (combinationIndex === -1) {
      throw new NotFoundException(`Combination with ID ${combinationId} not found in variant ${variantId}`);
    }

    // Tạo điều kiện truy vấn để cập nhật giá tổ hợp
    const updateQuery = {};
    updateQuery[`products.${productIndex}.variants.${variantIndex}.combinations.${combinationIndex}.adjustedPrice`] = adjustedPrice;

    // Cập nhật sự kiện
    const updatedEvent = await this.eventModel
      .findByIdAndUpdate(
        id,
        { $set: updateQuery },
        { new: true }
      )
      .exec();

    if (!updatedEvent) {
      throw new NotFoundException(`Event with ID ${id} not found after update`);
    }

    // Populate thông tin sản phẩm
    const populatedEvents = await this.populateProductDetails([updatedEvent]);
    return populatedEvents[0];
  }

  // Phương thức này đã được chuyển sang WebsocketService
  emitImportProgress(_userId: string, _progress: number, _status: string, _message?: string) {
    this.logger.warn('Phương thức emitImportProgress đã được chuyển sang WebsocketService');
  }

  // Phương thức helper để populate thông tin sản phẩm
  private async populateProductDetails(events: Event[]): Promise<Event[]> {
    if (!events || events.length === 0) return events;

    // Lấy tất cả productIds từ tất cả events
    const productIds = new Set<string>();
    events.forEach(event => {
      if (!event.products) {
        this.logger.warn(`Event ${event._id} không có thuộc tính products`);
        event.products = [];
        return;
      }

      event.products.forEach(product => {
        if (product && product.productId) {
          productIds.add(product.productId.toString());
        } else {
          this.logger.warn(`Phát hiện sản phẩm không hợp lệ trong event ${event._id}`);
        }
      });
    });

    // Lấy thông tin sản phẩm từ database với variants và combinations
    const products = await this.productModel
      .find({ _id: { $in: Array.from(productIds) } })
      .select('_id name slug images price variants sku status brandId brand reviews soldCount')
      .populate('brandId', 'name')
      .lean()
      .exec();

    // Tạo map để dễ dàng truy cập thông tin sản phẩm
    const productMap = new Map<string, any>();
    products.forEach(product => {
      productMap.set(product._id.toString(), product);
    });

    // Thêm thông tin sản phẩm vào mỗi event
    const populatedEvents = events.map(event => {
      const eventObj = event.toObject ? event.toObject() : { ...event };
      eventObj.products = eventObj.products.map((product: any) => {
        // Bỏ qua các sản phẩm không hợp lệ
        if (!product || !product.productId) {
          return product;
        }

        const productInfo = productMap.get(product.productId.toString());
        if (!productInfo) return product;

        // Lấy ảnh chính hoặc ảnh đầu tiên
        let imageUrl = '';
        if (productInfo.images && productInfo.images.length > 0) {
          const primaryImage = productInfo.images.find((img: any) => img.isPrimary);
          imageUrl = primaryImage ? primaryImage.url : productInfo.images[0].url;
        }

        // Cập nhật thông tin cơ bản của sản phẩm
        const updatedProduct = {
          ...product,
          name: product.name || productInfo.name,
          slug: product.slug || productInfo.slug,
          image: product.image || imageUrl,
          originalPrice: product.originalPrice || productInfo.price,
          sku: product.sku || productInfo.sku,
          status: product.status || productInfo.status,
          brandId: product.brandId || productInfo.brandId,
          brand: product.brand || (productInfo.brand?.name || (productInfo.brandId && typeof productInfo.brandId === 'object' && productInfo.brandId.name) || ''),
          reviews: productInfo.reviews || {},
          averageRating: productInfo.reviews?.averageRating || 0,
          reviewCount: productInfo.reviews?.reviewCount || 0,
          soldCount: productInfo.soldCount || 0
        };

        // Nếu sản phẩm có biến thể, cập nhật thông tin biến thể
        if (product.variants && product.variants.length > 0) {
          updatedProduct.variants = product.variants.map((variant: any) => {
            // Tìm thông tin biến thể từ database
            const variantInfo = productInfo.variants?.find(
              (v: any) => v.variantId && variant.variantId && v.variantId.toString() === variant.variantId.toString()
            );

            if (!variantInfo) return variant;

            // Lấy ảnh của biến thể nếu có
            let variantImageUrl = imageUrl;
            if (variantInfo.images && variantInfo.images.length > 0) {
              const variantPrimaryImage = variantInfo.images.find((img: any) => img.isPrimary);
              variantImageUrl = variantPrimaryImage ? variantPrimaryImage.url : variantInfo.images[0].url;
            }

            // Cập nhật thông tin biến thể
            const updatedVariant = {
              ...variant,
              variantName: variant.variantName || variantInfo.name || '',
              variantSku: variant.variantSku || variantInfo.sku || '',
              variantPrice: variant.variantPrice || variantInfo.price || 0,
              originalPrice: variant.originalPrice || variantInfo.price || productInfo.price,
              image: variant.image || variantImageUrl,
              reviews: variantInfo.reviews || {},
              averageRating: variantInfo.reviews?.averageRating || productInfo.reviews?.averageRating || 0,
              reviewCount: variantInfo.reviews?.reviewCount || productInfo.reviews?.reviewCount || 0,
              soldCount: variantInfo.soldCount || 0
            };

            // Nếu biến thể có tổ hợp, cập nhật thông tin tổ hợp
            if (variant.combinations && variant.combinations.length > 0) {
              updatedVariant.combinations = variant.combinations.map((combination: any) => {
                // Tìm thông tin tổ hợp từ database
                const combinationInfo = variantInfo.combinations?.find(
                  (c: any) => c.combinationId && combination.combinationId && c.combinationId.toString() === combination.combinationId.toString()
                );

                if (!combinationInfo) return combination;

                // Cập nhật thông tin tổ hợp
                return {
                  ...combination,
                  combinationPrice: combination.combinationPrice || combinationInfo.price || (variantInfo.price + (combinationInfo.additionalPrice || 0)) || 0,
                  originalPrice: combination.originalPrice || combinationInfo.price || variantInfo.price || productInfo.price
                };
              });
            }

            return updatedVariant;
          });
        }

        return updatedProduct;
      });
      return eventObj;
    });

    // Kiểm tra cuối cùng trước khi trả về kết quả
    if (!populatedEvents) {
      this.logger.warn('populateProductDetails trả về null hoặc undefined');
      return events;
    }

    return populatedEvents;
  }
}