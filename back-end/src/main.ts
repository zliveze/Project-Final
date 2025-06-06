import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger, LogLevel } from '@nestjs/common';
import * as session from 'express-session';
import * as passport from 'passport';
import * as bodyParser from 'body-parser';
import * as express from 'express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as path from 'path';
import * as fs from 'fs';

async function bootstrap() {
  // Cấu hình log level dựa trên environment
  const logLevels: LogLevel[] = process.env.NODE_ENV === 'production'
    ? ['error', 'warn', 'log']
    : ['error', 'warn', 'log', 'debug', 'verbose'];

  const app = await NestFactory.create(AppModule, {
    logger: logLevels,
    rawBody: true, // Kích hoạt rawBody cho tất cả requests
  });
  const logger = new Logger('Bootstrap');

  // Cấu hình CORS để cho phép front-end truy cập API
  const allowedOrigins = [
    'http://localhost:3000',
    'https://project-final-livid.vercel.app',
    process.env.FRONTEND_URL
  ].filter(Boolean); // Loại bỏ các giá trị undefined

  app.enableCors({
    origin: (origin: string, callback: (error: Error | null, allow?: boolean) => void) => {
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
    exposedHeaders: ['Access-Control-Allow-Private-Network'],
  });

  // Thêm middleware để hỗ trợ private network requests
  app.use((req: express.Request, res: express.Response, next: express.NextFunction) => {
    res.setHeader('Access-Control-Allow-Private-Network', 'true');
    next();
  });

  // Cấu hình body parser cho tất cả các route ngoại trừ webhook
  const stripeWebhookPath = '/api/payments/stripe/webhook';
  app.use((req: express.Request, res: express.Response, next: express.NextFunction) => {
    if (req.originalUrl === stripeWebhookPath) {
      // Bỏ qua body parser cho route webhook của Stripe
      next();
    } else {
      // Áp dụng body parser cho các route khác
      bodyParser.json({ limit: '50mb' })(req, res, next);
    }
  });

  app.use((req: express.Request, res: express.Response, next: express.NextFunction) => {
    if (req.originalUrl === stripeWebhookPath) {
      // Bỏ qua body parser cho route webhook của Stripe
      next();
    } else {
      // Áp dụng body parser cho các route khác
      bodyParser.urlencoded({ extended: true, limit: '50mb' })(req, res, next);
    }
  });

  // Cấu hình session middleware
  app.use(
    session({
      secret: process.env.JWT_SECRET || 'your_jwt_secret_key_here',
      resave: false,
      saveUninitialized: false,
      cookie: {
        maxAge: 60000 * 60 * 24, // 24 giờ
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production', // Tự động true trong production
      },
    }),
  );

  // Khởi tạo passport
  app.use(passport.initialize());
  app.use(passport.session());
  
  // Cấu hình serialize và deserialize user cho passport session
  passport.serializeUser((user: any, done) => {
    logger.log(`Serializing user: ${user._id || user.id}`);
    done(null, user);
  });

  passport.deserializeUser((obj: any, done) => {
    logger.log(`Deserializing user: ${obj._id || obj.id}`);
    done(null, obj);
  });

  // Cấu hình Swagger
  const config = new DocumentBuilder()
    .setTitle('Yumin API')
    .setDescription('API documentation for Yumin Cosmetic Store')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  // Tạo thư mục uploads nếu chưa tồn tại
  const uploadsDir = path.join(__dirname, '..', 'uploads');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  const tempDir = path.join(uploadsDir, 'temp');
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }

  // Không sử dụng prefix '/api' cho các routes
  // Đặt global prefix SAU khi cấu hình body parser để path '/api/payments/stripe/webhook' được nhận diện đúng
  app.setGlobalPrefix('api');

  // In ra tất cả các routes đã đăng ký
  await app.init();
  const server = app.getHttpServer();
  const router = server._events.request._router;

  try {
    if (router && router.stack) {
      logger.debug('Registered Routes:');
      router.stack.forEach((layer: any) => {
        if (layer.route) {
          const path = layer.route?.path;
          const method = layer.route?.stack[0]?.method?.toUpperCase();
          if (path && method) {
            logger.debug(`${method} ${path}`);
          }
        }
      });
    } else {
      logger.debug('Router information is not available yet.');
    }
  } catch (error) {
    logger.error('Error while logging routes:', error);
  }

  const port = process.env.PORT ?? 3001;
  await app.listen(port);

  const serverUrl = `http://localhost:${port}`;

  logger.log(`Application is running on port ${port}`);
  logger.log(`API endpoint: ${serverUrl}/api`);
  logger.log(`Health check: ${serverUrl}/api/health`);
  logger.log(`Swagger API documentation: ${serverUrl}/api/docs`);
  logger.log(`CORS is enabled for origins: ${allowedOrigins.join(', ')}`);
  logger.log(`MongoDB connection: ${process.env.MONGODB_URI ? 'Configured' : 'Not configured'}`);
  logger.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
}
bootstrap();
