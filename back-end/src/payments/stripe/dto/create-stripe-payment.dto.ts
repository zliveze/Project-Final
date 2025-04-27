import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateStripePaymentDto {
  @IsNotEmpty()
  @IsNumber()
  amount: number;

  @IsNotEmpty()
  @IsString()
  currency: string = 'vnd';

  @IsOptional()
  @IsString()
  orderId?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  metadata?: Record<string, any>;
}
