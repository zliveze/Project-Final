import { Controller, Get, Param, NotFoundException, UseGuards, Post, Inject, forwardRef, Body, UnauthorizedException, HttpCode, HttpStatus } from '@nestjs/common';
import { TasksService } from './tasks.service';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiExcludeEndpoint } from '@nestjs/swagger';
import { JwtAdminAuthGuard } from '../auth/guards/jwt-admin-auth.guard'; // Thay đổi guard
import { QueueService } from '../queues/queue.service';
import { ProductsService } from '../products/products.service';

@ApiTags('Tasks')
@Controller('tasks')
export class TasksController {
  constructor(
    private readonly tasksService: TasksService,
    private readonly queueService: QueueService,
    @Inject(forwardRef(() => ProductsService))
    private readonly productsService: ProductsService,
  ) {}

  @Post('process-import-queue')
  @ApiExcludeEndpoint() // Ẩn endpoint này khỏi Swagger UI
  @HttpCode(HttpStatus.OK)
  async processImportQueue(@Body('secret') secret: string) {
    if (secret !== process.env.CRON_SECRET) {
      throw new UnauthorizedException('Invalid secret for cron job.');
    }

    this.tasksService.getLogger().log('Cron job triggered: Processing import queue...');
    const job = await this.queueService.getImportJob();

    if (job) {
      this.tasksService.getLogger().log(`Processing job for taskId: ${job.taskId}`);
      try {
        // Gọi hàm xử lý trong ProductsService
        // Lưu ý: processImportJob cần được tạo trong ProductsService
        await this.productsService.processImportJob(job);
        return { message: `Successfully processed job for task ${job.taskId}` };
      } catch (error) {
        this.tasksService.getLogger().error(`Failed to process job for task ${job.taskId}`, error.stack);
        // Cập nhật trạng thái task là failed
        this.tasksService.updateImportTask(job.taskId, {
          status: 'failed',
          message: `Lỗi khi xử lý job: ${error.message}`,
        });
        return { message: `Failed to process job for task ${job.taskId}` };
      }
    } else {
      this.tasksService.getLogger().log('Import queue is empty. Nothing to process.');
      return { message: 'Import queue is empty.' };
    }
  }

  @Get('import/:taskId')
  @UseGuards(JwtAdminAuthGuard) // Sử dụng guard của admin
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get import task status' })
  @ApiResponse({ status: 200, description: 'Task status retrieved successfully.' })
  @ApiResponse({ status: 404, description: 'Task not found.' })
  getTaskStatus(@Param('taskId') taskId: string) {
    const task = this.tasksService.getTaskById(taskId);
    if (!task) {
      throw new NotFoundException(`Task with ID ${taskId} not found.`);
    }
    return task;
  }
}
