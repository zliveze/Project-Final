// back-end/src/carts/dto/update-cart-item.dto.ts
import { IsNotEmpty, IsNumber, Min, IsObject, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateCartItemDto {
  @ApiProperty({
    description: 'Số lượng mới của sản phẩm trong giỏ hàng',
    example: 3,
    type: Number,
    minimum: 1,
  })
  @IsNumber({}, { message: 'Số lượng phải là một số' })
  @Min(1, { message: 'Số lượng phải lớn hơn hoặc bằng 1' })
  @IsNotEmpty({ message: 'Số lượng không được để trống' })
  @Type(() => Number)
  quantity: number;

  @ApiPropertyOptional({
    description: 'Các tùy chọn đã chọn (ví dụ: màu sắc, kích thước, chi nhánh)',
    example: { selectedBranchId: '60d5ec49f8d3e7e7d8f1e8a1' },
    type: Object,
    required: false,
  })
  @IsObject({ message: 'Tùy chọn phải là một đối tượng' })
  @IsOptional() // Options might not always be present
  selectedOptions?: Record<string, string>;
}
