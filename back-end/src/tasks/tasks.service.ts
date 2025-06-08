import { Injectable, Logger } from '@nestjs/common';
import { randomUUID } from 'crypto';

export interface ImportTask {
  id: string;
  userId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  message: string;
  summary?: {
    created?: number;
    updated?: number;
    errors?: string[];
  };
  createdAt: Date;
  updatedAt: Date;
}

@Injectable()
export class TasksService {
  private readonly logger = new Logger(TasksService.name);
  private tasks = new Map<string, ImportTask>();

  constructor() {
    // Tự động dọn dẹp các tác vụ cũ sau mỗi 5 phút
    setInterval(() => this.cleanupOldTasks(), 5 * 60 * 1000);
  }

  createImportTask(userId: string): ImportTask {
    const taskId = randomUUID();
    const task: ImportTask = {
      id: taskId,
      userId,
      status: 'pending',
      progress: 0,
      message: 'Khởi tạo tác vụ...',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.tasks.set(taskId, task);
    this.logger.log(`Đã tạo tác vụ import mới: ${taskId} cho người dùng: ${userId}`);
    return task;
  }

  updateImportTask(
    taskId: string,
    updates: Partial<Omit<ImportTask, 'id' | 'userId' | 'createdAt'>>,
  ): ImportTask | null {
    const task = this.tasks.get(taskId);
    if (!task) {
      this.logger.warn(`Không tìm thấy tác vụ với ID: ${taskId} để cập nhật.`);
      return null;
    }

    const updatedTask = { ...task, ...updates, updatedAt: new Date() };
    this.tasks.set(taskId, updatedTask);
    return updatedTask;
  }

  getTaskById(taskId: string): ImportTask | null {
    return this.tasks.get(taskId) || null;
  }

  getLogger(): Logger {
    return this.logger;
  }

  private cleanupOldTasks() {
    const now = new Date();
    const tasksToDelete: string[] = [];
    this.logger.log('Bắt đầu dọn dẹp các tác vụ import cũ...');

    for (const [taskId, task] of this.tasks.entries()) {
      // Xóa các tác vụ đã hoàn thành hoặc lỗi sau 30 phút
      const thirtyMinutes = 30 * 60 * 1000;
      if ((task.status === 'completed' || task.status === 'failed') && now.getTime() - task.updatedAt.getTime() > thirtyMinutes) {
        tasksToDelete.push(taskId);
      }
    }

    if (tasksToDelete.length > 0) {
      tasksToDelete.forEach(taskId => this.tasks.delete(taskId));
      this.logger.log(`Đã dọn dẹp ${tasksToDelete.length} tác vụ cũ.`);
    } else {
      this.logger.log('Không có tác vụ cũ nào cần dọn dẹp.');
    }
  }
}
