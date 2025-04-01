import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, SortOrder } from 'mongoose';
import { Notification, NotificationDocument } from './schemas/notification.schema';
import { CreateNotificationDto, UpdateNotificationDto, QueryNotificationDto, PaginatedNotificationsResponseDto, NotificationResponseDto } from './dto';
import { Types } from 'mongoose';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectModel(Notification.name) private notificationModel: Model<NotificationDocument>,
  ) {}

  async create(createNotificationDto: CreateNotificationDto): Promise<NotificationDocument> {
    const createdNotification = new this.notificationModel(createNotificationDto);
    return createdNotification.save();
  }

  async findAll(queryDto: QueryNotificationDto): Promise<PaginatedNotificationsResponseDto> {
    const { 
      page = 1, 
      limit = 10, 
      search, 
      type, 
      isActive,
      sortBy = 'priority', 
      sortOrder = 'desc',
      startDate,
      endDate
    } = queryDto;
    
    const skip = (page - 1) * limit;
    
    // Xây dựng điều kiện tìm kiếm
    const query: any = {};
    
    if (search) {
      query.content = { $regex: search, $options: 'i' };
    }
    
    if (type) {
      query.type = type;
    }
    
    if (typeof isActive === 'boolean') {
      query.isActive = isActive;
    }
    
    // Tìm kiếm theo khoảng thời gian
    const dateQuery = {};
    if (startDate) {
      dateQuery['$gte'] = new Date(startDate);
    }
    if (endDate) {
      dateQuery['$lte'] = new Date(endDate);
    }
    if (Object.keys(dateQuery).length > 0) {
      query.startDate = dateQuery;
    }
    
    // Thực hiện truy vấn
    const sortOptions: { [key: string]: SortOrder } = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };
    
    const notifications = await this.notificationModel
      .find(query)
      .sort(sortOptions)
      .skip(skip)
      .limit(limit)
      .lean()
      .exec();
    
    const total = await this.notificationModel.countDocuments(query).exec();
    const totalPages = Math.ceil(total / limit);
    
    // Chuyển đổi dữ liệu để phù hợp với NotificationResponseDto
    const items: NotificationResponseDto[] = notifications.map(notification => ({
      ...notification,
      _id: (notification._id as Types.ObjectId).toString()
    })) as NotificationResponseDto[];
    
    return {
      items,
      total,
      page,
      limit,
      totalPages,
    };
  }

  async findAllActive(): Promise<NotificationResponseDto[]> {
    const now = new Date();
    
    // Lấy tất cả thông báo đang hoạt động và trong thời gian hiệu lực
    const notifications = await this.notificationModel.find({
      isActive: true,
      startDate: { $lte: now },
      $or: [
        { endDate: { $exists: false } },
        { endDate: null },
        { endDate: { $gte: now } },
      ],
    })
    .sort({ priority: -1 })
    .lean()
    .exec();
    
    // Chuyển đổi dữ liệu để phù hợp với NotificationResponseDto
    return notifications.map(notification => ({
      ...notification,
      _id: (notification._id as Types.ObjectId).toString()
    })) as NotificationResponseDto[];
  }

  async findOne(id: string): Promise<NotificationDocument> {
    const notification = await this.notificationModel.findById(id).exec();
    if (!notification) {
      throw new NotFoundException(`Không tìm thấy thông báo với ID: ${id}`);
    }
    return notification;
  }

  async update(id: string, updateNotificationDto: UpdateNotificationDto): Promise<NotificationDocument> {
    const updatedNotification = await this.notificationModel
      .findByIdAndUpdate(id, updateNotificationDto, { new: true })
      .exec();
    
    if (!updatedNotification) {
      throw new NotFoundException(`Không tìm thấy thông báo với ID: ${id}`);
    }
    
    return updatedNotification;
  }

  async toggleStatus(id: string): Promise<NotificationDocument> {
    const notification = await this.findOne(id);
    notification.isActive = !notification.isActive;
    return notification.save();
  }

  async remove(id: string): Promise<NotificationDocument> {
    const deletedNotification = await this.notificationModel.findByIdAndDelete(id).exec();
    
    if (!deletedNotification) {
      throw new NotFoundException(`Không tìm thấy thông báo với ID: ${id}`);
    }
    
    return deletedNotification;
  }

  async getStatistics() {
    const now = new Date();
    const oneWeekLater = new Date();
    oneWeekLater.setDate(oneWeekLater.getDate() + 7);
    
    // Tổng số thông báo
    const total = await this.notificationModel.countDocuments();
    
    // Số thông báo đang hoạt động
    const active = await this.notificationModel.countDocuments({ 
      isActive: true,
      startDate: { $lte: now },
      $or: [
        { endDate: { $exists: false } },
        { endDate: null },
        { endDate: { $gte: now } },
      ],
    });
    
    // Số thông báo đã ẩn
    const inactive = await this.notificationModel.countDocuments({ isActive: false });
    
    // Số thông báo sắp hết hạn (trong vòng 1 tuần)
    const expiringSoon = await this.notificationModel.countDocuments({
      isActive: true,
      endDate: { $gte: now, $lte: oneWeekLater },
    });
    
    return {
      total,
      active,
      inactive,
      expiringSoon,
    };
  }
} 