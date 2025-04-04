import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Review, ReviewDocument } from './schemas/review.schema';

@Injectable()
export class ReviewsService {
  constructor(
    @InjectModel(Review.name) private readonly reviewModel: Model<ReviewDocument>,
  ) {}

  // Tìm tất cả đánh giá của một người dùng cụ thể
  async findAllByUser(userId: string): Promise<ReviewDocument[]> {
    return this.reviewModel.find({ 
      userId: new Types.ObjectId(userId),
      isDeleted: false 
    })
    .select('productId productName productImage rating content images likes status createdAt')
    .sort({ createdAt: -1 })
    .lean()
    .exec();
  }

  // Tìm tất cả đánh giá của một sản phẩm cụ thể
  async findAllByProduct(productId: string, status: string = 'approved'): Promise<ReviewDocument[]> {
    const query: any = { 
      productId: new Types.ObjectId(productId),
      isDeleted: false 
    };
    
    if (status) {
      query.status = status;
    }
    
    return this.reviewModel.find(query)
      .select('userId productName rating content images likes status createdAt verified')
      .sort({ createdAt: -1 })
      .lean()
      .exec();
  }

  // Tìm tất cả đánh giá với phân trang
  async findAll(
    page: number = 1, 
    limit: number = 10, 
    status?: string,
    rating?: number,
    userId?: string
  ): Promise<{ reviews: ReviewDocument[], totalItems: number, totalPages: number }> {
    const query: any = { isDeleted: false };
    
    if (status && status !== 'all') {
      query.status = status;
    }
    
    if (rating && rating > 0) {
      query.rating = rating;
    }
    
    if (userId) {
      query.userId = new Types.ObjectId(userId);
    }
    
    const totalItems = await this.reviewModel.countDocuments(query);
    const totalPages = Math.ceil(totalItems / limit);
    
    const reviews = await this.reviewModel
      .find(query)
      .skip((page - 1) * limit)
      .limit(limit)
      .select('userId productId productName productImage rating content images likes status createdAt verified')
      .sort({ createdAt: -1 })
      .lean()
      .exec();
    
    return { reviews, totalItems, totalPages };
  }

  // Lấy thông tin chi tiết một đánh giá
  async findOne(id: string): Promise<ReviewDocument> {
    const review = await this.reviewModel.findById(id).exec();
    if (!review || review.isDeleted) {
      throw new NotFoundException(`Không tìm thấy đánh giá với ID ${id}`);
    }
    return review;
  }

  // Tạo đánh giá mới
  async create(createReviewDto: any): Promise<ReviewDocument> {
    const newReview = new this.reviewModel(createReviewDto);
    return newReview.save();
  }

  // Cập nhật đánh giá
  async update(id: string, updateReviewDto: any): Promise<ReviewDocument> {
    const review = await this.findOne(id);
    
    // Không cho phép cập nhật reviewId và userId
    delete updateReviewDto.reviewId;
    delete updateReviewDto.userId;
    
    // Đánh dấu là đã chỉnh sửa
    updateReviewDto.isEdited = true;
    
    // Áp dụng cập nhật
    Object.assign(review, updateReviewDto);
    return review.save();
  }

  // Xóa mềm đánh giá
  async softDelete(id: string): Promise<void> {
    const review = await this.findOne(id);
    review.isDeleted = true;
    await review.save();
  }

  // Xóa cứng đánh giá (chỉ dùng cho admin)
  async hardDelete(id: string): Promise<void> {
    const result = await this.reviewModel.deleteOne({ _id: id }).exec();
    if (result.deletedCount === 0) {
      throw new NotFoundException(`Không tìm thấy đánh giá với ID ${id}`);
    }
  }

  // Cập nhật trạng thái đánh giá
  async updateStatus(id: string, status: 'pending' | 'approved' | 'rejected'): Promise<ReviewDocument> {
    const review = await this.findOne(id);
    review.status = status;
    return review.save();
  }

  // Thích một đánh giá
  async likeReview(id: string): Promise<ReviewDocument> {
    const review = await this.findOne(id);
    review.likes += 1;
    return review.save();
  }

  // Bỏ thích một đánh giá
  async unlikeReview(id: string): Promise<ReviewDocument> {
    const review = await this.findOne(id);
    if (review.likes > 0) {
      review.likes -= 1;
    }
    return review.save();
  }
  
  // Đếm số lượng đánh giá theo trạng thái
  async countByStatus(
    status?: string,
    rating?: number,
    userId?: string
  ): Promise<Record<string, number>> {
    const query: any = { isDeleted: false };
    
    if (userId) {
      query.userId = new Types.ObjectId(userId);
    }
    
    if (rating && rating > 0) {
      query.rating = rating;
    }
    
    // Sử dụng aggregation để giảm số lượng truy vấn từ 4 xuống 1
    const result = await this.reviewModel.aggregate([
      { $match: query },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]).exec();
    
    // Khởi tạo kết quả mặc định
    const counts = {
      total: 0,
      pending: 0,
      approved: 0,
      rejected: 0
    };
    
    // Xử lý kết quả từ aggregation
    let total = 0;
    result.forEach(item => {
      const status = item._id;
      const count = item.count;
      total += count;
      
      if (status === 'pending' || status === 'approved' || status === 'rejected') {
        counts[status] = count;
      }
    });
    
    counts.total = total;
    return counts;
  }

  // Lấy điểm trung bình của đánh giá cho một sản phẩm
  async getAverageRating(productId: string): Promise<number> {
    const result = await this.reviewModel.aggregate([
      { 
        $match: { 
          productId: new Types.ObjectId(productId),
          status: 'approved',
          isDeleted: false
        } 
      },
      { 
        $group: { 
          _id: null, 
          averageRating: { $avg: '$rating' },
          count: { $sum: 1 }
        } 
      }
    ]).exec();
    
    return result.length > 0 ? Math.round(result[0].averageRating * 10) / 10 : 0;
  }
  
  // Lấy điểm đánh giá theo sao
  async getRatingDistribution(productId: string): Promise<Record<string, number>> {
    const result = await this.reviewModel.aggregate([
      { 
        $match: { 
          productId: new Types.ObjectId(productId),
          status: 'approved',
          isDeleted: false
        } 
      },
      { 
        $group: { 
          _id: '$rating', 
          count: { $sum: 1 } 
        } 
      },
      {
        $sort: { _id: 1 }
      }
    ]).exec();
    
    // Khởi tạo đối tượng phân phối
    const distribution = {
      '1': 0,
      '2': 0,
      '3': 0,
      '4': 0,
      '5': 0
    };
    
    // Điền vào kết quả từ aggregation
    result.forEach(item => {
      distribution[item._id.toString()] = item.count;
    });
    
    return distribution;
  }
} 