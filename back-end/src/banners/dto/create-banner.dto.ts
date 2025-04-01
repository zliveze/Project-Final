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