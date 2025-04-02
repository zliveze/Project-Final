import { IsOptional, IsString, IsNumber, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class BranchFilterDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  page?: number = 1;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  @Type(() => Number)
  limit?: number = 10;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsString()
  sort?: string = 'createdAt,desc';
} 