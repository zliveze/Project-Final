import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Event } from './entities/event.entity';
import { CreateEventDto, UpdateEventDto } from './dto';

@Injectable()
export class EventsService {
  constructor(
    @InjectModel(Event.name) private readonly eventModel: Model<Event>,
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
} 