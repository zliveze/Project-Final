import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsOptional, IsIn } from 'class-validator';

export class UploadBannerImageDto {
  @ApiProperty({ description: 'Dữ liệu ảnh dạng base64' })
  @IsNotEmpty()
  @IsString()
  imageData: string;

  @ApiProperty({ description: 'Loại ảnh (desktop/mobile)', enum: ['desktop', 'mobile'] })
  @IsNotEmpty()
  @IsString()
  @IsIn(['desktop', 'mobile'])
  type: 'desktop' | 'mobile';

  @ApiPropertyOptional({ description: 'ID chiến dịch liên quan (nếu có)' })
  @IsOptional()
  @IsString()
  campaignId?: string;
} 