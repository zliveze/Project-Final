import type { NextConfig } from "next";
require('dotenv').config();

const nextConfig: NextConfig = {
  /* config options here */
  reactStrictMode: true,
  env: {
    NEXT_PUBLIC_API_URL: 'http://localhost:3001/api', // URL của backend API
  },
  images: {
    domains: ['media.hcdn.vn', 'theme.hstatic.net', 'via.placeholder.com', 'res.cloudinary.com'],
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
      },{
        protocol: 'https',
        hostname: 'res.cloudinary.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'cdn-images.kiotviet.vn',
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
  
  // Cấu hình CORS cho API routes
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Credentials', value: 'true' },
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET,DELETE,PATCH,POST,PUT' },
          { key: 'Access-Control-Allow-Headers', value: 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization' },
        ],
      },
    ];
  },
};

export default nextConfig;
