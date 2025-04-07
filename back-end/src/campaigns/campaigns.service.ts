import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Campaign, CampaignDocument } from './schemas/campaign.schema';
import { CreateCampaignDto } from './dto/create-campaign.dto';
import { UpdateCampaignDto } from './dto/update-campaign.dto';
import { QueryCampaignDto } from './dto/query-campaign.dto';

@Injectable()
export class CampaignsService {
  constructor(
    @InjectModel(Campaign.name) private campaignModel: Model<CampaignDocument>,
  ) {}

  async create(createCampaignDto: CreateCampaignDto): Promise<Campaign> {
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
      .exec();
  }
} 