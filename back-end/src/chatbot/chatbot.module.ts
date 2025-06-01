import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule } from '@nestjs/config';
import { HttpModule } from '@nestjs/axios';

// Controllers
import { ChatbotController } from './controllers/chatbot.controller';

// Services
import { ChatbotService } from './services/chatbot.service';
import { GeminiService } from './services/gemini.service';
import { ContextService } from './services/context.service';

// Schemas
import { ChatMessage, ChatMessageSchema } from './schemas/chat-message.schema';

// External modules dependencies
import { ProductsModule } from '../products/products.module';
import { CategoriesModule } from '../categories/categories.module';
import { BrandsModule } from '../brands/brands.module';
import { EventsModule } from '../events/events.module';
import { CampaignsModule } from '../campaigns/campaigns.module';

// Import other schemas that ContextService needs
import { Product, ProductSchema } from '../products/schemas/product.schema';
import { Category, CategorySchema } from '../categories/schemas/category.schema';
import { Brand, BrandSchema } from '../brands/schemas/brand.schema';
import { Event, EventSchema } from '../events/entities/event.entity';
import { Campaign, CampaignSchema } from '../campaigns/schemas/campaign.schema';

@Module({
  imports: [
    ConfigModule,
    HttpModule,
    MongooseModule.forFeature([
      // Chatbot specific schemas
      { name: ChatMessage.name, schema: ChatMessageSchema },
      
      // Dependencies for ContextService
      { name: Product.name, schema: ProductSchema },
      { name: Category.name, schema: CategorySchema },
      { name: Brand.name, schema: BrandSchema },
      { name: Event.name, schema: EventSchema },
      { name: Campaign.name, schema: CampaignSchema },
    ]),
    
    // Import related modules for potential future use
    ProductsModule,
    CategoriesModule,
    BrandsModule,
    EventsModule,
    CampaignsModule,
  ],
  controllers: [ChatbotController],
  providers: [
    ChatbotService,
    GeminiService,
    ContextService,
  ],
  exports: [
    ChatbotService,
    GeminiService,
    ContextService,
  ],
})
export class ChatbotModule {} 