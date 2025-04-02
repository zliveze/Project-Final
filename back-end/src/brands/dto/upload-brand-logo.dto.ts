import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty } from 'class-validator';

export class UploadBrandLogoDto {
  @ApiProperty({
    description: 'File ảnh logo (jpg, png, jpeg)',
    type: 'string',
    format: 'binary',
  })
  @IsNotEmpty()
  file: Express.Multer.File;
} 