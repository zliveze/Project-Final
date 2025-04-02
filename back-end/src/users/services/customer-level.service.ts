import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from '../schemas/user.schema';

@Injectable()
export class CustomerLevelService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
  ) {}

  private readonly LEVEL_THRESHOLDS = {
    'Khách hàng bạc': 1,
    'Khách hàng vàng': 5,
    'Khách hàng thân thiết': 10,
  };

  async updateCustomerLevel(userId: string): Promise<void> {
    const user = await this.userModel.findById(userId);
    if (!user) return;

    // Kiểm tra và reset số đơn hàng hàng tháng nếu cần
    const now = new Date();
    if (user.lastOrderDate) {
      const lastOrderMonth = user.lastOrderDate.getMonth();
      const currentMonth = now.getMonth();
      const lastOrderYear = user.lastOrderDate.getFullYear();
      const currentYear = now.getFullYear();

      if (lastOrderMonth !== currentMonth || lastOrderYear !== currentYear) {
        user.monthlyOrders = 0;
      }
    }

    // Cập nhật số đơn hàng
    user.monthlyOrders += 1;
    user.totalOrders += 1;
    user.lastOrderDate = now;

    // Cập nhật cấp độ khách hàng dựa trên số đơn hàng trong tháng
    let newLevel = 'Khách hàng mới';
    if (user.monthlyOrders >= this.LEVEL_THRESHOLDS['Khách hàng thân thiết']) {
      newLevel = 'Khách hàng thân thiết';
    } else if (user.monthlyOrders >= this.LEVEL_THRESHOLDS['Khách hàng vàng']) {
      newLevel = 'Khách hàng vàng';
    } else if (user.monthlyOrders >= this.LEVEL_THRESHOLDS['Khách hàng bạc']) {
      newLevel = 'Khách hàng bạc';
    }

    user.customerLevel = newLevel;
    await user.save();
  }

  async getCustomerLevel(userId: string): Promise<string> {
    const user = await this.userModel.findById(userId);
    return user?.customerLevel || 'Khách hàng mới';
  }

  async getCustomerStats(userId: string): Promise<{
    customerLevel: string;
    monthlyOrders: number;
    totalOrders: number;
  }> {
    const user = await this.userModel.findById(userId);
    return {
      customerLevel: user?.customerLevel || 'Khách hàng mới',
      monthlyOrders: user?.monthlyOrders || 0,
      totalOrders: user?.totalOrders || 0,
    };
  }
} 