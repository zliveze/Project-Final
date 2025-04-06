import { IsArray, IsDate, IsMongoId, IsNotEmpty, IsNumber, IsOptional, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { Schema as MongooseSchema } from 'mongoose';

export class ProductInEventDto {
  @ApiProperty({ description: 'Product ID' })
  @IsMongoId()
  @IsNotEmpty()
  productId: MongooseSchema.Types.ObjectId;

  @ApiProperty({ description: 'Product Variant ID (optional)', required: false })
  @IsMongoId()
  @IsOptional()
  variantId?: MongooseSchema.Types.ObjectId;

  @ApiProperty({ description: 'Adjusted price for the product during the event' })
  @IsNumber()
  @IsNotEmpty()
  adjustedPrice: number;
}

export class CreateEventDto {
  @ApiProperty({ description: 'Event title' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ description: 'Event description' })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({ description: 'Event tags', type: [String], required: false })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags?: string[];

  @ApiProperty({ description: 'Event start date' })
  @IsDate()
  @Type(() => Date)
  @IsNotEmpty()
  startDate: Date;

  @ApiProperty({ description: 'Event end date' })
  @IsDate()
  @Type(() => Date)
  @IsNotEmpty()
  endDate: Date;

  @ApiProperty({ 
    description: 'Products in event with adjusted prices',
    type: [ProductInEventDto],
    required: false 
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProductInEventDto)
  @IsOptional()
  products?: ProductInEventDto[];
} 