import { Controller, Get, Param, NotFoundException, UseGuards } from '@nestjs/common';
import { TasksService } from './tasks.service';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Tasks')
@Controller('tasks')
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Get('import/:taskId')
  @UseGuards(JwtAuthGuard)
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
