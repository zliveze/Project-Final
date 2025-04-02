import { 
  Controller, 
  Get, 
  Post, 
  Body, 
  Param, 
  Delete, 
  Put, 
  Query, 
  UseGuards,
  BadRequestException,
  Logger,
  Patch
} from '@nestjs/common';
import { JwtAdminAuthGuard } from '../auth/guards/jwt-admin-auth.guard';
import { AdminRolesGuard } from '../auth/guards/admin-roles.guard';
import { CategoriesService } from './categories.service';

@Controller('admin/categories')
@UseGuards(JwtAdminAuthGuard, AdminRolesGuard)
export class CategoriesAdminController {
  private readonly logger = new Logger(CategoriesAdminController.name);

  constructor(private readonly categoriesService: CategoriesService) {}

  @Post()
  async create(@Body() createCategoryDto: any): Promise<any> {
    return this.categoriesService.create(createCategoryDto);
  }

  @Get('statistics')
  async getStatistics(): Promise<any> {
    return this.categoriesService.getStatistics();
  }

  @Get()
  async findAll(@Query() queryDto: any): Promise<any> {
    return this.categoriesService.findAll(queryDto);
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<any> {
    return this.categoriesService.findOne(id);
  }

  @Put(':id')
  async update(
    @Param('id') id: string, 
    @Body() updateCategoryDto: any
  ): Promise<any> {
    this.logger.log(`Controller nhận yêu cầu cập nhật danh mục ID: ${id}`);
    this.logger.debug('Dữ liệu cập nhật:', JSON.stringify(updateCategoryDto, null, 2));
    
    try {
      const result = await this.categoriesService.update(id, updateCategoryDto);
      this.logger.log(`Cập nhật danh mục thành công ID: ${id}`);
      return result;
    } catch (error) {
      this.logger.error(`Lỗi khi cập nhật danh mục ${id}: ${error.message}`, error.stack);
      throw error;
    }
  }

  @Delete(':id')
  async remove(@Param('id') id: string): Promise<{ success: boolean }> {
    const result = await this.categoriesService.remove(id);
    return { success: result };
  }

  @Post(':id/upload-image')
  async uploadImage(
    @Param('id') id: string,
    @Body() uploadDto: any
  ): Promise<any> {
    if (!uploadDto.base64Image) {
      throw new BadRequestException('Cần cung cấp hình ảnh dạng base64');
    }
    
    return this.categoriesService.uploadImage(
      id, 
      uploadDto.base64Image, 
      uploadDto.alt
    );
  }

  @Patch(':id/status')
  async changeStatus(
    @Param('id') id: string,
    @Body('status') status: string
  ): Promise<any> {
    return this.categoriesService.changeStatus(id, status);
  }

  @Patch(':id/featured')
  async changeFeatured(
    @Param('id') id: string,
    @Body('featured') featured: boolean
  ): Promise<any> {
    return this.categoriesService.changeFeatured(id, featured);
  }

  @Patch(':id/order')
  async changeOrder(
    @Param('id') id: string,
    @Body('order') order: number
  ): Promise<any> {
    if (isNaN(order)) {
      throw new BadRequestException('Thứ tự phải là một số');
    }
    return this.categoriesService.changeOrder(id, order);
  }

  @Post('temp-upload-image')
  async uploadTempImage(@Body() uploadDto: any): Promise<any> {
    this.logger.log('Nhận yêu cầu tải lên ảnh tạm thời');
    
    if (!uploadDto.imageData) {
      this.logger.warn('Không có dữ liệu hình ảnh được cung cấp');
      throw new BadRequestException('Cần cung cấp hình ảnh dạng base64');
    }
    
    try {
      const result = await this.categoriesService.uploadTempImage(
        uploadDto.imageData, 
        uploadDto.alt
      );
      this.logger.log('Tải lên ảnh tạm thời thành công');
      return result;
    } catch (error) {
      this.logger.error(`Lỗi khi tải lên ảnh tạm thời: ${error.message}`, error.stack);
      throw error;
    }
  }
} 