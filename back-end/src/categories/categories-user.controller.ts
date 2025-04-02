import { Controller, Get, Param, Query, Logger } from '@nestjs/common';
import { CategoriesService } from './categories.service';

@Controller('categories')
export class CategoriesUserController {
  private readonly logger = new Logger(CategoriesUserController.name);

  constructor(private readonly categoriesService: CategoriesService) {}

  @Get()
  async findAll(@Query() queryDto: any): Promise<any> {
    // Mặc định chỉ lấy các danh mục active
    if (!queryDto.status) {
      queryDto.status = 'active';
    }
    return this.categoriesService.findAll(queryDto);
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<any> {
    return this.categoriesService.findOne(id);
  }

  @Get('slug/:slug')
  async findBySlug(@Param('slug') slug: string): Promise<any> {
    return this.categoriesService.findBySlug(slug);
  }
} 