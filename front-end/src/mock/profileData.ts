import { User, WishlistItem, Order, Notification, Review } from '../components/profile/types/index';
// Address removed as it's not used

// Mock data cho người dùng
export const mockUser: User = {
  _id: '1',
  name: 'Nguyễn Văn A',
  email: 'nguyenvana@example.com',
  phone: '0987654321',
  addresses: [
    {
      _id: '1',
      addressLine: '123 Đường Lê Lợi',
      wardName: 'Phường Bến Nghé',
      wardCode: '26734',
      districtName: 'Quận 1',
      districtCode: '760',
      provinceName: 'TP. Hồ Chí Minh',
      provinceCode: '79',
      country: 'Việt Nam',
      postalCode: '70000',
      isDefault: true,
    },
    {
      _id: '2',
      addressLine: '456 Đường Nguyễn Huệ',
      wardName: 'Phường Bến Thành',
      wardCode: '26737',
      districtName: 'Quận 1',
      districtCode: '760',
      provinceName: 'TP. Hồ Chí Minh',
      provinceCode: '79',
      country: 'Việt Nam',
      postalCode: '70000',
      isDefault: false,
    },
  ],
  role: 'user',
  customerLevel: 'Khách hàng vàng',
  totalOrders: 12,
  monthlyOrders: 5,
  wishlist: [
    { productId: '1', variantId: 'v1' },
    { productId: '2', variantId: null },
    { productId: '3', variantId: 'v2' }
  ],
  createdAt: '2023-01-01T00:00:00.000Z',
  updatedAt: '2023-01-01T00:00:00.000Z',
};

// Mock data cho wishlist items
export const mockWishlistItems: WishlistItem[] = [
  {
    _id: '1', // Thêm _id để phù hợp với API
    productId: '1',
    variantId: 'v1',
    name: 'Kem dưỡng ẩm Neutrogena',
    slug: 'kem-duong-am-neutrogena',
    price: 250000,
    currentPrice: 200000,
    image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80',
    brand: {
      name: 'Neutrogena',
      slug: 'neutrogena',
      logo: 'https://example.com/brands/neutrogena.png'
    },
    inStock: true,
    options: { // Đổi từ variantOptions thành options để phù hợp với API
      size: 'Full size',
    }
  },
  {
    _id: '2',
    productId: '2',
    variantId: null, // Sản phẩm không có biến thể
    name: 'Serum Vitamin C The Ordinary',
    slug: 'serum-vitamin-c-the-ordinary',
    price: 450000,
    currentPrice: 450000,
    image: 'https://images.unsplash.com/photo-1542272604-787c3835535d?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80',
    brand: {
      name: 'The Ordinary',
      slug: 'the-ordinary',
      logo: 'https://example.com/brands/the-ordinary.png'
    },
    inStock: true,
    options: {} // Thêm options rỗng
  },
  {
    _id: '3',
    productId: '3',
    variantId: 'v3',
    name: 'Son môi Dior Rouge',
    slug: 'son-moi-dior-rouge',
    price: 850000,
    currentPrice: 680000,
    image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80',
    brand: {
      name: 'Dior',
      slug: 'dior',
      logo: 'https://example.com/brands/dior.png'
    },
    inStock: true,
    options: { // Đổi từ variantOptions thành options
      shade: 'Ruby Red',
    }
  },
];

// Mock data cho đơn hàng
export const mockOrders: Order[] = [
  {
    _id: 'order1',
    orderNumber: 'ORD-2023-001',
    createdAt: '2023-05-15T08:30:00.000Z',
    status: 'delivered',
    products: [
      {
        productId: '1',
        variantId: 'v1',
        name: 'Kem dưỡng ẩm Neutrogena',
        image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80',
        options: {
          size: 'Full size',
        },
        quantity: 1,
        price: 200000,
      },
      {
        productId: '3',
        variantId: 'v2',
        name: 'Son môi Dior Rouge',
        image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80',
        options: {
          shade: 'Ruby Red',
        },
        quantity: 1,
        price: 680000,
      },
    ],
    totalPrice: 880000,
    finalPrice: 830000,
    voucher: {
      voucherId: 'voucher1',
      discountAmount: 50000,
    },
    shippingInfo: {
      address: '123 Đường Lê Lợi, Phường Bến Nghé, Quận 1, TP. Hồ Chí Minh',
      contact: 'Nguyễn Văn A - 0987654321',
    },
    tracking: {
      status: [
        {
          state: 'pending',
          description: 'Đơn hàng đã được đặt',
          timestamp: '2023-05-15T08:30:00.000Z',
        },
        {
          state: 'confirmed',
          description: 'Đơn hàng đã được xác nhận',
          timestamp: '2023-05-15T09:15:00.000Z',
        },
        {
          state: 'processing',
          description: 'Đơn hàng đang được xử lý',
          timestamp: '2023-05-15T10:30:00.000Z',
        },
        {
          state: 'shipping',
          description: 'Đơn hàng đang được giao',
          timestamp: '2023-05-16T08:00:00.000Z',
        },
        {
          state: 'delivered',
          description: 'Đơn hàng đã được giao thành công',
          timestamp: '2023-05-17T14:20:00.000Z',
        },
      ],
      shippingCarrier: {
        name: 'GHN Express',
        trackingNumber: 'GHN123456789',
        trackingUrl: 'https://ghn.vn/tracking',
      },
      estimatedDelivery: '2023-05-17T12:00:00.000Z',
      actualDelivery: '2023-05-17T14:20:00.000Z',
    },
  },
  {
    _id: 'order2',
    orderNumber: 'ORD-2023-002',
    createdAt: '2023-06-20T14:45:00.000Z',
    status: 'shipping',
    products: [
      {
        productId: '2',
        variantId: undefined, // Sản phẩm không có biến thể
        name: 'Serum Vitamin C The Ordinary',
        image: 'https://images.unsplash.com/photo-1542272604-787c3835535d?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80',
        options: {}, // Thêm options rỗng
        quantity: 2,
        price: 450000,
      },
    ],
    totalPrice: 900000,
    finalPrice: 900000,
    shippingInfo: {
      address: '456 Đường Nguyễn Huệ, Phường Bến Thành, Quận 1, TP. Hồ Chí Minh',
      contact: 'Nguyễn Văn A - 0987654321',
    },
    tracking: {
      status: [
        {
          state: 'pending',
          description: 'Đơn hàng đã được đặt',
          timestamp: '2023-06-20T14:45:00.000Z',
        },
        {
          state: 'confirmed',
          description: 'Đơn hàng đã được xác nhận',
          timestamp: '2023-06-20T15:30:00.000Z',
        },
        {
          state: 'processing',
          description: 'Đơn hàng đang được xử lý',
          timestamp: '2023-06-21T09:00:00.000Z',
        },
        {
          state: 'shipping',
          description: 'Đơn hàng đang được giao',
          timestamp: '2023-06-22T08:15:00.000Z',
        },
      ],
      shippingCarrier: {
        name: 'J&T Express',
        trackingNumber: 'JT987654321',
        trackingUrl: 'https://jtexpress.vn/tracking',
      },
      estimatedDelivery: '2023-06-24T12:00:00.000Z',
    },
  },
];

// Mock data cho thông báo
export const mockNotifications: Notification[] = [
  {
    _id: 'notif1',
    title: 'Đơn hàng đã được giao',
    message: 'Đơn hàng #ORD-2023-001 của bạn đã được giao thành công.',
    type: 'order',
    isRead: false,
    createdAt: '2023-05-17T14:30:00.000Z',
    relatedId: 'order1',
  },
  {
    _id: 'notif2',
    title: 'Khuyến mãi mới',
    message: 'Giảm 20% cho tất cả sản phẩm chăm sóc da từ ngày 01/07 đến 15/07.',
    type: 'promotion',
    isRead: true,
    createdAt: '2023-06-28T09:00:00.000Z',
    relatedId: 'promo1',
  },
  {
    _id: 'notif3',
    title: 'Đơn hàng đang được giao',
    message: 'Đơn hàng #ORD-2023-002 của bạn đang được giao.',
    type: 'order',
    isRead: false,
    createdAt: '2023-06-22T08:30:00.000Z',
    relatedId: 'order2',
  },
];

// Mock data cho các đánh giá
export const mockReviews: Review[] = [
  {
    _id: 'review1',
    productId: '1',
    productName: 'Kem dưỡng ẩm Neutrogena',
    productImage: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80',
    rating: 4.5,
    title: 'Sản phẩm tuyệt vời',
    comment: 'Kem dưỡng ẩm rất hiệu quả, da mình đã cải thiện đáng kể sau 2 tuần sử dụng. Kết cấu mỏng nhẹ, thẩm thấu nhanh và không gây nhờn rít.',
    images: [
      'https://images.unsplash.com/photo-1556228578-0d85b1a4d571?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80',
      'https://images.unsplash.com/photo-1556228720-195a672e8a03?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80'
    ],
    createdAt: '2023-05-20T10:15:00.000Z',
    updatedAt: '2023-05-20T10:15:00.000Z', // Thêm updatedAt
    isVerifiedPurchase: true,
  },
  {
    _id: 'review2',
    productId: '3',
    productName: 'Son môi Dior Rouge',
    productImage: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80',
    rating: 5,
    title: 'Son môi chuẩn màu, lên màu đẹp',
    comment: 'Son lên màu rất đẹp, chất son mịn, mướt, không gây khô môi. Màu Ruby Red rất sang trọng, phù hợp cả ngày lẫn đêm. Sẽ mua thêm các màu khác.',
    images: [], // Thêm mảng images rỗng
    createdAt: '2023-05-25T15:30:00.000Z',
    updatedAt: '2023-05-25T15:30:00.000Z', // Thêm updatedAt
    isVerifiedPurchase: true,
  }
];
