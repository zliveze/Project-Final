import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsOptional, IsString, IsDate } from 'class-validator';
import { CampaignType } from './create-campaign.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';

export class QueryCampaignDto extends PaginationDto {
  @ApiProperty({ description: 'Tìm kiếm theo tiêu đề', required: false })
  @IsString()
  @IsOptional()
  search?: string;

  @ApiProperty({
    description: 'Lọc theo loại chiến dịch',
    enum: CampaignType,
    required: false,
  })
  @IsEnum(CampaignType)
  @IsOptional()
  type?: CampaignType;

  @ApiProperty({ description: 'Lọc theo ngày bắt đầu từ', required: false })
  @IsDate()
  @Type(() => Date)
  @IsOptional()
  startDateFrom?: Date;

  @ApiProperty({ description: 'Lọc theo ngày bắt đầu đến', required: false })
  @IsDate()
  @Type(() => Date)
  @IsOptional()
  startDateTo?: Date;

  @ApiProperty({ description: 'Lọc theo ngày kết thúc từ', required: false })
  @IsDate()
  @Type(() => Date)
  @IsOptional()
  endDateFrom?: Date;

  @ApiProperty({ description: 'Lọc theo ngày kết thúc đến', required: false })
  @IsDate()
  @Type(() => Date)
  @IsOptional()
  endDateTo?: Date;
} 