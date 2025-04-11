// back-end/src/carts/dto/add-to-cart.dto.ts
import { IsMongoId, IsNotEmpty, IsNumber, IsObject, IsOptional, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger'; // Import ApiProperty for Swagger documentation

export class AddToCartDto {
  @ApiProperty({
    description: 'ID của sản phẩm',
    example: '60d5ec49f8d3e7e7d8f1e8a1',
    type: String,
  })
  @IsNotEmpty({ message: 'ID sản phẩm không được để trống' })
  @IsMongoId({ message: 'ID sản phẩm không hợp lệ' })
  productId: string;

  @ApiProperty({
    description: 'ID của biến thể sản phẩm',
    example: '60d5ecbaf8d3e7e7d8f1e8a2',
    type: String,
  })
  @IsNotEmpty({ message: 'ID biến thể không được để trống' })
  @IsMongoId({ message: 'ID biến thể không hợp lệ' })
  variantId: string;

  @ApiProperty({
    description: 'Số lượng sản phẩm muốn thêm',
    example: 1,
    type: Number,
    minimum: 1,
  })
  @IsNumber({}, { message: 'Số lượng phải là một số' })
  @Min(1, { message: 'Số lượng phải lớn hơn hoặc bằng 1' })
  @Type(() => Number) // Ensure transformation from string if needed
  quantity: number;

  @ApiProperty({
    description: 'Các tùy chọn đã chọn (ví dụ: màu sắc, kích thước)',
    example: { color: 'Red', size: 'M' },
    type: Object,
    required: false,
  })
  @IsObject({ message: 'Tùy chọn phải là một đối tượng' })
  @IsOptional() // Options might not always be present depending on product
  selectedOptions?: Record<string, string>;
}
