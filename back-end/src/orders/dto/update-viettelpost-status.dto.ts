import { ApiProperty } from '@nestjs/swagger';
    import { IsNotEmpty, IsNumber, IsString, IsOptional, Matches,IsIn } from 'class-validator';

    export enum ViettelPostUpdateOrderStatusType {
      APPROVE_ORDER = 1, // Duyệt đơn hàng
      APPROVE_RETURN = 2, // Duyệt chuyển hoàn
      CONTINUE_DELIVERY = 3, // Phát tiếp
      CANCEL_ORDER = 4, // Hủy đơn hàng
      RE_ORDER = 5, // Lấy lại đơn hàng (Gửi lại)
      DELETE_CANCELED_ORDER = 11, // Xóa đơn hàng đã hủy
    }

    export class UpdateViettelPostStatusDto {
      @ApiProperty({
        description: 'Loại trạng thái cập nhật',
        enum: ViettelPostUpdateOrderStatusType,
        example: ViettelPostUpdateOrderStatusType.APPROVE_ORDER,
      })
      @IsNotEmpty()
      @IsIn(Object.values(ViettelPostUpdateOrderStatusType))
      TYPE: ViettelPostUpdateOrderStatusType;

      @ApiProperty({ description: 'Mã vận đơn Viettel Post', example: '123456789' })
      @IsNotEmpty()
      @IsString() // Mặc dù API nói NUMBER, nhưng mã vận đơn thường là chuỗi, và ViettelPost API có thể linh hoạt
      ORDER_NUMBER: string;

      @ApiProperty({ description: 'Ghi chú đơn hàng', example: 'Khách hàng yêu cầu giao nhanh', required: false })
      @IsOptional()
      @IsString()
      NOTE?: string;

      @ApiProperty({
        description: 'Ngày tháng áp dụng cho trạng thái "Lấy lại đơn hàng" (dd/MM/yyyy HH:mm:ss)',
        example: '15/12/2023 10:30:00',
        required: false,
      })
      @IsOptional()
      @IsString()
      @Matches(/^(\d{2})\/(\d{2})\/(\d{4}) (\d{2}):(\d{2}):(\d{2})$/, {
        message: 'DATE phải có định dạng dd/MM/yyyy HH:mm:ss',
      })
      DATE?: string; // Chỉ có giá trị ở trạng thái thứ 5 (RE_ORDER)
    }
