import {
  IsString,
  IsNotEmpty,
  IsNumber,
  Min,
  IsOptional,
  IsArray,
  IsMongoId,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ApplyVoucherDto {
  @ApiProperty({ description: 'Mã voucher', example: 'SUMMER20' })
  @IsString()
  @IsNotEmpty()
  code: string;

  @ApiProperty({ description: 'Tổng giá trị đơn hàng', example: 500000 })
  @IsNumber()
  @Min(0)
  orderValue: number;

  @ApiPropertyOptional({ description: 'Danh sách ID sản phẩm trong giỏ hàng' })
  @IsOptional()
  @IsArray()
  @IsMongoId({ each: true })
  productIds?: string[];
} 