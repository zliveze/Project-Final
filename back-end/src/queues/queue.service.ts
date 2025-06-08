import { Injectable, Logger } from '@nestjs/common';
import { kv } from '@vercel/kv';

export interface ImportJobData {
  taskId: string;
  filePath?: string; // Make optional as we might use buffer
  fileBufferBase64?: string; // Add buffer as base64 string
  branchId: string;
  userId: string;
  totalRows: number;
  processedRows: number;
}

const IMPORT_QUEUE_KEY = 'import_product_queue';

@Injectable()
export class QueueService {
  private readonly logger = new Logger(QueueService.name);

  constructor() {
    this.logger.log('QueueService initialized');
  }

  async addImportJob(jobData: ImportJobData): Promise<void> {
    try {
      this.logger.log(`Adding job for taskId: ${jobData.taskId} to queue.`);
      // LPUSH sẽ thêm job vào đầu danh sách (hoạt động như một stack)
      await kv.lpush(IMPORT_QUEUE_KEY, JSON.stringify(jobData));
      this.logger.log(`Job for taskId: ${jobData.taskId} added successfully.`);
    } catch (error) {
      this.logger.error(`Error adding job to queue: ${error.message}`, error.stack);
      throw error;
    }
  }

  async getImportJob(): Promise<ImportJobData | null> {
    try {
      this.logger.log('Attempting to get a job from the queue.');
      // RPOP sẽ lấy và xóa job cuối cùng từ danh sách (hoạt động như một queue FIFO)
      const jobString = await kv.rpop(IMPORT_QUEUE_KEY);

      if (jobString) {
        this.logger.log(`Got a job from queue: ${jobString}`);
        return JSON.parse(jobString as string) as ImportJobData;
      }

      this.logger.log('Queue is empty.');
      return null;
    } catch (error) {
      this.logger.error(`Error getting job from queue: ${error.message}`, error.stack);
      // Nếu có lỗi, đẩy job lại vào đầu hàng đợi để thử lại sau
      if (error.message.includes('jobString')) {
         // await kv.lpush(IMPORT_QUEUE_KEY, error.message.replace('jobString: ',''));
      }
      return null;
    }
  }

  async getQueueLength(): Promise<number> {
    try {
      const length = await kv.llen(IMPORT_QUEUE_KEY);
      this.logger.log(`Current queue length: ${length}`);
      return length;
    } catch (error) {
      this.logger.error(`Error getting queue length: ${error.message}`, error.stack);
      return 0;
    }
  }
}
