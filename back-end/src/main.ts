import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger } from '@nestjs/common';
import * as session from 'express-session';
import * as passport from 'passport';
import * as bodyParser from 'body-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const logger = new Logger('Bootstrap');
  
  // Cấu hình giới hạn payload JSON cho request
  app.use(bodyParser.json({ limit: '10mb' }));
  app.use(bodyParser.urlencoded({ limit: '10mb', extended: true }));
  
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
  
  // Bật CORS để front-end có thể gọi API
  app.enableCors({
    origin: 'http://localhost:3000', // Chỉ định cụ thể origin
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization'],
    preflightContinue: false,
    optionsSuccessStatus: 204
  });
  
  // Không sử dụng prefix '/api' cho các routes
  app.setGlobalPrefix('');
  
  const port = process.env.PORT ?? 3001;
  await app.listen(port);
  
  logger.log(`Application is running on port ${port}`);
  logger.log(`CORS is enabled for origin: http://localhost:3000`);
}
bootstrap();
