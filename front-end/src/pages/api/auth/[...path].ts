import { NextApiRequest, NextApiResponse } from 'next';
import httpProxy from 'http-proxy';
import Cors from 'cors';
import { ServerOptions } from 'http-proxy';

// Cấu hình backend API URL từ biến môi trường
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

// Khởi tạo proxy server
const proxy = httpProxy.createProxyServer();

// Khởi tạo middleware CORS
const cors = Cors({
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  origin: '*',
  optionsSuccessStatus: 200,
});

// Define proper types for middleware function
type MiddlewareFunction = (
  req: NextApiRequest,
  res: NextApiResponse,
  callback: (result?: Error | unknown) => void
) => void;

// Helper để thực thi middleware
function runMiddleware(req: NextApiRequest, res: NextApiResponse, fn: MiddlewareFunction) {
  return new Promise((resolve, reject) => {
    fn(req, res, (result?: Error | unknown) => {
      if (result instanceof Error) {
        return reject(result);
      }
      return resolve(result);
    });
  });
}

// Cấu hình proxy
const proxyOptions: ServerOptions = {
  target: API_URL,
  changeOrigin: true,
  // pathRewrite không có trong ServerOptions, sẽ xử lý thủ công
  // bằng cách thay đổi req.url trong handler
};

export const config = {
  api: {
    bodyParser: false,
    externalResolver: true,
  },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Thực thi CORS middleware
  await runMiddleware(req, res, cors);
  
  // Log yêu cầu
  console.log('Proxy API nhận yêu cầu:', req.url);
  console.log('Phương thức:', req.method);
  console.log('Body:', req.body);
  
  return new Promise<void>((resolve, reject) => {
    // Xóa /api khỏi đường dẫn
    if (req.url) {
      req.url = req.url.replace(/^\/api/, '');
    }
    
    console.log(`Proxy từ /api đến ${API_URL}${req.url}`);
    
    // Xử lý lỗi
    proxy.once('error', (err: Error) => {
      console.error('Proxy error:', err);
      res.status(500).json({ message: 'Lỗi kết nối đến backend API' });
      reject(err);
    });
    
    // Xử lý khi response được nhận
    proxy.once('proxyRes', (proxyRes) => {
      console.log('Nhận phản hồi từ backend:', proxyRes.statusCode);
      resolve();
    });
    
    // Chuyển tiếp yêu cầu đến backend API
    proxy.web(req, res, proxyOptions);
  });
} 