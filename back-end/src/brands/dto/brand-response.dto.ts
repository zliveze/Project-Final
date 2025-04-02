import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

class LogoResponseDto {
  @ApiProperty({ description: 'URL hình ảnh logo' })
  url: string;

  @ApiPropertyOptional({ description: 'Mô tả thay thế cho logo' })
  alt?: string;

  @ApiPropertyOptional({ description: 'Public ID của logo trên Cloudinary' })
  publicId?: string;
}

class SocialMediaResponseDto {
  @ApiPropertyOptional({ description: 'Link Facebook của thương hiệu' })
  facebook?: string;

  @ApiPropertyOptional({ description: 'Link Instagram của thương hiệu' })
  instagram?: string;

  @ApiPropertyOptional({ description: 'Link Youtube của thương hiệu' })
  youtube?: string;
}

export class BrandResponseDto {
  @ApiProperty({ description: 'ID của thương hiệu' })
  _id: string;

  @ApiProperty({ description: 'Tên thương hiệu' })
  name: string;

  @ApiPropertyOptional({ description: 'Mô tả về thương hiệu' })
  description?: string;

  @ApiProperty({ description: 'Thông tin logo của thương hiệu' })
  logo: LogoResponseDto;

  @ApiPropertyOptional({ description: 'Xuất xứ thương hiệu' })
  origin?: string;

  @ApiPropertyOptional({ description: 'Website chính thức của thương hiệu' })
  website?: string;

  @ApiProperty({ description: 'Có phải là thương hiệu nổi bật không' })
  featured: boolean;

  @ApiProperty({ description: 'Trạng thái của thương hiệu', enum: ['active', 'inactive'] })
  status: string;

  @ApiPropertyOptional({ description: 'Thông tin mạng xã hội của thương hiệu' })
  socialMedia?: SocialMediaResponseDto;

  @ApiProperty({ description: 'Ngày tạo' })
  createdAt: Date;

  @ApiProperty({ description: 'Ngày cập nhật' })
  updatedAt: Date;
} 