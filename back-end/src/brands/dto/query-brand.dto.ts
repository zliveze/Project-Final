import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsEnum, IsNumberString, IsBoolean } from 'class-validator';
import { Type, Transform } from 'class-transformer';

export class QueryBrandDto {
  @ApiPropertyOptional({
    description: 'Trang hiện tại',
    default: 1,
  })
  @IsNumberString()
  @IsOptional()
  page?: number;

  @ApiPropertyOptional({
    description: 'Số lượng item mỗi trang',
    default: 10,
  })
  @IsNumberString()
  @IsOptional()
  limit?: number;

  @ApiPropertyOptional({
    description: 'Từ khóa tìm kiếm (tìm theo tên thương hiệu)',
  })
  @IsString()
  @IsOptional()
  search?: string;

  @ApiPropertyOptional({
    description: 'Trạng thái của thương hiệu',
    enum: ['active', 'inactive'],
  })
  @IsEnum(['active', 'inactive'])
  @IsOptional()
  status?: string;

  @ApiPropertyOptional({
    description: 'Sắp xếp theo trường',
    default: 'name',
  })
  @IsString()
  @IsOptional()
  sortBy?: string;

  @ApiPropertyOptional({
    description: 'Thứ tự sắp xếp',
    enum: ['asc', 'desc'],
    default: 'asc',
  })
  @IsEnum(['asc', 'desc'])
  @IsOptional()
  sortOrder?: 'asc' | 'desc';

  @ApiPropertyOptional({
    description: 'Lọc theo thương hiệu nổi bật',
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  featured?: boolean;

  @ApiPropertyOptional({
    description: 'Lọc theo xuất xứ',
  })
  @IsString()
  @IsOptional()
  origin?: string;
} 