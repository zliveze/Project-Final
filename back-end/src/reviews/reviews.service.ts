import { Injectable, NotFoundException, BadRequestException, Logger, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Review, ReviewDocument } from './schemas/review.schema';
import { CreateReviewDto, UpdateReviewDto, QueryReviewDto } from './dto';
import { OrderStatus } from '../orders/schemas/order.schema';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import * as fs from 'fs';
import { promisify } from 'util';

@Injectable()
export class ReviewsService {
  private readonly logger = new Logger(ReviewsService.name);

  constructor(
    @InjectModel(Review.name) private readonly reviewModel: Model<ReviewDocument>,
    @InjectModel('Order') private readonly orderModel: Model<any>,
    @InjectModel('Product') private readonly productModel: Model<any>,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  // Tìm tất cả đánh giá của một người dùng cụ thể
  async findAllByUser(userId: string): Promise<ReviewDocument[]> {
    const reviewsData = await this.reviewModel.find({
      userId: new Types.ObjectId(userId),
      isDeleted: false
    })
    .populate('userId', '_id name')
    .sort({ createdAt: -1 })
    .lean()
    .exec();

    return reviewsData.map(r => {
      const reviewObj = { ...r } as any;
      if (reviewObj.userId && typeof reviewObj.userId === 'object') {
        reviewObj.user = reviewObj.userId;
      }
      return reviewObj;
    }) as ReviewDocument[];
  }

  // Tìm tất cả đánh giá của một sản phẩm cụ thể
  async findAllByProduct(productId: string, status: string = 'approved', currentUserId?: string): Promise<ReviewDocument[]> {
    const query: any = {
      productId: new Types.ObjectId(productId),
      isDeleted: false
    };

    if (status) {
      query.status = status;
    }

    const reviewsData = await this.reviewModel.find(query)
      .populate('userId', '_id name')
      .sort({ createdAt: -1 })
      .lean()
      .exec();

    const reviewsWithUserField = reviewsData.map(r => {
      const reviewObj = { ...r } as any;
      if (reviewObj.userId && typeof reviewObj.userId === 'object') {
        reviewObj.user = reviewObj.userId;
      }
      return reviewObj;
    });

    if (currentUserId) {
      const userObjectId = new Types.ObjectId(currentUserId);
      return reviewsWithUserField.map(review => {
        const isLiked = review.likedBy && Array.isArray(review.likedBy) &&
          review.likedBy.some(id => id.toString() === userObjectId.toString());
        return { ...review, isLiked };
      }) as ReviewDocument[];
    }

    return reviewsWithUserField as ReviewDocument[];
  }

  // Lấy danh sách đánh giá đã like của người dùng
  async findLikedByUser(userId: string): Promise<ReviewDocument[]> {
    const userObjectId = new Types.ObjectId(userId);

    return this.reviewModel.find({
      likedBy: userObjectId,
      status: 'approved',
      isDeleted: false
    })
    .select('userId productId productName productImage rating content images likes status createdAt verified')
    .populate('userId', '_id name')
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

    const reviewsData = await this.reviewModel
      .find(query)
      .populate('userId', '_id name')
      .skip((page - 1) * limit)
      .limit(limit)
      .sort({ createdAt: -1 })
      .lean()
      .exec();

    const reviewsWithUserField = reviewsData.map(r => {
      const reviewObj = { ...r } as any;
      if (reviewObj.userId && typeof reviewObj.userId === 'object') {
        reviewObj.user = reviewObj.userId;
      }
      return reviewObj;
    });

    return { reviews: reviewsWithUserField as ReviewDocument[], totalItems, totalPages };
  }

  // Lấy thông tin chi tiết một đánh giá
  async findOne(id: string): Promise<ReviewDocument> {
    this.logger.debug(`[ReviewsService] findOne called with id: ${id}`);
    let review: ReviewDocument | null = null;
    try {
      review = await this.reviewModel.findById(id).exec();
      this.logger.debug(`[ReviewsService] findById result for id ${id}: ${review ? review._id.toString() : 'null'}`);
    } catch (error) {
      this.logger.error(`[ReviewsService] Error in findById for id ${id}:`, error);
      throw error; // Re-throw error if findById itself fails
    }

    if (!review) {
      this.logger.warn(`[ReviewsService] Review not found for id: ${id}`);
      throw new NotFoundException(`Không tìm thấy đánh giá với ID ${id}`);
    }
    if (review.isDeleted) {
      this.logger.warn(`[ReviewsService] Review with id: ${id} is marked as deleted.`);
      throw new NotFoundException(`Đánh giá với ID ${id} đã bị xóa.`);
    }
    this.logger.debug(`[ReviewsService] Review found and not deleted for id: ${id}`);
    return review;
  }

  // Kiểm tra xem người dùng đã mua sản phẩm với trạng thái hoàn thành chưa
  async checkUserPurchasedProduct(userId: string, productId: string): Promise<boolean> {
    try {
      this.logger.debug(`Kiểm tra người dùng ${userId} đã mua sản phẩm ${productId} chưa`);

      // Chuyển đổi userId sang ObjectId
      const userObjectId = new Types.ObjectId(userId);

      // Tìm đơn hàng đã hoàn thành của người dùng có chứa sản phẩm này
      // Lưu ý: Không chuyển đổi productId sang ObjectId vì trong đơn hàng nó có thể là chuỗi
      const completedOrders = await this.orderModel.find({
        userId: userObjectId,
        status: OrderStatus.DELIVERED,
        $or: [
          { 'items.productId': productId }, // Trường hợp productId là chuỗi
          { 'items.productId': new Types.ObjectId(productId) } // Trường hợp productId là ObjectId
        ]
      }).lean().exec();

      this.logger.debug(`Tìm thấy ${completedOrders.length} đơn hàng đã hoàn thành cho sản phẩm ${productId}`);

      // Log chi tiết đơn hàng để debug
      if (completedOrders.length > 0) {
        this.logger.debug(`Chi tiết đơn hàng đầu tiên: ${JSON.stringify(completedOrders[0])}`);
      }

      return completedOrders.length > 0;
    } catch (error) {
      this.logger.error(`Lỗi khi kiểm tra mua hàng: ${error.message}`, error.stack);
      return false;
    }
  }

  // Kiểm tra xem người dùng đã đánh giá sản phẩm chưa
  async checkUserReviewedProduct(userId: string, productId: string): Promise<boolean> {
    try {
      this.logger.debug(`Kiểm tra người dùng ${userId} đã đánh giá sản phẩm ${productId} chưa`);

      // Chuyển đổi userId sang ObjectId
      const userObjectId = new Types.ObjectId(userId);

      // Tìm đánh giá hiện có
      const existingReview = await this.reviewModel.findOne({
        userId: userObjectId,
        $or: [
          { productId: productId }, // Trường hợp productId là chuỗi
          { productId: new Types.ObjectId(productId) } // Trường hợp productId là ObjectId
        ],
        isDeleted: false
      }).lean().exec();

      this.logger.debug(`Kết quả kiểm tra đánh giá: ${!!existingReview}`);

      return !!existingReview;
    } catch (error) {
      this.logger.error(`Lỗi khi kiểm tra đánh giá: ${error.message}`, error.stack);
      return false;
    }
  }

  // Upload ảnh đánh giá lên Cloudinary
  async uploadReviewImages(files: Express.Multer.File[]): Promise<{ url: string; alt?: string; publicId?: string }[]> {
    try {
      if (!files || files.length === 0) {
        return [];
      }

      const unlinkAsync = promisify(fs.unlink);
      const uploadedImages: { url: string; alt?: string; publicId?: string }[] = [];

      for (const file of files) {
        try {
          // Upload ảnh lên Cloudinary
          const result = await this.cloudinaryService.uploadImageFile(file.path, {
            folder: 'Yumin/reviews',
            tags: ['review', 'user-content'],
          });

          // Thêm ảnh vào danh sách kết quả
          uploadedImages.push({
            url: result.secureUrl,
            alt: `Review image ${uploadedImages.length + 1}`,
            publicId: result.publicId
          });

          // Xóa file tạm sau khi upload
          await unlinkAsync(file.path);
        } catch (error) {
          this.logger.error(`Lỗi khi upload ảnh: ${error.message}`, error.stack);
          // Vẫn tiếp tục với các ảnh khác nếu có lỗi
          try {
            await unlinkAsync(file.path);
          } catch (e) {
            // Bỏ qua lỗi khi xóa file
          }
        }
      }

      return uploadedImages;
    } catch (error) {
      this.logger.error(`Lỗi khi upload ảnh đánh giá: ${error.message}`, error.stack);
      throw new BadRequestException('Không thể upload ảnh đánh giá');
    }
  }

  // Tạo đánh giá mới
  async create(createReviewDto: CreateReviewDto, files?: Express.Multer.File[]): Promise<ReviewDocument> {
    try {
      const { userId, productId } = createReviewDto;

      this.logger.debug(`Tạo đánh giá mới: userId=${userId}, productId=${productId}`);

      // Kiểm tra các trường bắt buộc
      if (!userId) {
        throw new BadRequestException('Thiếu thông tin userId');
      }

      if (!productId) {
        throw new BadRequestException('Thiếu thông tin productId');
      }

      if (!createReviewDto.rating) {
        throw new BadRequestException('Thiếu thông tin rating');
      }

      if (!createReviewDto.content) {
        throw new BadRequestException('Thiếu thông tin content');
      }

      // Kiểm tra xem người dùng đã mua sản phẩm với trạng thái hoàn thành chưa
      const hasPurchased = await this.checkUserPurchasedProduct(userId, productId);
      if (!hasPurchased) {
        throw new ForbiddenException('Bạn cần mua sản phẩm và nhận hàng thành công trước khi đánh giá');
      }

      // Kiểm tra xem người dùng đã đánh giá sản phẩm này chưa
      const hasReviewed = await this.checkUserReviewedProduct(userId, productId);
      if (hasReviewed) {
        throw new BadRequestException('Bạn đã đánh giá sản phẩm này rồi');
      }

      // Lấy thông tin sản phẩm nếu chưa có
      if (!createReviewDto.productName || !createReviewDto.productImage) {
        try {
          // Thử tìm sản phẩm bằng ObjectId
          let product: any = null;
          try {
            product = await this.productModel.findById(new Types.ObjectId(productId)).lean().exec();
          } catch (e) {
            // Nếu không thể chuyển đổi sang ObjectId, thử tìm bằng chuỗi
            this.logger.debug(`Không thể chuyển đổi ${productId} sang ObjectId, thử tìm bằng chuỗi`);
            product = await this.productModel.findOne({ _id: productId }).lean().exec();
          }

          if (!product) {
            throw new NotFoundException(`Không tìm thấy sản phẩm với ID ${productId}`);
          }

          // Kiểm tra xem product có phải là một mảng không
          if (Array.isArray(product)) {
            if (product.length > 0) {
              const firstProduct = product[0] as any;
              createReviewDto.productName = createReviewDto.productName || firstProduct.name || '';
              createReviewDto.productImage = createReviewDto.productImage ||
                (firstProduct.images && firstProduct.images.length > 0 ? firstProduct.images[0].url : '');
            }
          } else {
            const productObj = product as any;
            createReviewDto.productName = createReviewDto.productName || (productObj.name || '');
            createReviewDto.productImage = createReviewDto.productImage ||
              (productObj.images && productObj.images.length > 0 ? productObj.images[0].url : '');
          }
        } catch (error) {
          this.logger.error(`Lỗi khi lấy thông tin sản phẩm: ${error.message}`, error.stack);
          // Nếu không tìm thấy sản phẩm, vẫn cho phép đánh giá với thông tin tối thiểu
          createReviewDto.productName = createReviewDto.productName || 'Sản phẩm không xác định';
          createReviewDto.productImage = createReviewDto.productImage || '';
        }
      }

      // Upload ảnh lên Cloudinary nếu có
      if (files && files.length > 0) {
        const uploadedImages = await this.uploadReviewImages(files);
        createReviewDto.images = uploadedImages;
      }

      // Tạo đánh giá mới
      const newReview = new this.reviewModel(createReviewDto);
      const savedReview = await newReview.save();

      // Cập nhật thông tin đánh giá trong sản phẩm
      await this.updateProductReviewStats(productId);

      // Đã loại bỏ thông báo WebSocket

      return savedReview;
    } catch (error) {
      this.logger.error(`Lỗi khi tạo đánh giá: ${error.message}`, error.stack);
      throw error;
    }
  }

  // Cập nhật đánh giá
  async update(id: string, updateReviewDto: UpdateReviewDto, currentUserId?: string, files?: Express.Multer.File[]): Promise<ReviewDocument> {
    try {
      const review = await this.findOne(id);

      // Kiểm tra quyền: nếu currentUserId được cung cấp, phải là chủ đánh giá
      if (currentUserId && review.userId.toString() !== currentUserId) {
        throw new ForbiddenException('Bạn không có quyền chỉnh sửa đánh giá này');
      }

      // Không cho phép cập nhật reviewId và userId
      delete (updateReviewDto as any).reviewId;
      delete (updateReviewDto as any).userId;
      delete (updateReviewDto as any).productId;

      // Đánh dấu là đã chỉnh sửa
      const updatedData: any = { ...updateReviewDto, isEdited: true };

      // Đặt lại trạng thái về pending nếu người dùng chỉnh sửa nội dung hoặc rating
      if (updateReviewDto.content || updateReviewDto.rating) {
        updatedData.status = 'pending';
      }

      // Xử lý cập nhật hình ảnh
      if (updateReviewDto.images) {
        // Nếu đã được cung cấp images qua body (từ existingImages), sử dụng nó
        this.logger.debug(`Sử dụng images từ updateReviewDto: ${JSON.stringify(updateReviewDto.images)}`);
        updatedData.images = updateReviewDto.images;
      }

      // Upload ảnh mới lên Cloudinary nếu có
      if (files && files.length > 0) {
        const uploadedImages = await this.uploadReviewImages(files);

        // Kết hợp với ảnh hiện có từ updatedData.images nếu có
        if (updatedData.images && updatedData.images.length > 0) {
          updatedData.images = [...updatedData.images, ...uploadedImages];
        } else if (review.images && review.images.length > 0 && !updateReviewDto.images) {
          // Nếu không có updatedData.images nhưng có ảnh cũ và không có yêu cầu xóa ảnh
          updatedData.images = [...review.images, ...uploadedImages];
        } else {
          // Nếu không có ảnh cũ hoặc đã xóa hết ảnh cũ
          updatedData.images = uploadedImages;
        }
      }

      // Áp dụng cập nhật
      Object.assign(review, updatedData);
      const updatedReview = await review.save();

      // Cập nhật thông tin đánh giá trong sản phẩm
      await this.updateProductReviewStats(review.productId.toString());

      return updatedReview;
    } catch (error) {
      this.logger.error(`Lỗi khi cập nhật đánh giá: ${error.message}`, error.stack);
      throw error;
    }
  }

  // Xóa mềm đánh giá
  async softDelete(id: string, currentUserId?: string): Promise<void> {
    try {
      const review = await this.findOne(id);

      // Kiểm tra quyền: nếu currentUserId được cung cấp, phải là chủ đánh giá
      if (currentUserId && review.userId.toString() !== currentUserId) {
        throw new ForbiddenException('Bạn không có quyền xóa đánh giá này');
      }

      review.isDeleted = true;
      await review.save();

      // Cập nhật thông tin đánh giá trong sản phẩm
      await this.updateProductReviewStats(review.productId.toString());

      // Đã loại bỏ thông báo WebSocket
    } catch (error) {
      this.logger.error(`Lỗi khi xóa mềm đánh giá: ${error.message}`, error.stack);
      throw error;
    }
  }

  // Xóa cứng đánh giá (chỉ dùng cho admin)
  async hardDelete(id: string): Promise<void> {
    try {
      const review = await this.findOne(id);
      const productId = review.productId.toString();
      const userId = review.userId.toString();

      const result = await this.reviewModel.deleteOne({ _id: id }).exec();
      if (result.deletedCount === 0) {
        throw new NotFoundException(`Không tìm thấy đánh giá với ID ${id}`);
      }

      // Cập nhật thông tin đánh giá trong sản phẩm
      await this.updateProductReviewStats(productId);

      // Đã loại bỏ thông báo WebSocket
    } catch (error) {
      this.logger.error(`Lỗi khi xóa cứng đánh giá: ${error.message}`, error.stack);
      throw error;
    }
  }

  // Cập nhật trạng thái đánh giá
  async updateStatus(id: string, status: 'pending' | 'approved' | 'rejected'): Promise<ReviewDocument> {
    try {
      const review = await this.findOne(id);
      review.status = status;
      const updatedReview = await review.save();

      // Cập nhật thông tin đánh giá trong sản phẩm
      await this.updateProductReviewStats(review.productId.toString());

      // Đã loại bỏ thông báo WebSocket

      return updatedReview;
    } catch (error) {
      this.logger.error(`Lỗi khi cập nhật trạng thái đánh giá: ${error.message}`, error.stack);
      throw error;
    }
  }

  // Cập nhật thống kê đánh giá trong sản phẩm
  async updateProductReviewStats(productId: string): Promise<void> {
    try {
      // Tính toán điểm trung bình và số lượng đánh giá
      const averageRating = await this.getAverageRating(productId);
      const reviewCount = await this.reviewModel.countDocuments({
        productId: new Types.ObjectId(productId),
        status: 'approved',
        isDeleted: false
      });

      // Cập nhật thông tin trong sản phẩm
      await this.productModel.findByIdAndUpdate(productId, {
        'reviews.averageRating': averageRating,
        'reviews.reviewCount': reviewCount
      });
    } catch (error) {
      this.logger.error(`Lỗi khi cập nhật thống kê đánh giá sản phẩm: ${error.message}`, error.stack);
      // Không throw lỗi để tránh ảnh hưởng đến luồng chính
    }
  }

  // Toggle thích/bỏ thích một đánh giá
  async toggleLikeReview(id: string, userId: string): Promise<ReviewDocument> {
    try {
      this.logger.debug(`Toggle like review: reviewId=${id}, userId=${userId}`);
      
      // Validate input parameters
      if (!id || id.trim() === '') {
        throw new BadRequestException('Review ID không hợp lệ');
      }
      
      if (!userId || userId.trim() === '') {
        throw new BadRequestException('User ID không hợp lệ');
      }

      // Validate ObjectId format
      if (!Types.ObjectId.isValid(id)) {
        throw new BadRequestException(`Review ID "${id}" không đúng định dạng ObjectId`);
      }
      
      if (!Types.ObjectId.isValid(userId)) {
        throw new BadRequestException(`User ID "${userId}" không đúng định dạng ObjectId`);
      }

      // Tìm review
      const review = await this.reviewModel.findOne({
        _id: new Types.ObjectId(id),
        isDeleted: false
      }).exec();

      if (!review) {
        throw new NotFoundException(`Không tìm thấy đánh giá với ID ${id}`);
      }

      this.logger.debug(`Found review: ${review._id}, current likes: ${review.likes}`);

      const userObjectId = new Types.ObjectId(userId);

      // Kiểm tra xem người dùng đã thích đánh giá này chưa
      const userIndex = review.likedBy ? review.likedBy.findIndex(
        id => id.toString() === userObjectId.toString()
      ) : -1;

      this.logger.debug(`User like status: ${userIndex !== -1 ? 'liked' : 'not liked'}`);

      if (userIndex === -1) {
        // Người dùng chưa thích đánh giá này => thêm vào danh sách likedBy và tăng số lượt thích
        if (!review.likedBy) {
          review.likedBy = [];
        }
        review.likedBy.push(userObjectId);
        review.likes += 1;
        this.logger.debug(`Added like: new likes count = ${review.likes}`);
      } else {
        // Người dùng đã thích đánh giá này => xóa khỏi danh sách likedBy và giảm số lượt thích
        review.likedBy.splice(userIndex, 1);
        if (review.likes > 0) {
          review.likes -= 1;
        }
        this.logger.debug(`Removed like: new likes count = ${review.likes}`);
      }

      const savedReview = await review.save();
      this.logger.debug(`Successfully saved review with ${savedReview.likes} likes`);
      
      return savedReview;
    } catch (error) {
      this.logger.error(`Lỗi khi toggle like đánh giá: ${error.message}`, error.stack);
      
      // Rethrow với thông tin chi tiết hơn
      if (error instanceof BadRequestException || error instanceof NotFoundException) {
        throw error;
      }
      
      // Nếu là lỗi MongoDB hoặc lỗi khác, wrap trong InternalServerErrorException
      throw new BadRequestException(`Không thể thực hiện thao tác thích/bỏ thích: ${error.message}`);
    }
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
