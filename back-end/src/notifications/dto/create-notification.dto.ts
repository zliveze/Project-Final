import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsEnum, IsOptional, IsNumber, IsDate, IsBoolean, IsDateString } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateNotificationDto {
  @ApiProperty({ description: 'Nội dung thông báo' })
  @IsNotEmpty()
  @IsString()
  content: string;

  @ApiProperty({ description: 'Loại thông báo', enum: ['voucher', 'shipping', 'promotion', 'system'] })
  @IsNotEmpty()
  @IsEnum(['voucher', 'shipping', 'promotion', 'system'])
  type: string;

  @ApiPropertyOptional({ description: 'Đường dẫn liên kết (nếu có)' })
  @IsOptional()
  @IsString()
  link?: string;

  @ApiProperty({ description: 'Độ ưu tiên hiển thị', default: 0 })
  @IsNumber()
  @Type(() => Number)
  @IsOptional()
  priority?: number;

  @ApiProperty({ description: 'Ngày bắt đầu hiển thị' })
  @IsNotEmpty()
  @IsDateString()
  startDate: string;

  @ApiPropertyOptional({ description: 'Ngày kết thúc hiển thị (nếu có)' })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({ description: 'Trạng thái hiển thị', default: true })
  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  isActive?: boolean;

  @ApiPropertyOptional({ description: 'Màu nền (mã màu HEX hoặc tên màu)' })
  @IsOptional()
  @IsString()
  backgroundColor?: string;

  @ApiPropertyOptional({ description: 'Màu chữ (mã màu HEX hoặc tên màu)' })
  @IsOptional()
  @IsString()
  textColor?: string;
} 