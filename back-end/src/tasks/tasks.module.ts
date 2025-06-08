import { Module, forwardRef } from '@nestjs/common';
import { TasksService } from './tasks.service';
import { TasksController } from './tasks.controller';
import { QueueModule } from '../queues/queue.module';
import { ProductsModule } from '../products/products.module';

@Module({
  imports: [QueueModule, forwardRef(() => ProductsModule)],
  providers: [TasksService],
  exports: [TasksService],
  controllers: [TasksController],
})
export class TasksModule {}
