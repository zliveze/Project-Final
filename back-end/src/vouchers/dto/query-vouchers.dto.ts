import {
  IsString,
  IsOptional,
  IsBoolean,
  IsEnum,
  IsInt,
  Min,
  IsDateString,
  IsIn,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';

export class QueryVouchersDto {
  @ApiPropertyOptional({ description: 'Số trang (bắt đầu từ 1)', example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ description: 'Số lượng item trên mỗi trang', example: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 10;

  @ApiPropertyOptional({ description: 'Tìm kiếm theo mã voucher', example: 'SUMMER' })
  @IsOptional()
  @IsString()
  code?: string;

  @ApiPropertyOptional({ description: 'Lọc theo trạng thái kích hoạt', example: true })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ description: 'Thời gian bắt đầu hiệu lực từ', example: '2024-01-01T00:00:00.000Z' })
  @IsOptional()
  @IsDateString()
  startDateFrom?: string;

  @ApiPropertyOptional({ description: 'Thời gian bắt đầu hiệu lực đến', example: '2024-12-31T23:59:59.999Z' })
  @IsOptional()
  @IsDateString()
  startDateTo?: string;

  @ApiPropertyOptional({ description: 'Thời gian kết thúc hiệu lực từ', example: '2024-01-01T00:00:00.000Z' })
  @IsOptional()
  @IsDateString()
  endDateFrom?: string;

  @ApiPropertyOptional({ description: 'Thời gian kết thúc hiệu lực đến', example: '2024-12-31T23:59:59.999Z' })
  @IsOptional()
  @IsDateString()
  endDateTo?: string;

  @ApiPropertyOptional({ description: 'Sắp xếp theo trường', enum: ['code', 'discountValue', 'createdAt', 'endDate', 'usedCount'], example: 'createdAt' })
  @IsOptional()
  @IsString()
  @IsIn(['code', 'discountValue', 'createdAt', 'endDate', 'usedCount'])
  sortBy?: string = 'createdAt';

  @ApiPropertyOptional({ description: 'Thứ tự sắp xếp', enum: ['asc', 'desc'], example: 'desc' })
  @IsOptional()
  @IsString()
  @IsEnum(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc' = 'desc';
} 