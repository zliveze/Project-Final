import { ApiPropertyOptional } from '@nestjs/swagger';
import { 
  IsString, 
  IsNumber, 
  IsOptional, 
  IsArray, 
  IsBoolean, 
  IsEnum, 
  IsMongoId,
  Min,
  Max,
  IsIn,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  Validate,
  ValidationArguments
} from 'class-validator';
import { Type } from 'class-transformer';
import { Types } from 'mongoose';

// Custom validator for comma-separated MongoDB ObjectIds
@ValidatorConstraint({ name: 'IsCommaSeparatedMongoIds', async: false })
export class IsCommaSeparatedMongoIds implements ValidatorConstraintInterface {
  validate(value: string, args: ValidationArguments) {
    if (!value || typeof value !== 'string') {
      return false;
    }

    // Split by comma and check each ID
    const ids = value.split(',').map(id => id.trim()).filter(id => id.length > 0);
    
    // Must have at least one ID
    if (ids.length === 0) {
      return false;
    }

    // Check if all IDs are valid MongoDB ObjectIds
    return ids.every(id => Types.ObjectId.isValid(id));
  }

  defaultMessage(args: ValidationArguments) {
    return `${args.property} must be a valid MongoDB ObjectId or comma-separated list of valid MongoDB ObjectIds`;
  }
}

export class QueryProductDto {
  @ApiPropertyOptional({ description: 'Search term' })
  @IsString()
  @IsOptional()
  search?: string;

  @ApiPropertyOptional({ 
    description: 'Brand ID or comma-separated Brand IDs', 
    example: '507f1f77bcf86cd799439011' 
  })
  @IsString()
  @IsOptional()
  @Validate(IsCommaSeparatedMongoIds)
  brandId?: string;

  @ApiPropertyOptional({ 
    description: 'Category ID or comma-separated Category IDs', 
    example: '507f1f77bcf86cd799439011,507f1f77bcf86cd799439012' 
  })
  @IsString()
  @IsOptional()
  @Validate(IsCommaSeparatedMongoIds)
  categoryId?: string;

  @ApiPropertyOptional({ description: 'Event ID để lấy sản phẩm trong sự kiện cụ thể' })
  @IsMongoId()
  @IsOptional()
  eventId?: string;

  @ApiPropertyOptional({ description: 'Campaign ID để lấy sản phẩm trong chiến dịch cụ thể' })
  @IsMongoId()
  @IsOptional()
  campaignId?: string;

  @ApiPropertyOptional({ description: 'Product status', enum: ['active', 'out_of_stock', 'discontinued'] })
  @IsEnum(['active', 'out_of_stock', 'discontinued'])
  @IsOptional()
  status?: string;

  @ApiPropertyOptional({ description: 'Minimum price' })
  @IsNumber()
  @Min(0)
  @IsOptional()
  @Type(() => Number)
  minPrice?: number;

  @ApiPropertyOptional({ description: 'Maximum price' })
  @IsNumber()
  @Min(0)
  @IsOptional()
  @Type(() => Number)
  maxPrice?: number;

  @ApiPropertyOptional({ description: 'Tags (comma separated)' })
  @IsString()
  @IsOptional()
  tags?: string;

  @ApiPropertyOptional({ description: 'Skin types (comma separated)' })
  @IsString()
  @IsOptional()
  skinTypes?: string;

  @ApiPropertyOptional({ description: 'Skin concerns (comma separated)' })
  @IsString()
  @IsOptional()
  concerns?: string;

  @ApiPropertyOptional({ description: 'Is bestseller' })
  @IsBoolean()
  @IsOptional()
  @Type(() => Boolean)
  isBestSeller?: boolean;

  @ApiPropertyOptional({ description: 'Is new product' })
  @IsBoolean()
  @IsOptional()
  @Type(() => Boolean)
  isNew?: boolean;

  @ApiPropertyOptional({ description: 'Is on sale' })
  @IsBoolean()
  @IsOptional()
  @Type(() => Boolean)
  isOnSale?: boolean;

  @ApiPropertyOptional({ description: 'Has gifts' })
  @IsBoolean()
  @IsOptional()
  @Type(() => Boolean)
  hasGifts?: boolean;

  @ApiPropertyOptional({ description: 'Sort field', default: 'createdAt' })
  @IsIn(['name', 'price', 'currentPrice', 'createdAt', 'updatedAt', 'reviews.averageRating'])
  @IsOptional()
  sortBy?: string = 'createdAt';

  @ApiPropertyOptional({ description: 'Sort order', default: 'desc', enum: ['asc', 'desc'] })
  @IsIn(['asc', 'desc'])
  @IsOptional()
  sortOrder?: 'asc' | 'desc' = 'desc';

  @ApiPropertyOptional({ description: 'Page number', default: 1 })
  @IsNumber()
  @Min(1)
  @IsOptional()
  @Type(() => Number)
  page?: number = 1;

  @ApiPropertyOptional({ description: 'Items per page', default: 10 })
  @IsNumber()
  @Min(1)
  @Max(100)
  @IsOptional()
  @Type(() => Number)
  limit?: number = 10;
}
