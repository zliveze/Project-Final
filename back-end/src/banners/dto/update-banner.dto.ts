import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsNumber, IsBoolean, IsDateString } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateBannerDto {
  @ApiPropertyOptional({ description: 'Tiêu đề banner' })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional({ description: 'ID của chiến dịch liên kết' })
  @IsOptional()
  @IsString()
  campaignId?: string;

  @ApiPropertyOptional({ description: 'Dữ liệu ảnh base64 cho desktop' })
  @IsOptional()
  @IsString()
  desktopImageData?: string;

  @ApiPropertyOptional({ description: 'Dữ liệu ảnh base64 cho mobile' })
  @IsOptional()
  @IsString()
  mobileImageData?: string;

  @ApiPropertyOptional({ description: 'Mô tả alt cho ảnh' })
  @IsOptional()
  @IsString()
  alt?: string;

  @ApiPropertyOptional({ description: 'Link khi click vào banner' })
  @IsOptional()
  @IsString()
  href?: string;

  @ApiPropertyOptional({ description: 'Trạng thái hiển thị' })
  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  active?: boolean;

  @ApiPropertyOptional({ description: 'Thứ tự hiển thị' })
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