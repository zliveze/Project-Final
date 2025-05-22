import { Injectable } from '@nestjs/common';
import { UserActivityService } from './user-activity.service';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Product } from '../../products/schemas/product.schema';

@Injectable()
export class RecommendationsService {
  constructor(
    private readonly userActivityService: UserActivityService,
    @InjectModel(Product.name) private readonly productModel: Model<Product>,
  ) {}

  /**
   * Lấy sản phẩm gợi ý dựa trên hành vi người dùng
   */
  async getPersonalizedRecommendations(
    userId: string,
    limit = 10,
  ): Promise<Product[]> {
    // 1. Thu thập dữ liệu về hành vi người dùng
    const [
      recentlyViewed,
      addedToCart,
      purchased,
      preferredCategories,
      preferredBrands,
      preferredTags,
      filterPatterns,
      searchHistory,
    ] = await Promise.all([
      this.userActivityService.getRecentlyViewedProducts(userId),
      this.userActivityService.getMostAddedToCartProducts(userId),
      this.userActivityService.getPurchasedProducts(userId),
      this.userActivityService.getUserPreferredCategories(userId),
      this.userActivityService.getUserPreferredBrands(userId),
      this.userActivityService.getUserPreferredTags(userId),
      this.userActivityService.getFilterUsagePatterns(userId),
      this.userActivityService.getUserSearchHistory(userId, 5),
    ]);

    // 2. Danh sách các sản phẩm đã tương tác (để loại trừ khỏi kết quả gợi ý)
    const interactedProductIds = new Set([
      ...recentlyViewed.map((id) => id.toString()),
      ...addedToCart.map((id) => id.toString()),
      ...purchased.map((id) => id.toString()),
    ]);

    // 3. Tạo các truy vấn dựa trên sở thích của người dùng
    const sortedCategories = this.sortByScore(preferredCategories);
    const sortedBrands = this.sortByScore(preferredBrands);
    const sortedTags = this.sortByScore(preferredTags);

    // 4. Tạo các điều kiện tìm kiếm
    const searchConditions: any[] = [];

    // 4.1. Điều kiện tìm kiếm dựa trên danh mục ưa thích
    if (sortedCategories.length > 0) {
      const topCategories = sortedCategories.slice(0, 3).map((item) => item.id);
      searchConditions.push({ categoryIds: { $in: topCategories } });
    }

    // 4.2. Điều kiện tìm kiếm dựa trên thương hiệu ưa thích
    if (sortedBrands.length > 0) {
      const topBrands = sortedBrands.slice(0, 3).map((item) => item.id);
      searchConditions.push({ brandId: { $in: topBrands } });
    }

    // 4.3. Điều kiện tìm kiếm dựa trên tags ưa thích
    if (sortedTags.length > 0) {
      const topTags = sortedTags.slice(0, 5).map((item) => item.id);
      searchConditions.push({ tags: { $in: topTags } });
    }

    // 4.4. Điều kiện tìm kiếm dựa trên mẫu sử dụng bộ lọc
    if (filterPatterns.skinTypeUsage && Object.keys(filterPatterns.skinTypeUsage).length > 0) {
      const topSkinTypes = this.sortByScore(filterPatterns.skinTypeUsage, 2);
      if (topSkinTypes.length > 0) {
        searchConditions.push({
          'cosmetic_info.skinType': { $in: topSkinTypes.map((item) => item.id) },
        });
      }
    }

    if (filterPatterns.concernsUsage && Object.keys(filterPatterns.concernsUsage).length > 0) {
      const topConcerns = this.sortByScore(filterPatterns.concernsUsage, 2);
      if (topConcerns.length > 0) {
        searchConditions.push({
          'cosmetic_info.concerns': { $in: topConcerns.map((item) => item.id) },
        });
      }
    }

    // 4.5. Tìm kiếm dựa trên lịch sử tìm kiếm
    if (searchHistory.length > 0) {
      const searchTerms = searchHistory.slice(0, 3);
      const searchRegexes = searchTerms.map((term) => new RegExp(term, 'i'));

      searchConditions.push({
        $or: [
          { name: { $in: searchRegexes } },
          { 'description.short': { $in: searchRegexes } },
          { 'description.full': { $in: searchRegexes } },
          { tags: { $in: searchTerms } },
        ],
      });
    }

    // 5. Loại bỏ các sản phẩm đã tương tác (nếu có yêu cầu)
    const excludeInteracted = interactedProductIds.size > 0 ? {
      _id: { $nin: Array.from(interactedProductIds) },
    } : {};

    // 6. Tìm kiếm sản phẩm gợi ý
    let finalQuery = {};

    if (searchConditions.length > 0) {
      finalQuery = {
        $and: [
          { $or: searchConditions },
          excludeInteracted,
          { status: 'active' }, // Chỉ lấy sản phẩm đang hoạt động
        ],
      };
    } else {
      // Nếu không có đủ dữ liệu hành vi, lấy sản phẩm phổ biến/bán chạy
      finalQuery = {
        ...excludeInteracted,
        status: 'active',
        'flags.isBestSeller': true,
      };
    }

    // 7. Thực hiện truy vấn với ưu tiên sắp xếp và giới hạn kết quả
    const recommendedProducts = await this.productModel
      .find(finalQuery)
      .sort({ 'reviews.averageRating': -1 })
      .limit(limit)
      .exec();

    // 8. Bổ sung kết quả nếu không đủ số lượng
    if (recommendedProducts.length < limit) {
      const remainingCount = limit - recommendedProducts.length;
      const existingIds = new Set([
        ...recommendedProducts.map((p) => (p as any)._id?.toString()),
        ...Array.from(interactedProductIds),
      ]);

      const additionalProducts = await this.productModel
        .find({
          _id: { $nin: Array.from(existingIds) },
          status: 'active',
        })
        .sort({ 'reviews.averageRating': -1 })
        .limit(remainingCount)
        .exec();

      recommendedProducts.push(...additionalProducts);
    }

    return recommendedProducts;
  }

  /**
   * Lấy sản phẩm tương tự dựa trên sản phẩm đang xem
   */
  async getSimilarProducts(productId: string, limit = 8): Promise<Product[]> {
    // 1. Lấy thông tin sản phẩm hiện tại
    const currentProduct = await this.productModel.findById(productId).exec();
    if (!currentProduct) {
      return [];
    }

    // 2. Tạo điều kiện tìm kiếm dựa trên đặc điểm của sản phẩm
    const searchConditions: any[] = [];

    // 2.1. Tìm sản phẩm cùng danh mục
    if (currentProduct.categoryIds && currentProduct.categoryIds.length > 0) {
      searchConditions.push({
        categoryIds: { $in: currentProduct.categoryIds },
      });
    }

    // 2.2. Tìm sản phẩm cùng thương hiệu
    if (currentProduct.brandId) {
      searchConditions.push({
        brandId: currentProduct.brandId,
      });
    }

    // 2.3. Tìm sản phẩm có cùng tags
    if (currentProduct.tags && currentProduct.tags.length > 0) {
      searchConditions.push({
        tags: { $in: currentProduct.tags },
      });
    }

    // 2.4. Tìm sản phẩm có cùng loại da phù hợp
    if (
      currentProduct.cosmetic_info &&
      currentProduct.cosmetic_info.skinType &&
      currentProduct.cosmetic_info.skinType.length > 0
    ) {
      searchConditions.push({
        'cosmetic_info.skinType': {
          $in: currentProduct.cosmetic_info.skinType,
        },
      });
    }

    // 2.5. Tìm sản phẩm giải quyết cùng vấn đề da
    if (
      currentProduct.cosmetic_info &&
      currentProduct.cosmetic_info.concerns &&
      currentProduct.cosmetic_info.concerns.length > 0
    ) {
      searchConditions.push({
        'cosmetic_info.concerns': {
          $in: currentProduct.cosmetic_info.concerns,
        },
      });
    }

    // 3. Tìm kiếm sản phẩm tương tự, loại bỏ sản phẩm hiện tại
    const similarProducts = await this.productModel
      .find({
        _id: { $ne: productId },
        $or: searchConditions,
        status: 'active',
      })
      .sort({ 'reviews.averageRating': -1 })
      .limit(limit)
      .exec();

    // 4. Bổ sung kết quả nếu không đủ số lượng
    if (similarProducts.length < limit) {
      const remainingCount = limit - similarProducts.length;
      const existingIds = new Set([
        productId,
        ...similarProducts.map((p) => (p as any)._id?.toString()),
      ]);

      const additionalProducts = await this.productModel
        .find({
          _id: { $nin: Array.from(existingIds) },
          status: 'active',
          categoryIds: { $in: currentProduct.categoryIds },
        })
        .sort({ 'reviews.averageRating': -1 })
        .limit(remainingCount)
        .exec();

      similarProducts.push(...additionalProducts);
    }

    return similarProducts;
  }

  /**
   * Lấy sản phẩm phù hợp với từ khóa tìm kiếm
   */
  async getProductsBySearchQuery(searchQuery: string, limit = 10): Promise<Product[]> {
    const searchRegex = new RegExp(searchQuery, 'i');

    return this.productModel
      .find({
        $or: [
          { name: searchRegex },
          { 'description.short': searchRegex },
          { 'description.full': searchRegex },
          { tags: searchRegex },
        ],
        status: 'active',
      })
      .sort({ 'reviews.averageRating': -1 })
      .limit(limit)
      .exec();
  }

  /**
   * Lấy sản phẩm phổ biến dựa trên đánh giá và doanh số
   */
  async getPopularProducts(limit = 10): Promise<Product[]> {
    return this.productModel
      .find({
        status: 'active',
      })
      .sort({
        'flags.isBestSeller': -1,
        'reviews.averageRating': -1,
        'reviews.reviewCount': -1,
      })
      .limit(limit)
      .exec();
  }

  /**
   * Phương thức hỗ trợ để sắp xếp các đối tượng theo điểm số
   */
  private sortByScore(
    scoreObject: Record<string, number>,
    limit?: number,
  ): Array<{ id: string; score: number }> {
    const result = Object.entries(scoreObject)
      .map(([id, score]) => ({ id, score }))
      .sort((a, b) => b.score - a.score);

    return limit ? result.slice(0, limit) : result;
  }
}