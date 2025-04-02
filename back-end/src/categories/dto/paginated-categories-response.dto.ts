import { CategoryResponseDto } from './category-response.dto';

export class PaginatedCategoriesResponseDto {
  items: CategoryResponseDto[];
  total: number;
  page: number;
  limit: number;
  pages: number;
  
  constructor(partial: Partial<PaginatedCategoriesResponseDto>) {
    Object.assign(this, partial);
  }
} 