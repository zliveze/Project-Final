import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { EventsController } from './events.controller';
import { EventsService } from './events.service';
import { Event, EventSchema } from './entities/event.entity';
import { Product, ProductSchema } from '../products/schemas/product.schema';
import { CampaignsModule } from '../campaigns/campaigns.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Event.name, schema: EventSchema },
      { name: Product.name, schema: ProductSchema }
    ]),
    forwardRef(() => CampaignsModule),
  ],
  controllers: [EventsController],
  providers: [EventsService],
  exports: [EventsService],
})
export class EventsModule {}