import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Event } from './entities/event.entity';
import { CreateEventDto, UpdateEventDto, ProductInEventDto } from './dto';

@Injectable()
export class EventsService {
  private readonly logger = new Logger(EventsService.name);

  constructor(
    @InjectModel(Event.name) private readonly eventModel: Model<Event>
  ) {}

  async create(createEventDto: CreateEventDto): Promise<Event> {
    const createdEvent = new this.eventModel(createEventDto);
    return createdEvent.save();
  }

  async findAll(query: any = {}): Promise<Event[]> {
    return this.eventModel.find(query).exec();
  }

  async findActive(): Promise<Event[]> {
    const now = new Date();
    return this.eventModel
      .find({
        startDate: { $lte: now },
        endDate: { $gte: now },
      })
      .exec();
  }

  async findOne(id: string): Promise<Event> {
    const event = await this.eventModel.findById(id).exec();
    if (!event) {
      throw new NotFoundException(`Event with ID ${id} not found`);
    }
    return event;
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
    return this.eventModel
      .find({ 'products.productId': productId })
      .exec();
  }

  async findEventsByVariantId(variantId: string): Promise<Event[]> {
    return this.eventModel
      .find({ 'products.variantId': variantId })
      .exec();
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

    return updatedEvent;
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

    return updatedEvent;
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
    return event.save();
  }

  // Phương thức này đã được chuyển sang WebsocketService
  emitImportProgress(userId: string, progress: number, status: string, message?: string) {
    this.logger.warn('Phương thức emitImportProgress đã được chuyển sang WebsocketService');
  }
}