import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class UploadCategoryImageDto {
  @IsString()
  @IsNotEmpty()
  base64Image: string;

  @IsString()
  @IsOptional()
  alt?: string;
} 