export class CategoryImage {
  url: string;
  alt?: string;
  publicId?: string;
}

export class CategoryResponseDto {
  _id: string;
  name: string;
  description?: string;
  slug: string;
  parentId?: string;
  level: number;
  image?: CategoryImage;
  status: string;
  featured: boolean;
  order: number;
  createdAt: Date;
  updatedAt: Date;

  // Thêm thông tin về danh mục cha nếu có
  parent?: {
    _id: string;
    name: string;
    slug: string;
  };
  
  // Thêm thông tin về số lượng danh mục con
  childrenCount?: number;

  constructor(partial: Partial<CategoryResponseDto>) {
    Object.assign(this, partial);
  }
} 