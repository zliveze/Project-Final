import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { UserActivity, ActivityType } from '../schemas/user-activity.schema';

@Injectable()
export class UserActivityService {
  constructor(
    @InjectModel(UserActivity.name)
    private userActivityModel: Model<UserActivity>,
  ) {}

  async logSearch(userId: string, searchQuery: string): Promise<UserActivity> {
    return this.userActivityModel.create({
      userId,
      activityType: ActivityType.SEARCH,
      metadata: { searchQuery },
    });
  }

  async logProductView(
    userId: string,
    productId: string,
    timeSpent?: number,
    variantId?: string,
  ): Promise<UserActivity> {
    return this.userActivityModel.create({
      userId,
      productId,
      activityType: ActivityType.VIEW,
      metadata: { timeSpent, variantId },
    });
  }

  async logProductClick(
    userId: string,
    productId: string,
    variantId?: string,
  ): Promise<UserActivity> {
    return this.userActivityModel.create({
      userId,
      productId,
      activityType: ActivityType.CLICK,
      metadata: { variantId },
    });
  }

  async logAddToCart(
    userId: string,
    productId: string,
    variantId?: string,
  ): Promise<UserActivity> {
    return this.userActivityModel.create({
      userId,
      productId,
      activityType: ActivityType.ADD_TO_CART,
      metadata: { variantId },
    });
  }

  async logPurchase(
    userId: string,
    productId: string,
    variantId?: string,
  ): Promise<UserActivity> {
    return this.userActivityModel.create({
      userId,
      productId,
      activityType: ActivityType.PURCHASE,
      metadata: { variantId },
    });
  }

  async logFilterUse(
    userId: string,
    filters: {
      price?: { min?: number; max?: number };
      categoryIds?: string[];
      brandIds?: string[];
      tags?: string[];
      skinType?: string[];
      concerns?: string[];
    },
  ): Promise<UserActivity> {
    return this.userActivityModel.create({
      userId,
      activityType: ActivityType.FILTER_USE,
      metadata: { filters },
    });
  }

  async getUserActivities(userId: string, limit = 100): Promise<UserActivity[]> {
    return this.userActivityModel
      .find({ userId })
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate('productId')
      .exec();
  }

  async getUserSearchHistory(userId: string, limit = 10): Promise<string[]> {
    const searchActivities = await this.userActivityModel
      .find({
        userId,
        activityType: ActivityType.SEARCH,
      })
      .sort({ createdAt: -1 })
      .limit(limit)
      .exec();

    return searchActivities
      .map((activity) => activity.metadata?.searchQuery)
      .filter((query): query is string => Boolean(query));
  }

  async getRecentlyViewedProducts(userId: string, limit = 10): Promise<string[]> {
    const viewActivities = await this.userActivityModel
      .find({
        userId,
        activityType: ActivityType.VIEW,
      })
      .sort({ createdAt: -1 })
      .limit(limit * 3) // Lấy nhiều hơn để loại bỏ trùng lặp
      .exec();

    // Loại bỏ các sản phẩm trùng lặp, chỉ giữ lại lần xem gần nhất
    const uniqueProductIds = [
      ...new Map(
        viewActivities.map((activity) => [
          activity.productId.toString(),
          activity.productId.toString(),
        ]),
      ).values(),
    ];

    return uniqueProductIds.slice(0, limit);
  }

  async getMostAddedToCartProducts(userId: string, limit = 10): Promise<string[]> {
    const cartActivities = await this.userActivityModel
      .find({
        userId,
        activityType: ActivityType.ADD_TO_CART,
      })
      .sort({ createdAt: -1 })
      .limit(limit * 3)
      .exec();

    // Loại bỏ các sản phẩm trùng lặp, chỉ giữ lại lần thêm vào giỏ hàng gần nhất
    const uniqueProductIds = [
      ...new Map(
        cartActivities.map((activity) => [
          activity.productId.toString(),
          activity.productId.toString(),
        ]),
      ).values(),
    ];

    return uniqueProductIds.slice(0, limit);
  }

  async getPurchasedProducts(userId: string, limit = 10): Promise<string[]> {
    const purchaseActivities = await this.userActivityModel
      .find({
        userId,
        activityType: ActivityType.PURCHASE,
      })
      .sort({ createdAt: -1 })
      .limit(limit * 3)
      .exec();

    // Loại bỏ các sản phẩm trùng lặp, chỉ giữ lại lần mua gần nhất
    const uniqueProductIds = [
      ...new Map(
        purchaseActivities.map((activity) => [
          activity.productId.toString(),
          activity.productId.toString(),
        ]),
      ).values(),
    ];

    return uniqueProductIds.slice(0, limit);
  }

  async getUserPreferredCategories(userId: string): Promise<Record<string, number>> {
    // Phân tích danh mục ưa thích từ các hoạt động của người dùng
    const activities = await this.userActivityModel
      .find({
        userId,
        productId: { $exists: true },
      })
      .populate({
        path: 'productId',
        select: 'categoryIds',
      })
      .exec();

    const categoryScores = {};

    activities.forEach((activity) => {
      if (!activity.productId || !activity.productId['categoryIds']) return;

      const weight = this.getActivityWeight(activity.activityType);
      const categories = activity.productId['categoryIds'];

      categories.forEach((categoryId) => {
        const catId = categoryId.toString();
        categoryScores[catId] = (categoryScores[catId] || 0) + weight;
      });
    });

    return categoryScores;
  }

  async getUserPreferredBrands(userId: string): Promise<Record<string, number>> {
    // Phân tích thương hiệu ưa thích từ các hoạt động của người dùng
    const activities = await this.userActivityModel
      .find({
        userId,
        productId: { $exists: true },
      })
      .populate({
        path: 'productId',
        select: 'brandId',
      })
      .exec();

    const brandScores = {};

    activities.forEach((activity) => {
      if (!activity.productId || !activity.productId['brandId']) return;

      const weight = this.getActivityWeight(activity.activityType);
      const brandId = activity.productId['brandId'].toString();

      brandScores[brandId] = (brandScores[brandId] || 0) + weight;
    });

    return brandScores;
  }

  async getUserPreferredTags(userId: string): Promise<Record<string, number>> {
    // Phân tích tags ưa thích từ các hoạt động của người dùng
    const activities = await this.userActivityModel
      .find({
        userId,
        productId: { $exists: true },
      })
      .populate({
        path: 'productId',
        select: 'tags',
      })
      .exec();

    const tagScores = {};

    activities.forEach((activity) => {
      if (!activity.productId || !activity.productId['tags']) return;

      const weight = this.getActivityWeight(activity.activityType);
      const tags = activity.productId['tags'];

      tags.forEach((tag) => {
        tagScores[tag] = (tagScores[tag] || 0) + weight;
      });
    });

    return tagScores;
  }

  async getFilterUsagePatterns(userId: string): Promise<any> {
    // Phân tích mẫu sử dụng bộ lọc của người dùng
    const filterActivities = await this.userActivityModel
      .find({
        userId,
        activityType: ActivityType.FILTER_USE,
      })
      .sort({ createdAt: -1 })
      .limit(50)
      .exec();

    // Tổng hợp thông tin về bộ lọc
    const priceRanges: any[] = [];
    const categoryUsage: Record<string, number> = {};
    const brandUsage: Record<string, number> = {};
    const tagUsage: Record<string, number> = {};
    const skinTypeUsage: Record<string, number> = {};
    const concernsUsage: Record<string, number> = {};

    filterActivities.forEach((activity) => {
      const filters = activity.metadata?.filters;
      if (!filters) return;

      // Phạm vi giá
      if (filters.price) {
        priceRanges.push(filters.price);
      }

      // Danh mục
      if (filters.categoryIds) {
        filters.categoryIds.forEach((catId) => {
          categoryUsage[catId] = (categoryUsage[catId] || 0) + 1;
        });
      }

      // Thương hiệu
      if (filters.brandIds) {
        filters.brandIds.forEach((brandId) => {
          brandUsage[brandId] = (brandUsage[brandId] || 0) + 1;
        });
      }

      // Tags
      if (filters.tags) {
        filters.tags.forEach((tag) => {
          tagUsage[tag] = (tagUsage[tag] || 0) + 1;
        });
      }

      // Loại da
      if (filters.skinType) {
        filters.skinType.forEach((type) => {
          skinTypeUsage[type] = (skinTypeUsage[type] || 0) + 1;
        });
      }

      // Vấn đề da
      if (filters.concerns) {
        filters.concerns.forEach((concern) => {
          concernsUsage[concern] = (concernsUsage[concern] || 0) + 1;
        });
      }
    });

    return {
      priceRanges,
      categoryUsage,
      brandUsage,
      tagUsage,
      skinTypeUsage,
      concernsUsage,
    };
  }

  private getActivityWeight(activityType: ActivityType): number {
    // Gán trọng số cho từng loại hoạt động
    switch (activityType) {
      case ActivityType.PURCHASE:
        return 10;
      case ActivityType.ADD_TO_CART:
        return 5;
      case ActivityType.VIEW:
        return 1;
      case ActivityType.CLICK:
        return 2;
      case ActivityType.SEARCH:
        return 3;
      case ActivityType.FILTER_USE:
        return 2;
      default:
        return 1;
    }
  }
}