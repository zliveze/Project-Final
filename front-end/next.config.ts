import type { NextConfig } from "next";
require('dotenv').config();

const nextConfig: NextConfig = {
  /* config options here */
  reactStrictMode: true,
  images: {
    domains: ['media.hcdn.vn', 'theme.hstatic.net'],
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'media.hcdn.vn',
        port: '',
        pathname: '/catalog/product/**',
      },
      {
        protocol: 'https',
        hostname: 'theme.hstatic.net',
        port: '',
        pathname: '/**',
      },{
        protocol: 'https',
        hostname: 'upload.wikimedia.org',
        port: '',
        pathname: '/**',
      },{
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },{
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },{
        protocol: 'https',
        hostname: 'product.hstatic.net',
        port: '',
        pathname: '/**',
      },{
        protocol: 'https',
        hostname: 'cdn.shopify.com',
        port: '',
        pathname: '/**',
      },{
        protocol: 'https',
        hostname: 'via.placeholder.com',
        port: '',
        pathname: '/**',
      }
    ],
  },
  // Cấu hình cho trang 404 và xử lý lỗi
  onDemandEntries: {
    // Giữ các trang được tạo ra trong bộ nhớ cache lâu hơn
    maxInactiveAge: 25 * 1000,
    // Số lượng trang được giữ trong bộ nhớ
    pagesBufferLength: 5,
  },
  
  // Thêm proxy để bypass CORS
  async rewrites() {
    return [
      {
        source: '/api/auth/:path*',
        destination: 'http://localhost:3001/auth/:path*',
      },
      {
        source: '/api/admin/auth/:path*',
        destination: 'http://localhost:3001/admin/auth/:path*',
      },
      {
        source: '/api/admin/users/stats',
        destination: 'http://localhost:3001/admin/users/stats',
      },
      {
        source: '/api/admin/users/:path*',
        destination: 'http://localhost:3001/admin/users/:path*',
      },
      {
        source: '/api/admin/reviews/:path*',
        destination: 'http://localhost:3001/admin/reviews/:path*',
      },
      {
        source: '/api/admin/notifications/:path*',
        destination: 'http://localhost:3001/admin/notifications/:path*',
      },
      {
        source: '/api/admin/notifications',
        destination: 'http://localhost:3001/admin/notifications',
      },
      // Thêm proxy cho Banner API
      {
        source: '/banners/active',
        destination: 'http://localhost:3001/banners/active',
      },
      {
        source: '/banners/:path*',
        destination: 'http://localhost:3001/banners/:path*',
      },
      {
        source: '/api/admin/banners/:path*',
        destination: 'http://localhost:3001/admin/banners/:path*',
      },
      {
        source: '/api/admin/banners',
        destination: 'http://localhost:3001/admin/banners',
      },
    ];
  },
};

export default nextConfig;
