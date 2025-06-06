import { Injectable, Logger } from '@nestjs/common';
import { v2 as cloudinary } from 'cloudinary';
import { UploadApiOptions, UploadApiResponse } from 'cloudinary';
import { ConfigService } from '@nestjs/config';

export interface CloudinaryResponse {
  publicId: string;
  secureUrl: string;
  url: string;
  format: string;
  width: number;
  height: number;
  resource_type: string;
}

@Injectable()
export class CloudinaryService {
  private readonly logger = new Logger(CloudinaryService.name);
  private readonly defaultUploadPreset: string;
  private readonly folders: { [key: string]: string };
  private readonly cloudName: string;

  constructor(private readonly configService: ConfigService) {
    const cloudNameValue = this.configService.get<string>('CLOUDINARY_CLOUD_NAME');
    if (!cloudNameValue) {
      throw new Error('CLOUDINARY_CLOUD_NAME không được cấu hình');
    }
    this.cloudName = cloudNameValue;
    this.defaultUploadPreset = this.configService.get<string>('CLOUDINARY_UPLOAD_PRESET') || 'Yumin Banner';
    this.folders = {
      banner: this.configService.get<string>('CLOUDINARY_FOLDER_BANNER') || 'Yumin/banner',
      product: this.configService.get<string>('CLOUDINARY_FOLDER_PRODUCT') || 'Yumin/product',
      category: this.configService.get<string>('CLOUDINARY_FOLDER_CATEGORY') || 'Yumin/category',
      user: this.configService.get<string>('CLOUDINARY_FOLDER_USER') || 'Yumin/user',
      blog: this.configService.get<string>('CLOUDINARY_FOLDER_BLOG') || 'Yumin/blog',
    };
    this.logger.log(`Cloudinary config initialized with preset: ${this.defaultUploadPreset}`);

    // Cấu hình Cloudinary
    cloudinary.config({
      cloud_name: this.configService.get<string>('CLOUDINARY_CLOUD_NAME'),
      api_key: this.configService.get<string>('CLOUDINARY_API_KEY'),
      api_secret: this.configService.get<string>('CLOUDINARY_API_SECRET'),
      secure: true
    });
  }

  /**
   * Tải lên một hình ảnh lên Cloudinary
   * @param base64 Dữ liệu base64 của hình ảnh
   * @param options Tùy chọn tải lên (folder, resourceType, tags, ...)
   * @returns Thông tin hình ảnh sau khi tải lên
   */
  async uploadImage(
    base64: string,
    options: {
      folder?: keyof typeof this.folders | string;
      resourceType?: 'image' | 'video' | 'raw' | 'auto';
      tags?: string[];
      transformation?: any;
      uploadPreset?: string;
    } = {},
  ): Promise<{
    url: string;
    publicId: string;
    width: number;
    height: number;
    format: string;
    secureUrl: string;
    resourceType: string;
    tags?: string[];
  }> {
    try {
      const { 
        folder = 'banner', 
        resourceType = 'image', 
        tags = [],
        transformation = {},
        uploadPreset = this.defaultUploadPreset
      } = options;

      const uploadOptions: UploadApiOptions = {
        upload_preset: uploadPreset,
        folder: typeof folder === 'string' ? 
          (this.folders[folder as keyof typeof this.folders] || folder) : 
          this.folders.banner,
        resource_type: resourceType,
        tags: tags,
        transformation: transformation,
      };

      this.logger.debug(`Uploading with options: ${JSON.stringify({
        preset: uploadPreset,
        folder: uploadOptions.folder,
        resource_type: resourceType,
        tags: tags
      })}`);

      const uploadResult: UploadApiResponse = await cloudinary.uploader.upload(base64, uploadOptions);

      this.logger.log(`Uploaded ${resourceType} to Cloudinary: ${uploadResult.public_id}`);
      
      return {
        url: uploadResult.url,
        secureUrl: uploadResult.secure_url,
        publicId: uploadResult.public_id,
        width: uploadResult.width,
        height: uploadResult.height,
        format: uploadResult.format,
        resourceType: uploadResult.resource_type,
        tags: uploadResult.tags,
      };
    } catch (error) {
      this.logger.error(`Upload to Cloudinary failed: ${error.message}`, error.stack);
      throw new Error(`Upload to Cloudinary failed: ${error.message}`);
    }
  }

  /**
   * Tải lên một file hình ảnh trực tiếp lên Cloudinary
   * @param filePath Đường dẫn đến file
   * @param options Tùy chọn tải lên (folder, resourceType, tags, ...)
   * @returns Thông tin hình ảnh sau khi tải lên
   */
  async uploadImageFile(
    filePath: string,
    options: {
      folder?: keyof typeof this.folders | string;
      resourceType?: 'image' | 'video' | 'raw' | 'auto';
      tags?: string[];
      transformation?: any;
      uploadPreset?: string;
    } = {},
  ): Promise<{
    url: string;
    publicId: string;
    width: number;
    height: number;
    format: string;
    secureUrl: string;
    resourceType: string;
    tags?: string[];
  }> {
    try {
      // Kiểm tra đường dẫn file
      if (!filePath) {
        this.logger.error('Missing filePath in uploadImageFile');
        throw new Error('Missing required parameter - file');
      }

      // Kiểm tra xem file có tồn tại không
      const fs = require('fs');
      if (!fs.existsSync(filePath)) {
        this.logger.error(`File không tồn tại tại đường dẫn: ${filePath}`);
        throw new Error(`File không tồn tại tại đường dẫn: ${filePath}`);
      }

      const { 
        folder = 'banner', 
        resourceType = 'image', 
        tags = [],
        transformation = {},
        uploadPreset = this.defaultUploadPreset
      } = options;

      const uploadOptions: UploadApiOptions = {
        upload_preset: uploadPreset,
        folder: typeof folder === 'string' ? 
          (this.folders[folder as keyof typeof this.folders] || folder) : 
          this.folders.banner,
        resource_type: resourceType,
        tags: tags,
        transformation: transformation,
      };

      this.logger.debug(`Uploading file with options: ${JSON.stringify({
        preset: uploadPreset,
        folder: uploadOptions.folder,
        resource_type: resourceType,
        tags: tags
      })}`);

      // Tải file trực tiếp lên Cloudinary
      const uploadResult: UploadApiResponse = await cloudinary.uploader.upload(filePath, uploadOptions);

      this.logger.log(`Uploaded file ${resourceType} to Cloudinary: ${uploadResult.public_id}`);
      
      return {
        url: uploadResult.url,
        secureUrl: uploadResult.secure_url,
        publicId: uploadResult.public_id,
        width: uploadResult.width,
        height: uploadResult.height,
        format: uploadResult.format,
        resourceType: uploadResult.resource_type,
        tags: uploadResult.tags,
      };
    } catch (error) {
      this.logger.error(`Upload file to Cloudinary failed: ${error.message}`, error.stack);
      throw new Error(`Upload file to Cloudinary failed: ${error.message}`);
    }
  }

  /**
   * Tải lên một buffer hình ảnh trực tiếp lên Cloudinary
   * @param buffer Buffer của file hình ảnh
   * @param options Tùy chọn tải lên (folder, resourceType, tags, ...)
   * @returns Thông tin hình ảnh sau khi tải lên
   */
  async uploadImageBuffer(
    buffer: Buffer,
    options: {
      folder?: keyof typeof this.folders | string;
      resourceType?: 'image' | 'video' | 'raw' | 'auto';
      tags?: string[];
      transformation?: any;
      uploadPreset?: string;
    } = {},
  ): Promise<{
    url: string;
    publicId: string;
    width: number;
    height: number;
    format: string;
    secureUrl: string;
    resourceType: string;
    tags?: string[];
  }> {
    try {
      // Kiểm tra buffer
      if (!buffer || buffer.length === 0) {
        this.logger.error('Missing or empty buffer in uploadImageBuffer');
        throw new Error('Missing or empty buffer');
      }

      const { 
        folder = 'banner', 
        resourceType = 'image', 
        tags = [],
        transformation = {},
        uploadPreset = this.defaultUploadPreset
      } = options;

      const uploadOptions: UploadApiOptions = {
        upload_preset: uploadPreset,
        folder: typeof folder === 'string' ? 
          (this.folders[folder as keyof typeof this.folders] || folder) : 
          this.folders.banner,
        resource_type: resourceType,
        tags: tags,
        transformation: transformation,
      };

      this.logger.debug(`Uploading buffer with options: ${JSON.stringify({
        preset: uploadPreset,
        folder: uploadOptions.folder,
        resource_type: resourceType,
        tags: tags
      })}`);

      // Chuyển đổi buffer thành dạng mà Cloudinary có thể xử lý
      const streamifier = require('streamifier');
      const stream = cloudinary.uploader.upload_stream(uploadOptions, (error, result) => {
        if (error) {
          this.logger.error(`Upload buffer to Cloudinary failed: ${error.message}`, error);
          throw new Error(`Upload buffer to Cloudinary failed: ${error.message}`);
        }
      });

      // Tải buffer lên Cloudinary
      return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          uploadOptions,
          (error, result) => {
            if (error) {
              this.logger.error(`Upload buffer to Cloudinary failed: ${error.message}`, error);
              return reject(new Error(`Upload buffer to Cloudinary failed: ${error.message}`));
            }
            
            if (!result) {
              this.logger.error('Upload buffer to Cloudinary failed: No result returned');
              return reject(new Error('Upload buffer to Cloudinary failed: No result returned'));
            }
            
            this.logger.log(`Uploaded buffer ${resourceType} to Cloudinary: ${result.public_id}`);
            resolve({
              url: result.url,
              secureUrl: result.secure_url,
              publicId: result.public_id,
              width: result.width,
              height: result.height,
              format: result.format,
              resourceType: result.resource_type,
              tags: result.tags,
            });
          }
        );
        
        // Pipe buffer vào stream
        const streamifier = require('streamifier');
        streamifier.createReadStream(buffer).pipe(uploadStream);
      });
    } catch (error) {
      this.logger.error(`Upload buffer to Cloudinary failed: ${error.message}`, error.stack);
      throw new Error(`Upload buffer to Cloudinary failed: ${error.message}`);
    }
  }

  /**
   * Xóa một hình ảnh khỏi Cloudinary
   * @param publicId ID công khai của hình ảnh
   * @param options Tùy chọn xóa
   * @returns Kết quả xóa
   */
  async deleteImage(publicId: string, options: { resourceType?: string } = {}): Promise<any> {
    try {
      const { resourceType = 'image' } = options;
      const result = await cloudinary.uploader.destroy(publicId, {
        resource_type: resourceType,
      });
      this.logger.log(`Deleted ${resourceType} from Cloudinary: ${publicId}`);
      return result;
    } catch (error) {
      this.logger.error(`Delete from Cloudinary failed: ${error.message}`, error.stack);
      throw new Error(`Delete from Cloudinary failed: ${error.message}`);
    }
  }

  /**
   * Tạo URL có chữ ký cho một hình ảnh
   * @param publicId ID công khai của hình ảnh
   * @param options Tùy chọn ký URL
   * @returns URL đã ký
   */
  generateSignedUrl(publicId: string, options: any = {}): string {
    try {
      const url = cloudinary.url(publicId, {
        secure: true,
        sign_url: true,
        ...options,
      });
      return url;
    } catch (error) {
      this.logger.error(`Generate signed URL failed: ${error.message}`, error.stack);
      throw new Error(`Generate signed URL failed: ${error.message}`);
    }
  }

  /**
   * Tối ưu hóa URL hình ảnh với các tham số chuyển đổi
   * @param url URL hình ảnh gốc
   * @param options Tùy chọn tối ưu
   * @returns URL đã tối ưu
   */
  optimizeImageUrl(url: string, options: { width?: number; height?: number; quality?: number; format?: string } = {}): string {
    try {
      if (!url || !url.includes('cloudinary.com')) {
        return url; // Trả về URL gốc nếu không phải URL Cloudinary
      }

      const { width, height, quality = 80, format = 'auto' } = options;
      let transformations = `q_${quality},f_${format}`;
      
      if (width) transformations += `,w_${width}`;
      if (height) transformations += `,h_${height}`;

      // Thay thế URL để thêm chuyển đổi
      // Ví dụ: https://res.cloudinary.com/demo/image/upload/sample.jpg -> 
      // https://res.cloudinary.com/demo/image/upload/q_80,f_auto,w_500/sample.jpg
      const uploadIndex = url.indexOf('/upload/');
      if (uploadIndex !== -1) {
        return url.slice(0, uploadIndex + 8) + transformations + url.slice(uploadIndex + 7);
      }

      return url;
    } catch (error) {
      this.logger.error(`Optimize image URL failed: ${error.message}`, error.stack);
      return url;
    }
  }

  // Kiểm tra xem một URL có phải là URL của Cloudinary không
  isCloudinaryUrl(url: string): boolean {
    if (!url) return false;
    
    // Pattern cho URL Cloudinary
    // Format: https://res.cloudinary.com/CLOUD_NAME/image/upload/...
    const cloudinaryPattern = new RegExp(`^https://res\\.cloudinary\\.com/${this.cloudName}/`);
    
    return cloudinaryPattern.test(url);
  }
  
  // Trích xuất publicId từ Cloudinary URL
  extractPublicIdFromUrl(url: string): string | null {
    if (!this.isCloudinaryUrl(url)) return null;
    
    try {
      // URL format: https://res.cloudinary.com/CLOUD_NAME/image/upload/v1234567890/FOLDER/FILE_NAME.EXT
      // Hoặc: https://res.cloudinary.com/CLOUD_NAME/image/upload/FOLDER/FILE_NAME.EXT
      
      // Tách URL thành các phần
      const urlParts = url.split('/');
      
      // Lấy phần sau "upload/"
      const uploadIndex = urlParts.indexOf('upload');
      if (uploadIndex === -1) return null;
      
      // Đôi khi có version (v1234567890)
      let startIndex = uploadIndex + 1;
      if (urlParts[startIndex].startsWith('v')) {
        startIndex++;
      }
      
      // Lấy và join tất cả các phần sau version
      const publicIdParts = urlParts.slice(startIndex);
      let publicId = publicIdParts.join('/');
      
      // Loại bỏ phần extension nếu có
      const extensionIndex = publicId.lastIndexOf('.');
      if (extensionIndex !== -1) {
        publicId = publicId.substring(0, extensionIndex);
      }
      
      return publicId;
    } catch (error) {
      this.logger.error(`Lỗi khi trích xuất publicId từ URL: ${error.message}`);
      return null;
    }
  }
} 