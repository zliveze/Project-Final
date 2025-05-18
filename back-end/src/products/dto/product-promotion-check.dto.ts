import { ApiProperty } from '@nestjs/swagger';

export class ProductPromotionCheckDto {
  @ApiProperty({ description: 'ID của sản phẩm' })
  productId: string;

  @ApiProperty({ description: 'ID của biến thể sản phẩm (nếu có)', required: false })
  variantId?: string;

  @ApiProperty({ description: 'Sản phẩm có trong Event nào không', default: false })
  inEvent: boolean;

  @ApiProperty({ description: 'ID của Event chứa sản phẩm (nếu có)', required: false })
  eventId?: string;

  @ApiProperty({ description: 'Tên của Event chứa sản phẩm (nếu có)', required: false })
  eventName?: string;

  @ApiProperty({ description: 'Sản phẩm có trong Campaign nào không', default: false })
  inCampaign: boolean;

  @ApiProperty({ description: 'ID của Campaign chứa sản phẩm (nếu có)', required: false })
  campaignId?: string;

  @ApiProperty({ description: 'Tên của Campaign chứa sản phẩm (nếu có)', required: false })
  campaignName?: string;
}

export class ProductsPromotionCheckDto {
  @ApiProperty({ description: 'Danh sách thông tin kiểm tra sản phẩm', type: [ProductPromotionCheckDto] })
  items: ProductPromotionCheckDto[];
}
