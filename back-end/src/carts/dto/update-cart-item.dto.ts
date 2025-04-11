// back-end/src/carts/dto/update-cart-item.dto.ts
import { IsNotEmpty, IsNumber, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

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
}
