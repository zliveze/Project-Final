import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger } from '@nestjs/common';
import * as session from 'express-session';
import * as passport from 'passport';
import * as bodyParser from 'body-parser';
import * as express from 'express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as path from 'path';
import * as fs from 'fs';

async function bootstrap() {
  // Bật lại tất cả các level log
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log', 'debug', 'verbose'], // Hiển thị tất cả các log
  });
  const logger = new Logger('Bootstrap');
  
  // Cấu hình CORS để cho phép front-end truy cập API
  app.enableCors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  });
  
  // Cấu hình để xử lý upload file
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: true, limit: '50mb' }));
  
  // Cấu hình session middleware
  app.use(
    session({
      secret: process.env.JWT_SECRET || 'your_jwt_secret_key_here',
      resave: false,
      saveUninitialized: false,
      cookie: {
        maxAge: 60000 * 60 * 24, // 24 giờ
        httpOnly: true,
        secure: false, // Sử dụng true trong production với HTTPS
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
  app.setGlobalPrefix('api');
  
  const port = process.env.PORT ?? 3001;
  await app.listen(port);
  
  logger.log(`Application is running on port ${port}`);
  logger.log(`CORS is enabled for origin: ${process.env.FRONTEND_URL || 'http://localhost:3000'}`);
}
bootstrap();
