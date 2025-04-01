# Kế hoạch xây dựng backend chức năng quản lý Banner

Dựa trên phân tích từ models và tham khảo cấu trúc module Notification, dưới đây là kế hoạch xây dựng backend chức năng quản lý Banner:

## 1. Cấu trúc thư mục

```
back-end/src/banners/
├── dto/
│   ├── create-banner.dto.ts
│   ├── update-banner.dto.ts 
│   ├── query-banner.dto.ts
│   ├── banner-response.dto.ts
│   ├── paginated-banners-response.dto.ts
│   └── index.ts
├── schemas/
│   └── banner.schema.ts
├── banners.module.ts
├── banners.service.ts
├── banners.service.spec.ts
├── banners-admin.controller.ts
└── banners-user.controller.ts
```

## 2. Thiết kế Schema

```typescript
// schemas/banner.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export type BannerDocument = Banner & Document;

@Schema({ timestamps: true })
export class Banner {
  @Prop({ required: true })
  title: string;

  @Prop()
  campaignId: string;

  @Prop({ required: true })
  desktopImage: string;

  @Prop({ required: true })
  mobileImage: string;

  @Prop()
  alt: string;

  @Prop()
  href: string;

  @Prop({ default: true })
  active: boolean;

  @Prop({ required: true, default: 0 })
  order: number;

  @Prop({ type: Date })
  startDate: Date;

  @Prop({ type: Date })
  endDate: Date;

  @Prop({ type: Date, default: Date.now })
  createdAt: Date;

  @Prop({ type: Date, default: Date.now })
  updatedAt: Date;
}

export const BannerSchema = SchemaFactory.createForClass(Banner);
```

## 3. DTOs (Data Transfer Objects)

### 3.1. Create Banner DTO
```typescript
// dto/create-banner.dto.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsOptional, IsNumber, IsBoolean, IsDateString } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateBannerDto {
  @ApiProperty({ description: 'Tiêu đề banner' })
  @IsNotEmpty()
  @IsString()
  title: string;

  @ApiPropertyOptional({ description: 'ID của chiến dịch liên kết' })
  @IsOptional()
  @IsString()
  campaignId?: string;

  @ApiProperty({ description: 'URL ảnh cho desktop' })
  @IsNotEmpty()
  @IsString()
  desktopImage: string;

  @ApiProperty({ description: 'URL ảnh cho mobile' })
  @IsNotEmpty()
  @IsString()
  mobileImage: string;

  @ApiPropertyOptional({ description: 'Mô tả alt cho ảnh' })
  @IsOptional()
  @IsString()
  alt?: string;

  @ApiPropertyOptional({ description: 'Link khi click vào banner' })
  @IsOptional()
  @IsString()
  href?: string;

  @ApiPropertyOptional({ description: 'Trạng thái hiển thị', default: true })
  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  active?: boolean;

  @ApiPropertyOptional({ description: 'Thứ tự hiển thị', default: 0 })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  order?: number;

  @ApiPropertyOptional({ description: 'Ngày bắt đầu hiển thị banner' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ description: 'Ngày kết thúc hiển thị banner' })
  @IsOptional()
  @IsDateString()
  endDate?: string;
}
```

### 3.2. Update Banner DTO
```typescript
// dto/update-banner.dto.ts
import { PartialType } from '@nestjs/swagger';
import { CreateBannerDto } from './create-banner.dto';

export class UpdateBannerDto extends PartialType(CreateBannerDto) {}
```

### 3.3. Query Banner DTO
```typescript
// dto/query-banner.dto.ts
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsNumber, IsBoolean, IsDateString } from 'class-validator';
import { Type } from 'class-transformer';

export class QueryBannerDto {
  @ApiPropertyOptional({ description: 'Trang hiện tại', default: 1 })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  page?: number = 1;

  @ApiPropertyOptional({ description: 'Số lượng item trên mỗi trang', default: 10 })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  limit?: number = 10;

  @ApiPropertyOptional({ description: 'Từ khóa tìm kiếm' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: 'ID chiến dịch' })
  @IsOptional()
  @IsString()
  campaignId?: string;

  @ApiPropertyOptional({ description: 'Trạng thái banner (active/inactive)' })
  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  active?: boolean;

  @ApiPropertyOptional({ description: 'Sắp xếp theo trường', default: 'order' })
  @IsOptional()
  @IsString()
  sortBy?: string = 'order';

  @ApiPropertyOptional({ description: 'Thứ tự sắp xếp (asc/desc)', default: 'asc' })
  @IsOptional()
  @IsString()
  sortOrder?: 'asc' | 'desc' = 'asc';

  @ApiPropertyOptional({ description: 'Ngày bắt đầu (tìm kiếm theo khoảng thời gian)' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ description: 'Ngày kết thúc (tìm kiếm theo khoảng thời gian)' })
  @IsOptional()
  @IsDateString()
  endDate?: string;
}
```

## 4. Service

```typescript
// banners.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, SortOrder } from 'mongoose';
import { Banner, BannerDocument } from './schemas/banner.schema';
import { CreateBannerDto, UpdateBannerDto, QueryBannerDto } from './dto';

@Injectable()
export class BannersService {
  constructor(
    @InjectModel(Banner.name) private bannerModel: Model<BannerDocument>,
  ) {}

  // Tạo banner mới
  async create(createBannerDto: CreateBannerDto): Promise<BannerDocument> {
    // Nếu không cung cấp thứ tự, lấy thứ tự cao nhất + 1
    if (!createBannerDto.order) {
      const lastBanner = await this.bannerModel
        .findOne()
        .sort({ order: -1 })
        .exec();
      createBannerDto.order = lastBanner ? lastBanner.order + 1 : 1;
    }
    
    const createdBanner = new this.bannerModel(createBannerDto);
    return createdBanner.save();
  }

  // Lấy danh sách banner có phân trang và lọc
  async findAll(queryDto: QueryBannerDto) {
    const { 
      page = 1, 
      limit = 10, 
      search, 
      campaignId, 
      active,
      sortBy = 'order', 
      sortOrder = 'asc',
      startDate,
      endDate
    } = queryDto;
    
    const skip = (page - 1) * limit;
    
    // Xây dựng điều kiện tìm kiếm
    const query: any = {};
    
    if (search) {
      query.title = { $regex: search, $options: 'i' };
    }
    
    if (campaignId) {
      query.campaignId = campaignId;
    }
    
    if (typeof active === 'boolean') {
      query.active = active;
    }
    
    // Tìm kiếm theo khoảng thời gian
    const dateQuery = {};
    if (startDate) {
      dateQuery['$gte'] = new Date(startDate);
    }
    if (endDate) {
      dateQuery['$lte'] = new Date(endDate);
    }
    if (Object.keys(dateQuery).length > 0) {
      query.startDate = dateQuery;
    }
    
    // Thực hiện truy vấn
    const sortOptions: { [key: string]: SortOrder } = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };
    
    const banners = await this.bannerModel
      .find(query)
      .sort(sortOptions)
      .skip(skip)
      .limit(limit)
      .exec();
    
    const total = await this.bannerModel.countDocuments(query).exec();
    const totalPages = Math.ceil(total / limit);
    
    return {
      items: banners,
      total,
      page,
      limit,
      totalPages,
    };
  }

  // Lấy danh sách banner đang hoạt động (cho người dùng)
  async findAllActive() {
    const now = new Date();
    
    // Lấy tất cả banner đang hoạt động và trong thời gian hiệu lực
    const banners = await this.bannerModel.find({
      active: true,
      $or: [
        { startDate: { $exists: false } },
        { startDate: null },
        { startDate: { $lte: now } }
      ],
      $or: [
        { endDate: { $exists: false } },
        { endDate: null },
        { endDate: { $gte: now } },
      ],
    })
    .sort({ order: 1 })
    .exec();
    
    return banners;
  }

  // Tìm banner theo ID
  async findOne(id: string): Promise<BannerDocument> {
    const banner = await this.bannerModel.findById(id).exec();
    if (!banner) {
      throw new NotFoundException(`Không tìm thấy banner với ID: ${id}`);
    }
    return banner;
  }

  // Cập nhật banner
  async update(id: string, updateBannerDto: UpdateBannerDto): Promise<BannerDocument> {
    const updatedBanner = await this.bannerModel
      .findByIdAndUpdate(id, updateBannerDto, { new: true })
      .exec();
    
    if (!updatedBanner) {
      throw new NotFoundException(`Không tìm thấy banner với ID: ${id}`);
    }
    
    return updatedBanner;
  }

  // Bật/Tắt trạng thái banner
  async toggleStatus(id: string): Promise<BannerDocument> {
    const banner = await this.findOne(id);
    banner.active = !banner.active;
    return banner.save();
  }

  // Xóa banner
  async remove(id: string): Promise<BannerDocument> {
    const deletedBanner = await this.bannerModel.findByIdAndDelete(id).exec();
    
    if (!deletedBanner) {
      throw new NotFoundException(`Không tìm thấy banner với ID: ${id}`);
    }
    
    return deletedBanner;
  }

  // Thay đổi thứ tự banner (lên/xuống)
  async changeOrder(id: string, direction: 'up' | 'down'): Promise<BannerDocument[]> {
    const banner = await this.findOne(id);
    
    // Tìm banner kề cạnh (trên/dưới) dựa vào hướng di chuyển
    const adjacentBanner = await this.bannerModel.findOne(
      direction === 'up'
        ? { order: { $lt: banner.order } }
        : { order: { $gt: banner.order } }
    )
    .sort(direction === 'up' ? { order: -1 } : { order: 1 })
    .exec();
    
    if (!adjacentBanner) {
      return [banner]; // Không có banner kề cạnh, giữ nguyên
    }
    
    // Hoán đổi thứ tự
    const tempOrder = banner.order;
    banner.order = adjacentBanner.order;
    adjacentBanner.order = tempOrder;
    
    // Lưu cả hai banner
    await banner.save();
    await adjacentBanner.save();
    
    return [banner, adjacentBanner];
  }

  // Thống kê
  async getStatistics() {
    const now = new Date();
    const oneWeekLater = new Date();
    oneWeekLater.setDate(oneWeekLater.getDate() + 7);
    
    // Tổng số banner
    const total = await this.bannerModel.countDocuments();
    
    // Số banner đang hoạt động và trong thời gian hiệu lực
    const active = await this.bannerModel.countDocuments({ 
      active: true,
      $or: [
        { startDate: { $exists: false } },
        { startDate: null },
        { startDate: { $lte: now } }
      ],
      $or: [
        { endDate: { $exists: false } },
        { endDate: null },
        { endDate: { $gte: now } },
      ],
    });
    
    // Số banner đã ẩn
    const inactive = await this.bannerModel.countDocuments({ active: false });
    
    // Số banner sắp hết hạn (trong vòng 1 tuần)
    const expiringSoon = await this.bannerModel.countDocuments({
      active: true,
      endDate: { $gte: now, $lte: oneWeekLater },
    });
    
    return {
      total,
      active,
      inactive,
      expiringSoon,
    };
  }
}
```

## 5. Controllers

### 5.1. Admin Controller

```typescript
// banners-admin.controller.ts
import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { BannersService } from './banners.service';
import { 
  CreateBannerDto, 
  UpdateBannerDto, 
  QueryBannerDto
} from './dto';
import { AdminRoles } from '../common/decorators/admin-roles.decorator';
import { JwtAdminAuthGuard } from '../auth/guards/jwt-admin-auth.guard';

@ApiTags('Admin Banners')
@Controller('admin/banners')
@UseGuards(JwtAdminAuthGuard)
@AdminRoles('admin', 'superadmin')
@ApiBearerAuth()
export class BannersAdminController {
  private readonly logger = new Logger(BannersAdminController.name);
  
  constructor(private readonly bannersService: BannersService) {}

  @Post()
  @ApiOperation({ summary: 'Tạo banner mới' })
  async create(@Body() createBannerDto: CreateBannerDto) {
    try {
      this.logger.log(`Tạo banner mới: ${JSON.stringify(createBannerDto)}`);
      return this.bannersService.create(createBannerDto);
    } catch (error) {
      this.logger.error(`Lỗi khi tạo banner: ${error.message}`, error.stack);
      throw new HttpException(
        error.message || 'Có lỗi xảy ra khi tạo banner',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get()
  @ApiOperation({ summary: 'Lấy danh sách banner với phân trang và lọc' })
  async findAll(@Query() queryDto: QueryBannerDto) {
    try {
      this.logger.log(`Lấy danh sách banner với query: ${JSON.stringify(queryDto)}`);
      return this.bannersService.findAll(queryDto);
    } catch (error) {
      this.logger.error(`Lỗi khi lấy danh sách banner: ${error.message}`, error.stack);
      throw new HttpException(
        error.message || 'Có lỗi xảy ra khi lấy danh sách banner',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('statistics')
  @ApiOperation({ summary: 'Lấy thống kê về banner' })
  async getStatistics() {
    try {
      this.logger.log('Lấy thống kê banner');
      return this.bannersService.getStatistics();
    } catch (error) {
      this.logger.error(`Lỗi khi lấy thống kê banner: ${error.message}`, error.stack);
      throw new HttpException(
        error.message || 'Có lỗi xảy ra khi lấy thống kê banner',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get(':id')
  @ApiOperation({ summary: 'Lấy chi tiết một banner' })
  async findOne(@Param('id') id: string) {
    try {
      this.logger.log(`Lấy chi tiết banner với ID: ${id}`);
      return this.bannersService.findOne(id);
    } catch (error) {
      this.logger.error(`Lỗi khi lấy chi tiết banner: ${error.message}`, error.stack);
      throw new HttpException(
        error.message || 'Có lỗi xảy ra khi lấy chi tiết banner',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Cập nhật thông tin banner' })
  async update(@Param('id') id: string, @Body() updateBannerDto: UpdateBannerDto) {
    try {
      this.logger.log(`Cập nhật banner với ID: ${id}, dữ liệu: ${JSON.stringify(updateBannerDto)}`);
      return this.bannersService.update(id, updateBannerDto);
    } catch (error) {
      this.logger.error(`Lỗi khi cập nhật banner: ${error.message}`, error.stack);
      throw new HttpException(
        error.message || 'Có lỗi xảy ra khi cập nhật banner',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Patch(':id/toggle-status')
  @ApiOperation({ summary: 'Bật/tắt trạng thái banner' })
  async toggleStatus(@Param('id') id: string) {
    try {
      this.logger.log(`Thay đổi trạng thái banner với ID: ${id}`);
      return this.bannersService.toggleStatus(id);
    } catch (error) {
      this.logger.error(`Lỗi khi thay đổi trạng thái banner: ${error.message}`, error.stack);
      throw new HttpException(
        error.message || 'Có lỗi xảy ra khi thay đổi trạng thái banner',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Patch(':id/change-order/:direction')
  @ApiOperation({ summary: 'Thay đổi thứ tự hiển thị (lên/xuống)' })
  async changeOrder(@Param('id') id: string, @Param('direction') direction: 'up' | 'down') {
    try {
      if (direction !== 'up' && direction !== 'down') {
        throw new HttpException(
          'Hướng di chuyển phải là "up" hoặc "down"',
          HttpStatus.BAD_REQUEST
        );
      }
      
      this.logger.log(`Thay đổi thứ tự banner ID: ${id}, hướng: ${direction}`);
      return this.bannersService.changeOrder(id, direction);
    } catch (error) {
      this.logger.error(`Lỗi khi thay đổi thứ tự banner: ${error.message}`, error.stack);
      throw new HttpException(
        error.message || 'Có lỗi xảy ra khi thay đổi thứ tự banner',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Xóa banner' })
  async remove(@Param('id') id: string) {
    try {
      this.logger.log(`Xóa banner với ID: ${id}`);
      return this.bannersService.remove(id);
    } catch (error) {
      this.logger.error(`Lỗi khi xóa banner: ${error.message}`, error.stack);
      throw new HttpException(
        error.message || 'Có lỗi xảy ra khi xóa banner',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
}
```

### 5.2. User Controller

```typescript
// banners-user.controller.ts
import { Controller, Get, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { BannersService } from './banners.service';

@ApiTags('Banners')
@Controller('banners')
export class BannersUserController {
  private readonly logger = new Logger(BannersUserController.name);
  
  constructor(private readonly bannersService: BannersService) {}

  @Get('active')
  @ApiOperation({ summary: 'Lấy danh sách banner đang hiển thị' })
  async findAllActive() {
    try {
      this.logger.log('Lấy danh sách banner đang hiển thị cho người dùng');
      return this.bannersService.findAllActive();
    } catch (error) {
      this.logger.error(`Lỗi khi lấy danh sách banner: ${error.message}`, error.stack);
      throw new HttpException(
        error.message || 'Có lỗi xảy ra khi lấy danh sách banner',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
}
```

## 6. Module

```typescript
// banners.module.ts
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { BannersService } from './banners.service';
import { BannersAdminController } from './banners-admin.controller';
import { BannersUserController } from './banners-user.controller';
import { Banner, BannerSchema } from './schemas/banner.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Banner.name, schema: BannerSchema },
    ]),
  ],
  controllers: [BannersAdminController, BannersUserController],
  providers: [BannersService],
  exports: [BannersService],
})
export class BannersModule {}
```

## 7. Test

```typescript
// banners.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { BannersService } from './banners.service';
import { getModelToken } from '@nestjs/mongoose';
import { Banner } from './schemas/banner.schema';

describe('BannersService', () => {
  let service: BannersService;
  let mockBannerModel: any;

  beforeEach(async () => {
    mockBannerModel = {
      find: jest.fn().mockReturnThis(),
      findOne: jest.fn().mockReturnThis(),
      findById: jest.fn().mockReturnThis(),
      findByIdAndUpdate: jest.fn().mockReturnThis(),
      findByIdAndDelete: jest.fn().mockReturnThis(),
      countDocuments: jest.fn().mockReturnThis(),
      sort: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      lean: jest.fn().mockReturnThis(),
      exec: jest.fn().mockReturnThis(),
      save: jest.fn().mockReturnThis(),
      new: jest.fn().mockResolvedValue({
        save: jest.fn().mockResolvedValue({
          _id: 'banner1',
          title: 'Test banner',
          desktopImage: 'desktop.jpg',
          mobileImage: 'mobile.jpg',
          active: true,
          order: 1,
        }),
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BannersService,
        {
          provide: getModelToken(Banner.name),
          useValue: mockBannerModel,
        },
      ],
    }).compile();

    service = module.get<BannersService>(BannersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // TODO: Thêm các test case cho các phương thức service
});
```

## 8. Tích hợp vào hệ thống

1. Thêm `BannersModule` vào `AppModule`
2. Cập nhật các Guard và các Decorator cần thiết
3. Cập nhật các Route trong hệ thống
4. Thêm các URL API vào API Documentation

## 9. Kết luận

Backend chức năng quản lý Banner sẽ cung cấp:
- API đầy đủ cho Admin quản lý banner (CRUD, phân trang, lọc, thay đổi trạng thái và thứ tự)
- API cho User lấy banner đang hiển thị
- Xử lý logic như thời gian hiệu lực banner, thứ tự hiển thị
- Thống kê tổng quan về banner trong hệ thống 