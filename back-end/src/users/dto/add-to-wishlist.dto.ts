import { IsMongoId, IsNotEmpty, IsString, IsOptional } from 'class-validator';
import { Types } from 'mongoose';

export class AddToWishlistDto {
  @IsNotEmpty({ message: 'productId không được để trống' })
  @IsMongoId({ message: 'productId phải là một MongoID hợp lệ' })
  productId: string; // Giữ dạng string để validation

  @IsString({ message: 'variantId phải là một chuỗi' })
  @IsOptional() // Make variantId optional for products without variants
  variantId?: string;
}

// Có thể dùng chung DTO hoặc tạo riêng nếu cần validation khác
export class RemoveFromWishlistDto {
    @IsNotEmpty({ message: 'productId không được để trống' })
    @IsMongoId({ message: 'productId phải là một MongoID hợp lệ' })
    productId: string;

    @IsString({ message: 'variantId phải là một chuỗi' })
    @IsOptional() // Make variantId optional for products without variants
    variantId?: string;
}
