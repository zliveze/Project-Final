import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsEnum, IsString, IsBoolean, IsNumber, IsDateString } from 'class-validator';
import { Type } from 'class-transformer';

export class QueryNotificationDto {
  @ApiPropertyOptional({ description: 'Số trang', default: 1 })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  page?: number = 1;

  @ApiPropertyOptional({ description: 'Số lượng mỗi trang', default: 10 })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  limit?: number = 10;

  @ApiPropertyOptional({ description: 'Từ khóa tìm kiếm trong nội dung' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: 'Loại thông báo', enum: ['voucher', 'shipping', 'promotion', 'system'] })
  @IsOptional()
  @IsEnum(['voucher', 'shipping', 'promotion', 'system'])
  type?: string;

  @ApiPropertyOptional({ description: 'Trạng thái hoạt động' })
  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  isActive?: boolean;

  @ApiPropertyOptional({ description: 'Sắp xếp theo' })
  @IsOptional()
  @IsString()
  sortBy?: string = 'priority';

  @ApiPropertyOptional({ description: 'Thứ tự sắp xếp', enum: ['asc', 'desc'] })
  @IsOptional()
  @IsEnum(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc' = 'desc';

  @ApiPropertyOptional({ description: 'Ngày bắt đầu tìm kiếm' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ description: 'Ngày kết thúc tìm kiếm' })
  @IsOptional()
  @IsDateString()
  endDate?: string;
} 