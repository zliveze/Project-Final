import { Injectable, NotFoundException, BadRequestException, Inject, forwardRef } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Campaign, CampaignDocument } from './schemas/campaign.schema';
import { CreateCampaignDto } from './dto/create-campaign.dto';
import { UpdateCampaignDto } from './dto/update-campaign.dto';
import { QueryCampaignDto } from './dto/query-campaign.dto';
import { EventsService } from '../events/events.service';

@Injectable()
export class CampaignsService {
  constructor(
    @InjectModel(Campaign.name) private campaignModel: Model<CampaignDocument>,
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
    }

    const newCampaign = new this.campaignModel(createCampaignDto);
    return newCampaign.save();
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
}