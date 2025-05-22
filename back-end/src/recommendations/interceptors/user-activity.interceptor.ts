import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { UserActivityService } from '../services/user-activity.service';

@Injectable()
export class UserActivityInterceptor implements NestInterceptor {
  constructor(private readonly userActivityService: UserActivityService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const { url, method, user, query, params, body } = request;

    // Chỉ ghi nhận hoạt động nếu người dùng đã đăng nhập
    if (!user) {
      return next.handle();
    }

    const userId = user.userId;

    // Ghi nhận hoạt động xem sản phẩm
    if (method === 'GET' && url.includes('/products/') && !url.includes('/products/search') && !url.includes('/products?')) {
      const productId = params.id || url.split('/products/')[1]?.split('?')[0]?.split('/')[0];
      if (productId && productId !== 'search' && productId.length === 24) { // MongoDB ObjectId length
        this.userActivityService.logProductView(userId, productId).catch(err =>
          console.error('Error logging product view:', err)
        );
      }
    }

    // Ghi nhận hoạt động tìm kiếm
    if (method === 'GET' && url.includes('/products/search') && query.q) {
      this.userActivityService.logSearch(userId, query.q).catch(err =>
        console.error('Error logging search:', err)
      );
    }

    // Ghi nhận hoạt động thêm vào giỏ hàng
    if (method === 'POST' && url.includes('/carts/add')) {
      const productId = body.productId;
      if (productId) {
        this.userActivityService.logAddToCart(userId, productId, body.variantId).catch(err =>
          console.error('Error logging add to cart:', err)
        );
      }
    }

    // Ghi nhận hoạt động lọc sản phẩm
    if (method === 'GET' && url.includes('/products') && Object.keys(query).length > 0) {
      const filters = {};

      if (query.minPrice || query.maxPrice) {
        filters['price'] = {
          min: query.minPrice ? Number(query.minPrice) : undefined,
          max: query.maxPrice ? Number(query.maxPrice) : undefined,
        };
      }

      if (query.categories) {
        filters['categoryIds'] = Array.isArray(query.categories)
          ? query.categories
          : [query.categories];
      }

      if (query.brands) {
        filters['brandIds'] = Array.isArray(query.brands)
          ? query.brands
          : [query.brands];
      }

      if (query.tags) {
        filters['tags'] = Array.isArray(query.tags) ? query.tags : [query.tags];
      }

      if (query.skinType) {
        filters['skinType'] = Array.isArray(query.skinType)
          ? query.skinType
          : [query.skinType];
      }

      if (query.concerns) {
        filters['concerns'] = Array.isArray(query.concerns)
          ? query.concerns
          : [query.concerns];
      }

      if (Object.keys(filters).length > 0) {
        this.userActivityService.logFilterUse(userId, filters).catch(err =>
          console.error('Error logging filter use:', err)
        );
      }
    }

    return next.handle().pipe(
      tap(() => {
        // Ghi nhận hoạt động mua hàng sau khi đặt hàng thành công
        if (method === 'POST' && url.includes('/orders') && body.products) {
          body.products.forEach((product: any) => {
            this.userActivityService.logPurchase(
              userId,
              product.productId,
              product.variantId,
            ).catch(err =>
              console.error('Error logging purchase:', err)
            );
          });
        }
      }),
    );
  }
}