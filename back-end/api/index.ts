import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { Logger } from '@nestjs/common';
import * as session from 'express-session';
import * as passport from 'passport';
import * as bodyParser from 'body-parser';
import * as express from 'express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { VercelRequest, VercelResponse } from '@vercel/node';
import { ExpressAdapter } from '@nestjs/platform-express';

let app: any;

async function createNestApp() {
  if (!app) {
    const logger = new Logger('Vercel');

    // Tạo Express instance cho Vercel
    const expressApp = express();

    // Tạo NestJS app với ExpressAdapter cho serverless
    app = await NestFactory.create(AppModule, new ExpressAdapter(expressApp), {
      logger: ['error', 'warn', 'log'], // Giảm log level cho production
      rawBody: true,
    });

    // Cấu hình CORS
    const allowedOrigins = [
      'http://localhost:3000',
      'https://project-final-livid.vercel.app',
      process.env.FRONTEND_URL
    ].filter(Boolean);

    app.enableCors({
      origin: (origin: string, callback: Function) => {
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
    });

    // Cấu hình body parser
    const stripeWebhookPath = '/api/payments/stripe/webhook';
    app.use((req: express.Request, res: express.Response, next: express.NextFunction) => {
      if (req.originalUrl === stripeWebhookPath) {
        next();
      } else {
        bodyParser.json({ limit: '50mb' })(req, res, next);
      }
    });

    app.use((req: express.Request, res: express.Response, next: express.NextFunction) => {
      if (req.originalUrl === stripeWebhookPath) {
        next();
      } else {
        bodyParser.urlencoded({ extended: true, limit: '50mb' })(req, res, next);
      }
    });

    // Cấu hình session (tối ưu cho serverless)
    app.use(
      session({
        secret: process.env.JWT_SECRET || 'your_jwt_secret_key_here',
        resave: false,
        saveUninitialized: false,
        cookie: {
          maxAge: 60000 * 60 * 24,
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
        },
      }),
    );

    // Khởi tạo passport
    app.use(passport.initialize());
    app.use(passport.session());

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
    logger.log('NestJS app initialized for Vercel');
  }
  
  return app;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const app = await createNestApp();
    const server = app.getHttpAdapter().getInstance();
    return server(req, res);
  } catch (error) {
    console.error('Error in Vercel handler:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}
