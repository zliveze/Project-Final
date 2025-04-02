import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsUrl, IsBoolean, ValidateNested, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';

class LogoDto {
  @ApiProperty({ description: 'URL hình ảnh logo' })
  @IsUrl({}, { message: 'URL logo không hợp lệ' })
  @IsOptional()
  url?: string;

  @ApiPropertyOptional({ description: 'Mô tả thay thế cho logo' })
  @IsString()
  @IsOptional()
  alt?: string;

  @ApiPropertyOptional({ description: 'Public ID của logo trên Cloudinary' })
  @IsString()
  @IsOptional()
  publicId?: string;
}

class SocialMediaDto {
  @ApiPropertyOptional({ description: 'Link Facebook của thương hiệu' })
  @IsUrl({}, { message: 'URL Facebook không hợp lệ' })
  @IsOptional()
  facebook?: string;

  @ApiPropertyOptional({ description: 'Link Instagram của thương hiệu' })
  @IsUrl({}, { message: 'URL Instagram không hợp lệ' })
  @IsOptional()
  instagram?: string;

  @ApiPropertyOptional({ description: 'Link Youtube của thương hiệu' })
  @IsUrl({}, { message: 'URL Youtube không hợp lệ' })
  @IsOptional()
  youtube?: string;
}

export class CreateBrandDto {
  @ApiProperty({ description: 'Tên thương hiệu', example: 'L\'Oréal' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ description: 'Mô tả về thương hiệu' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ description: 'Thông tin logo của thương hiệu' })
  @ValidateNested()
  @Type(() => LogoDto)
  @IsOptional()
  logo?: LogoDto;

  @ApiPropertyOptional({ description: 'Xuất xứ thương hiệu', example: 'Pháp' })
  @IsString()
  @IsOptional()
  origin?: string;

  @ApiPropertyOptional({ description: 'Website chính thức của thương hiệu' })
  @IsUrl({}, { message: 'URL website không hợp lệ' })
  @IsOptional()
  website?: string;

  @ApiPropertyOptional({ description: 'Có phải là thương hiệu nổi bật không', default: false })
  @IsBoolean()
  @IsOptional()
  featured?: boolean;

  @ApiPropertyOptional({ description: 'Trạng thái của thương hiệu', enum: ['active', 'inactive'], default: 'active' })
  @IsEnum(['active', 'inactive'])
  @IsOptional()
  status?: string;

  @ApiPropertyOptional({ description: 'Thông tin mạng xã hội của thương hiệu' })
  @ValidateNested()
  @Type(() => SocialMediaDto)
  @IsOptional()
  socialMedia?: SocialMediaDto;
} 