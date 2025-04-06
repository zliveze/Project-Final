import { PartialType } from '@nestjs/swagger';
import { CreateVoucherDto } from './create-voucher.dto';

// UpdateVoucherDto kế thừa từ CreateVoucherDto nhưng làm tất cả các trường đều là optional
export class UpdateVoucherDto extends PartialType(CreateVoucherDto) {}
