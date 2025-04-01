import { v2 as cloudinary } from 'cloudinary';
import { ConfigService } from '@nestjs/config';

export const CloudinaryProvider = {
  provide: 'CLOUDINARY',
  inject: [ConfigService],
  useFactory: (configService: ConfigService) => {
    return cloudinary.config({
      cloud_name: configService.get<string>('CLOUDINARY_CLOUD_NAME') || 'dw2kj82vv',
      api_key: configService.get<string>('CLOUDINARY_API_KEY') || '255557424547929',
      api_secret: configService.get<string>('CLOUDINARY_API_SECRET') || 'C9s_zAYkVH6Ow_I-FvB_O-XfmAs',
    });
  },
}; 