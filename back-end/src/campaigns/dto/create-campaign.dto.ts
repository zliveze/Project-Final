import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsDate,
  IsEnum,
  IsMongoId,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Types } from 'mongoose';

export enum CampaignType {
  HERO_BANNER = 'Hero Banner',
  SALE_EVENT = 'Sale Event',
}

class CampaignProductDto {
  @ApiProperty({ description: 'ID của sản phẩm' })
  @IsMongoId()
  @IsNotEmpty()
  productId: Types.ObjectId;

  @ApiProperty({ description: 'ID của biến thể sản phẩm (nếu có)', required: false })
  @IsMongoId()
  @IsOptional()
  variantId?: Types.ObjectId;

  @ApiProperty({ description: 'Giá sản phẩm trong thời gian Campaign' })
  @IsNumber()
  @IsNotEmpty()
  adjustedPrice: number;
}

export class CreateCampaignDto {
  @ApiProperty({ description: 'Tiêu đề chiến dịch' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ description: 'Mô tả chiến dịch', required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({
    description: 'Loại chiến dịch',
    enum: CampaignType,
    enumName: 'CampaignType',
  })
  @IsEnum(CampaignType)
  @IsNotEmpty()
  type: CampaignType;

  @ApiProperty({ description: 'Ngày bắt đầu chiến dịch' })
  @IsDate()
  @Type(() => Date)
  @IsNotEmpty()
  startDate: Date;

  @ApiProperty({ description: 'Ngày kết thúc chiến dịch' })
  @IsDate()
  @Type(() => Date)
  @IsNotEmpty()
  endDate: Date;

  @ApiProperty({
    description: 'Danh sách sản phẩm trong chiến dịch',
    type: [CampaignProductDto],
    required: false,
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CampaignProductDto)
  @IsOptional()
  products?: CampaignProductDto[];
} 