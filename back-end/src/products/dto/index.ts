export { CreateProductDto } from './create-product.dto';
export {
  VariantOptionsDto,
  VariantCombinationDto,
  ProductVariantDto,
  ProductInventoryDto,
  VariantInventoryDto,
  CombinationInventoryDto,
  ProductDescriptionDto,
  ProductSeoDto,
  ProductVolumeDto,
  ProductExpiryDto,
  CosmeticInfoDto,
  ProductFlagsDto,
  GiftConditionsDto,
  GiftImageDto,
  ProductGiftDto
} from './create-product.dto';

export { UpdateProductDto } from './update-product.dto';

export { QueryProductDto } from './query-product.dto';

export {
  ProductResponseDto,
  PaginatedProductsResponseDto
} from './product-response.dto';

export * from './light-product.dto';
export * from './admin-list-product.dto';

import * as CreateDtos from './create-product.dto';
import * as ResponseDtos from './product-response.dto';

export const Create = {
  ProductImageDto: CreateDtos.ProductImageDto,
  ProductVariantDto: CreateDtos.ProductVariantDto,
  VariantCombinationDto: CreateDtos.VariantCombinationDto,
  VariantInventoryDto: CreateDtos.VariantInventoryDto,
  CombinationInventoryDto: CreateDtos.CombinationInventoryDto,
};

export const Response = {
  ProductImageDto: ResponseDtos.ProductImageDto,
  ProductVariantDto: ResponseDtos.ProductVariantDto,
};
