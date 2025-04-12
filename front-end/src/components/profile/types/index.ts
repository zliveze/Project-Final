// Types for Profile component
// Định nghĩa các kiểu dữ liệu dùng cho Profile

// Type cho tabs
export type TabType = 'account' | 'wishlist' | 'orders' | 'notifications' | 'reviews';

// Type cho trạng thái đơn hàng
export type OrderStatusType = 'all' | 'pending' | 'confirmed' | 'processing' | 'shipping' | 'delivered' | 'cancelled';

// Type cho địa chỉ (đồng bộ với Backend Schema)
export interface Address {
  _id: string; // Sử dụng _id thay vì addressId
  addressLine: string;
  city: string;
  state?: string; // Thêm state (tùy chọn)
  // district?: string; // Bỏ district nếu không dùng ở backend
  // ward?: string; // Bỏ ward nếu không dùng ở backend
  country: string;
  postalCode?: string; // postalCode là tùy chọn
  isDefault?: boolean; // isDefault là tùy chọn
}

// Type cho người dùng
export interface User {
  _id: string;
  name: string;
  email: string;
  phone: string;
  addresses: Address[];
  role: string;
  customerLevel?: string; // Thêm cấp độ khách hàng
  totalOrders?: number; // Tổng số đơn hàng
  monthlyOrders?: number; // Số đơn hàng trong tháng
  wishlist?: Array<{ productId: string; variantId: string | null }>;
  createdAt: string;
  updatedAt?: string;
}

// Type cho sản phẩm trong wishlist (Updated to match WishlistContext and backend response)
export interface WishlistItem {
    productId: string; // Use productId from backend response
    variantId: string;
    name: string;
    slug: string;
    price: number;
    currentPrice: number;
    image: string; // URL of the image
    brand: {
        name: string;
        slug: string;
        logo?: string; // Optional logo URL
    } | null;
    inStock: boolean;
    variantOptions?: any; // Optional: Color, Size, etc. from variant
    // _id can be added if needed, but productId/variantId are the identifiers
}


// Type cho sản phẩm trong đơn hàng
export interface OrderProduct {
  productId: string;
  variantId?: string;
  name: string;
  image: string;
  options?: {
    shade?: string;
    size?: string;
    [key: string]: string | undefined;
  };
  quantity: number;
  price: number;
}

// Type cho trạng thái trong quá trình vận chuyển
export interface OrderTrackingStatus {
  state: string;
  description: string;
  timestamp: string;
}

// Type cho đơn vị vận chuyển
export interface ShippingCarrier {
  name: string;
  trackingNumber: string;
  trackingUrl: string;
}

// Type cho thông tin theo dõi đơn hàng
export interface OrderTracking {
  status: OrderTrackingStatus[];
  shippingCarrier?: ShippingCarrier;
  estimatedDelivery?: string;
  actualDelivery?: string;
}

// Type cho voucher
export interface Voucher {
  voucherId: string;
  discountAmount: number;
}

// Type cho thông tin giao hàng
export interface ShippingInfo {
  address: string;
  contact: string;
}

// Type cho đơn hàng
export interface Order {
  _id: string;
  orderNumber: string;
  createdAt: string;
  status: string;
  products: OrderProduct[];
  totalPrice: number;
  finalPrice: number;
  voucher?: Voucher;
  shippingInfo: ShippingInfo;
  tracking?: OrderTracking;
}

// Type cho thông báo
export interface Notification {
  _id: string;
  title: string;
  message: string;
  type: 'order' | 'promotion' | 'system';
  isRead: boolean;
  createdAt: string;
  relatedId?: string;
  image?: string;
}

// Type cho đánh giá
export interface Review {
  _id: string;
  productId: string;
  productName: string;
  productImage: string;
  rating: number;
  title: string;
  comment: string;
  images?: string[];
  createdAt: string;
  updatedAt?: string;
  isVerifiedPurchase: boolean;
}
