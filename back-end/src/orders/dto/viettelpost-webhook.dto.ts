import { ApiProperty } from '@nestjs/swagger';
    import { IsString, IsNumber, IsOptional } from 'class-validator';

    export class ViettelPostWebhookDataDto {
      @ApiProperty({ description: 'Mã vận đơn Viettel Post', example: '10345381626' })
      @IsString()
      ORDER_NUMBER: string;

      @ApiProperty({ description: 'Mã đơn hàng của đối tác', example: 'TKS1801492', required: false })
      @IsOptional()
      @IsString()
      ORDER_REFERENCE?: string;

      @ApiProperty({ description: 'Ngày tháng trạng thái (dd/MM/yyyy HH:mm:ss)', example: '13/12/2018 17:34:05' })
      @IsString()
      ORDER_STATUSDATE: string;

      @ApiProperty({ description: 'Mã trạng thái Viettel Post', example: 200 })
      @IsNumber()
      ORDER_STATUS: number;

      @ApiProperty({ description: 'Tên trạng thái', example: 'Nhận từ bưu tá - Bưu cục gốc', required: false })
      @IsOptional()
      @IsString()
      STATUS_NAME?: string;

      @ApiProperty({ description: 'Vị trí hiện tại', example: 'TT Quận 1 - Hồ Chí Minh', required: false })
      @IsOptional()
      @IsString()
      LOCALION_CURRENTLY?: string; // Lưu ý: Có thể là LOCATION_CURRENTLY

      @ApiProperty({ description: 'Ghi chú', example: 'Giao cho bưu cục', required: false })
      @IsOptional()
      @IsString()
      NOTE?: string;

      @ApiProperty({ description: 'Tiền thu hộ', example: 1500000, required: false })
      @IsOptional()
      @IsNumber()
      MONEY_COLLECTION?: number;

      @ApiProperty({ description: 'Phí COD', example: 0, required: false })
      @IsOptional()
      @IsNumber()
      MONEY_FEECOD?: number;

      @ApiProperty({ description: 'Tổng cước', example: 45650, required: false })
      @IsOptional()
      @IsNumber()
      MONEY_TOTAL?: number;

      @ApiProperty({ description: 'Thời gian giao dự kiến', example: 'Khoảng 2 ngày làm việc', required: false })
      @IsOptional()
      @IsString()
      EXPECTED_DELIVERY?: string;

      @ApiProperty({ description: 'Trọng lượng sản phẩm (gram)', example: 245, required: false })
      @IsOptional()
      @IsNumber()
      PRODUCT_WEIGHT?: number;

      @ApiProperty({ description: 'Dịch vụ đơn hàng', example: 'SCOD', required: false })
      @IsOptional()
      @IsString()
      ORDER_SERVICE?: string;
    }

    export class ViettelPostWebhookDto {
      @ApiProperty({ type: ViettelPostWebhookDataDto })
      DATA: ViettelPostWebhookDataDto;

      @ApiProperty({ description: 'Token xác thực của đối tác', example: 'YOUR_VIETTELPOST_TOKEN' })
      @IsString()
      TOKEN: string;
    }
