import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import * as express from 'express';
import { Request, Response, NextFunction, RequestHandler } from 'express';
import * as bodyParser from 'body-parser';
import { ExpressAdapter } from '@nestjs/platform-express';
import * as session from 'express-session';
import * as passport from 'passport';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as cors from 'cors';

// Tạo Express instance
const server = express();

// Cấu hình body parser cho tất cả các route ngoại trừ webhook
const stripeWebhookPath = '/api/payments/stripe/webhook';
server.use(((req: Request, res: Response, next: NextFunction) => {
  if (req.originalUrl === stripeWebhookPath) {
    next();
  } else {
    bodyParser.json({ limit: '50mb' })(req, res, next);
  }
}) as RequestHandler);

server.use(((req: Request, res: Response, next: NextFunction) => {
  if (req.originalUrl === stripeWebhookPath) {
    next();
  } else {
    bodyParser.urlencoded({ extended: true, limit: '50mb' })(req, res, next);
  }
}) as RequestHandler);

// Cấu hình CORS
const allowedOrigins = [
  'http://localhost:3000',
  'https://project-final-livid.vercel.app',
  process.env.FRONTEND_URL
].filter(Boolean);

// Cấu hình CORS
server.use(cors({
  origin: (origin, callback) => {
    // Cho phép requests không có origin (mobile apps, postman, etc.)
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    } else {
      return callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'Origin', 'X-Requested-With'],
}));

// Xử lý OPTIONS request
server.use(((req: Request, res: Response, next: NextFunction) => {
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  next();
}) as RequestHandler);

// Cấu hình session
server.use(
  session({
    secret: process.env.JWT_SECRET || 'your_jwt_secret_key_here',
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 60000 * 60 * 24, // 24 giờ
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
    },
  }),
);

// Khởi tạo passport
server.use(passport.initialize());
server.use(passport.session());

// Tạo và cấu hình ứng dụng NestJS
let app;

async function bootstrap() {
  if (!app) {
    app = await NestFactory.create(
      AppModule,
      new ExpressAdapter(server),
      {
        logger: ['error', 'warn', 'log'],
        rawBody: true,
      },
    );

    // Cấu hình Swagger
    const config = new DocumentBuilder()
      .setTitle('Yumin API')
      .setDescription('API documentation for Yumin Cosmetic Store')
      .setVersion('1.0')
      .addBearerAuth()
      .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document);

    // Đặt global prefix
    app.setGlobalPrefix('api');

    await app.init();
  }
  
  return app;
}

// Xử lý request
export default async function handler(req: any, res: any) {
  try {
    await bootstrap();
    server(req, res);
  } catch (error) {
    console.error('Serverless function error:', error);
    return res.status(500).send('Internal Server Error');
  }
} 