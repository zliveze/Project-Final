import {
  IsString,
  IsNotEmpty,
  IsEnum,
  IsNumber,
  IsDateString,
  IsInt,
  Min,
  IsOptional,
  IsArray,
  IsMongoId,
  IsBoolean,
  ValidateIf,
  IsObject,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Types } from 'mongoose';

enum DiscountType {
  PERCENTAGE = 'percentage',
  FIXED = 'fixed',
}

export class ApplicableUserGroupsDto {
  @ApiPropertyOptional({ description: 'Áp dụng cho tất cả người dùng', default: true })
  @IsBoolean()
  @IsOptional()
  all?: boolean;

  @ApiPropertyOptional({ description: 'Chỉ áp dụng cho người dùng mới', default: false })
  @IsBoolean()
  @IsOptional()
  new?: boolean;

  @ApiPropertyOptional({ description: 'Danh sách ID người dùng cụ thể được áp dụng' })
  @IsArray()
  @IsMongoId({ each: true })
  @IsOptional()
  specific?: Types.ObjectId[];
}

export class CreateVoucherDto {
  @ApiProperty({ description: 'Mã giảm giá, phải là duy nhất', example: 'SUMMER20' })
  @IsString()
  @IsNotEmpty()
  code: string;

  @ApiPropertyOptional({ description: 'Mô tả voucher', example: 'Giảm giá 20% cho đơn hàng mùa hè' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ enum: DiscountType, description: 'Loại giảm giá', example: DiscountType.PERCENTAGE })
  @IsEnum(DiscountType)
  @IsNotEmpty()
  discountType: DiscountType;

  @ApiProperty({ description: 'Giá trị giảm giá', example: 20 })
  @IsNumber()
  @Min(0)
  discountValue: number;

  @ApiPropertyOptional({ description: 'Giá trị đơn hàng tối thiểu để áp dụng', example: 500000 })
  @IsNumber()
  @Min(0)
  @IsOptional()
  minimumOrderValue?: number;

  @ApiProperty({ description: 'Ngày bắt đầu hiệu lực (ISO 8601)', example: '2025-06-01T00:00:00.000Z' })
  @IsDateString()
  @IsNotEmpty()
  startDate: string;

  @ApiProperty({ description: 'Ngày kết thúc hiệu lực (ISO 8601)', example: '2025-08-31T23:59:59.000Z' })
  @IsDateString()
  @IsNotEmpty()
  endDate: string;

  @ApiProperty({ description: 'Tổng số lần có thể sử dụng', example: 100 })
  @IsInt()
  @Min(1)
  usageLimit: number;

  @ApiPropertyOptional({ description: 'Danh sách ID sản phẩm cụ thể được áp dụng' })
  @IsArray()
  @IsMongoId({ each: true })
  @IsOptional()
  applicableProducts?: Types.ObjectId[];

  @ApiPropertyOptional({ description: 'Danh sách ID danh mục cụ thể được áp dụng' })
  @IsArray()
  @IsMongoId({ each: true })
  @IsOptional()
  applicableCategories?: Types.ObjectId[];

  @ApiPropertyOptional({ description: 'Danh sách ID thương hiệu cụ thể được áp dụng' })
  @IsArray()
  @IsMongoId({ each: true })
  @IsOptional()
  applicableBrands?: Types.ObjectId[];

  @ApiPropertyOptional({ description: 'Danh sách ID sự kiện được áp dụng' })
  @IsArray()
  @IsMongoId({ each: true })
  @IsOptional()
  applicableEvents?: Types.ObjectId[];

  @ApiPropertyOptional({ description: 'Danh sách ID chiến dịch được áp dụng' })
  @IsArray()
  @IsMongoId({ each: true })
  @IsOptional()
  applicableCampaigns?: Types.ObjectId[];

  @ApiPropertyOptional({ 
    description: 'Cấu hình người dùng được áp dụng voucher',
    type: ApplicableUserGroupsDto
  })
  @IsObject()
  @IsOptional()
  applicableUserGroups?: ApplicableUserGroupsDto;

  @ApiPropertyOptional({ description: 'Trạng thái hoạt động', default: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
