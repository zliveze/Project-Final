import { Module } from '@nestjs/common';
import { TasksService } from './tasks.service';
import { TasksController } from './tasks.controller';

@Module({
  imports: [],
  providers: [TasksService],
  exports: [TasksService],
  controllers: [TasksController],
})
export class TasksModule {}
