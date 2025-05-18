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

    // Kiểm tra trùng lặp sản phẩm
    const existingProductIds = new Set(event.products.map(p => p.productId.toString()));
    const newProducts = productsData.filter(product => {
      const productIdStr = product.productId.toString();
      return !existingProductIds.has(productIdStr);
    });

    if (newProducts.length === 0) {
      throw new BadRequestException('Tất cả sản phẩm đã tồn tại trong sự kiện');
    }

    // Kiểm tra xem sản phẩm đã thuộc về Campaign nào chưa
    const productIds = newProducts.map(p => p.productId.toString());
    const activeCampaigns = await this.campaignsService.getActiveCampaigns();

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

    // Thêm sản phẩm mới vào sự kiện
    const updatedEvent = await this.eventModel
      .findByIdAndUpdate(
        id,
        { $push: { products: { $each: newProducts } } },
        { new: true }
      )
      .exec();

    if (!updatedEvent) {
      throw new NotFoundException(`Event with ID ${id} not found`);
    }

    const populatedEvents = await this.populateProductDetails([updatedEvent]);
    return populatedEvents[0];
  }

  async removeProductFromEvent(id: string, productId: string): Promise<Event> {
    // Kiểm tra sự kiện tồn tại
    const event = await this.findOne(id);

    // Kiểm tra sản phẩm tồn tại trong sự kiện
    const productExists = event.products.some(p => p.productId.toString() === productId);
    if (!productExists) {
      throw new NotFoundException(`Product with ID ${productId} not found in event ${id}`);
    }

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

  async updateProductPriceInEvent(id: string, productId: string, adjustedPrice: number): Promise<Event> {
    // Kiểm tra sự kiện tồn tại
    const event = await this.findOne(id);

    // Kiểm tra giá hợp lệ
    if (adjustedPrice < 0) {
      throw new BadRequestException('Giá sản phẩm không được âm');
    }

    // Kiểm tra sản phẩm tồn tại trong sự kiện
    const productIndex = event.products.findIndex(p => p.productId.toString() === productId);

    if (productIndex === -1) {
      throw new NotFoundException(`Product with ID ${productId} not found in event ${id}`);
    }

    // Cập nhật giá sản phẩm trong sự kiện
    event.products[productIndex].adjustedPrice = adjustedPrice;

    // Lưu cập nhật
    await event.save();

    // Populate thông tin sản phẩm
    const populatedEvents = await this.populateProductDetails([event]);
    return populatedEvents[0];
  }

  // Phương thức này đã được chuyển sang WebsocketService
  emitImportProgress(userId: string, progress: number, status: string, message?: string) {
    this.logger.warn('Phương thức emitImportProgress đã được chuyển sang WebsocketService');
  }

  // Phương thức helper để populate thông tin sản phẩm
  private async populateProductDetails(events: Event[]): Promise<Event[]> {
    if (!events || events.length === 0) return events;

    // Lấy tất cả productIds từ tất cả events
    const productIds = new Set<string>();
    events.forEach(event => {
      event.products.forEach(product => {
        productIds.add(product.productId.toString());
      });
    });

    // Lấy thông tin sản phẩm từ database
    const products = await this.productModel
      .find({ _id: { $in: Array.from(productIds) } })
      .select('_id name images price')
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
      eventObj.products = eventObj.products.map(product => {
        const productInfo = productMap.get(product.productId.toString());
        if (productInfo) {
          // Lấy ảnh chính hoặc ảnh đầu tiên
          let imageUrl = '';
          if (productInfo.images && productInfo.images.length > 0) {
            const primaryImage = productInfo.images.find(img => img.isPrimary);
            imageUrl = primaryImage ? primaryImage.url : productInfo.images[0].url;
          }

          return {
            ...product,
            name: productInfo.name,
            image: imageUrl,
            originalPrice: productInfo.price
          };
        }
        return product;
      });
      return eventObj;
    });

    return populatedEvents;
  }
}