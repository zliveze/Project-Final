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

  // Thêm các trường này để ValidationPipe không báo lỗi
  // Mặc dù controller lấy userId từ token và không dùng trực tiếp customerLevel từ DTO
  @ApiPropertyOptional({ description: 'ID người dùng (frontend gửi nhưng backend lấy từ token)', example: '60c7a1b9d0b1c234567890d1' })
  @IsOptional()
  @IsMongoId()
  userId?: string;

  @ApiPropertyOptional({ description: 'Cấp độ khách hàng (frontend gửi)', example: 'Khách hàng bạc' })
  @IsOptional()
  @IsString()
  customerLevel?: string | null; // Cho phép null vì frontend có thể gửi null
}
