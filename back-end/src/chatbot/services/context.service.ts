import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Product, ProductDocument } from '../../products/schemas/product.schema';
import { Category, CategoryDocument } from '../../categories/schemas/category.schema';
import { Brand, BrandDocument } from '../../brands/schemas/brand.schema';
import { Event } from '../../events/entities/event.entity';
import { Campaign, CampaignDocument } from '../../campaigns/schemas/campaign.schema';

export interface ProductContext {
  id: string;
  name: string;
  slug: string;
  price: number;
  currentPrice?: number;
  description: string;
  brand: string;
  categories: string[];
  skinTypes: string[];
  concerns: string[];
  ingredients: string[];
  tags: string[];
  status: string;
  images: Array<{
    url: string;
    alt: string;
    isPrimary: boolean;
  }>;
  flags: {
    isBestSeller: boolean;
    isNew: boolean;
    isOnSale: boolean;
    hasGifts: boolean;
  };
}

export interface CategoryContext {
  id: string;
  name: string;
  description: string;
  level: number;
  parentName?: string;
}

export interface BrandContext {
  id: string;
  name: string;
  description: string;
  origin: string;
  featured: boolean;
}

export interface EventContext {
  id: string;
  title: string;
  description: string;
  startDate: Date;
  endDate: Date;
  products: Array<{
    productId: string;
    productName: string;
    adjustedPrice: number;
    originalPrice: number;
    image: string;
  }>;
}

export interface CampaignContext {
  id: string;
  title: string;
  description: string;
  type: string;
  startDate: Date;
  endDate: Date;
  products: Array<{
    productId: string;
    productName: string;
    adjustedPrice: number;
    originalPrice: number;
    image: string;
  }>;
}

export interface ChatContext {
  products: ProductContext[];
  categories: CategoryContext[];
  brands: BrandContext[];
  events: EventContext[];
  campaigns: CampaignContext[];
  metadata: {
    totalProducts: number;
    totalCategories: number;
    totalBrands: number;
    totalEvents: number;
    totalCampaigns: number;
    lastUpdated: Date;
  };
}

@Injectable()
export class ContextService {
  private readonly logger = new Logger(ContextService.name);
  private contextCache: ChatContext | null = null;
  private lastCacheUpdate: Date | null = null;
  private readonly CACHE_DURATION = 30 * 60 * 1000; // 30 minutes

  constructor(
    @InjectModel(Product.name) private productModel: Model<ProductDocument>,
    @InjectModel(Category.name) private categoryModel: Model<CategoryDocument>,
    @InjectModel(Brand.name) private brandModel: Model<BrandDocument>,
    @InjectModel(Event.name) private eventModel: Model<Event>,
    @InjectModel(Campaign.name) private campaignModel: Model<CampaignDocument>,
  ) {}

  async getFullContext(): Promise<ChatContext> {
    // Check if cache is still valid
    if (this.contextCache && this.lastCacheUpdate && 
        (Date.now() - this.lastCacheUpdate.getTime()) < this.CACHE_DURATION) {
      return this.contextCache;
    }

    this.logger.log('Refreshing context cache...');

    try {
      const [products, categories, brands, events, campaigns] = await Promise.all([
        this.getProductsContext(),
        this.getCategoriesContext(),
        this.getBrandsContext(),
        this.getEventsContext(),
        this.getCampaignsContext(),
      ]);

      this.contextCache = {
        products,
        categories,
        brands,
        events,
        campaigns,
        metadata: {
          totalProducts: products.length,
          totalCategories: categories.length,
          totalBrands: brands.length,
          totalEvents: events.length,
          totalCampaigns: campaigns.length,
          lastUpdated: new Date(),
        },
      };

      this.lastCacheUpdate = new Date();
      this.logger.log('Context cache refreshed successfully');

      return this.contextCache;
    } catch (error) {
      this.logger.error('Error refreshing context cache:', error);
      throw error;
    }
  }

  async getProductsContext(): Promise<ProductContext[]> {
    try {
      const products = await this.productModel
        .find({ status: 'active' })
        .populate('brandId', 'name')
        .populate('categoryIds', 'name')
        .select('name slug price currentPrice description cosmetic_info tags flags images')
        .limit(100) // Limit to prevent too much data
        .lean()
        .exec();

      return products.map(product => ({
        id: product._id.toString(),
        name: product.name,
        slug: product.slug || '',
        price: product.price,
        currentPrice: product.currentPrice,
        description: product.description?.short || product.description?.full || '',
        brand: (product.brandId as any)?.name || '',
        categories: Array.isArray(product.categoryIds) ?
          product.categoryIds.map((cat: any) => cat.name).filter(Boolean) : [],
        skinTypes: product.cosmetic_info?.skinType || [],
        concerns: product.cosmetic_info?.concerns || [],
        ingredients: product.cosmetic_info?.ingredients || [],
        tags: product.tags || [],
        status: product.status,
        images: (product.images || []).map((img: any) => ({
          url: img.url,
          alt: img.alt || product.name,
          isPrimary: img.isPrimary || false,
        })),
        flags: {
          isBestSeller: product.flags?.isBestSeller || false,
          isNew: product.flags?.isNew || false,
          isOnSale: product.flags?.isOnSale || false,
          hasGifts: product.flags?.hasGifts || false,
        },
      }));
    } catch (error) {
      this.logger.error('Error getting products context:', error);
      return [];
    }
  }

  async getCategoriesContext(): Promise<CategoryContext[]> {
    try {
      const categories = await this.categoryModel
        .find({ status: 'active' })
        .populate('parentId', 'name')
        .select('name description level parentId')
        .lean()
        .exec();

      return categories.map(category => ({
        id: category._id.toString(),
        name: category.name,
        description: category.description || '',
        level: category.level,
        parentName: (category.parentId as any)?.name || undefined,
      }));
    } catch (error) {
      this.logger.error('Error getting categories context:', error);
      return [];
    }
  }

  async getBrandsContext(): Promise<BrandContext[]> {
    try {
      const brands = await this.brandModel
        .find({ status: 'active' })
        .select('name description origin featured')
        .lean()
        .exec();

      return brands.map(brand => ({
        id: brand._id.toString(),
        name: brand.name,
        description: brand.description || '',
        origin: brand.origin || '',
        featured: brand.featured || false,
      }));
    } catch (error) {
      this.logger.error('Error getting brands context:', error);
      return [];
    }
  }

  async getEventsContext(): Promise<EventContext[]> {
    try {
      const currentDate = new Date();
      const events = await this.eventModel
        .find({
          endDate: { $gte: currentDate },
        })
        .select('title description startDate endDate products')
        .lean()
        .exec();

      return events.map(event => ({
        id: event._id.toString(),
        title: event.title,
        description: event.description,
        startDate: event.startDate,
        endDate: event.endDate,
        products: (event.products || []).map(product => ({
          productId: product.productId.toString(),
          productName: product.name || (product as any).productName || '',
          adjustedPrice: product.adjustedPrice,
          originalPrice: product.originalPrice || 0,
          image: (product as any).image || `/images/products/${product.productId.toString()}.jpg`,
        })),
      }));
    } catch (error) {
      this.logger.error('Error getting events context:', error);
      return [];
    }
  }

  async getCampaignsContext(): Promise<CampaignContext[]> {
    try {
      const currentDate = new Date();
      const campaigns = await this.campaignModel
        .find({
          endDate: { $gte: currentDate },
        })
        .select('title description type startDate endDate products')
        .lean()
        .exec();

      return campaigns.map(campaign => ({
        id: campaign._id.toString(),
        title: campaign.title,
        description: campaign.description,
        type: campaign.type,
        startDate: campaign.startDate,
        endDate: campaign.endDate,
        products: (campaign.products || []).map(product => ({
          productId: product.productId.toString(),
          productName: product.name || (product as any).productName || '',
          adjustedPrice: product.adjustedPrice,
          originalPrice: product.originalPrice || 0,
          image: (product as any).image || `/images/products/${product.productId.toString()}.jpg`,
        })),
      }));
    } catch (error) {
      this.logger.error('Error getting campaigns context:', error);
      return [];
    }
  }

  async searchProducts(query: string, limit: number = 10): Promise<ProductContext[]> {
    try {
      // Nếu query rỗng, trả về sản phẩm phổ biến
      if (!query || query.trim() === '') {
        const products = await this.productModel
          .find({ status: 'active' })
          .populate('brandId', 'name')
          .populate('categoryIds', 'name')
          .select('name slug price currentPrice description cosmetic_info tags flags images')
          .sort({ soldCount: -1, createdAt: -1 }) // Sắp xếp theo độ phổ biến
          .limit(limit)
          .lean()
          .exec();

        return this.mapProductsToContext(products);
      }

      // Chuẩn hóa query
      const searchQuery = query.trim().toLowerCase();
      this.logger.log(`Searching products with query: "${searchQuery}"`);

      let products: any[] = [];

      // Bước 1: Thử MongoDB text search trước (nếu có text index)
      try {
        products = await this.productModel
          .find({
            status: 'active',
            $text: { $search: searchQuery }
          })
          .populate('brandId', 'name')
          .populate('categoryIds', 'name')
          .select('name slug price currentPrice description cosmetic_info tags flags images sku')
          .sort({
            score: { $meta: 'textScore' }, // Sắp xếp theo độ liên quan
            soldCount: -1
          })
          .limit(limit)
          .lean()
          .exec();

        if (products.length > 0) {
          this.logger.log(`Text search found ${products.length} products`);
          return this.mapProductsToContext(products);
        }
      } catch (textSearchError) {
        this.logger.warn('Text search not available, falling back to regex search');
      }

      // Bước 2: Tìm kiếm regex với nhiều điều kiện
      const searchRegex = new RegExp(searchQuery, 'i');

      products = await this.productModel
        .find({
          status: 'active',
          $or: [
            { name: { $regex: searchRegex } },
            { sku: { $regex: searchRegex } },
            { 'description.short': { $regex: searchRegex } },
            { 'description.full': { $regex: searchRegex } },
            { tags: { $in: [searchRegex] } },
            { 'cosmetic_info.concerns': { $in: [searchRegex] } },
            { 'cosmetic_info.skinType': { $in: [searchRegex] } },
            { 'cosmetic_info.ingredients': { $in: [searchRegex] } },
            { 'cosmetic_info.usage': { $regex: searchRegex } },
          ]
        })
        .populate('brandId', 'name')
        .populate('categoryIds', 'name')
        .select('name slug price currentPrice description cosmetic_info tags flags images sku')
        .sort({ soldCount: -1, 'flags.isBestSeller': -1, createdAt: -1 })
        .limit(limit)
        .lean()
        .exec();

      if (products.length > 0) {
        this.logger.log(`Regex search found ${products.length} products`);
        return this.mapProductsToContext(products);
      }

      // Bước 3: Tìm kiếm từng từ riêng lẻ với fuzzy matching
      if (searchQuery.includes(' ')) {
        const keywords = searchQuery.split(' ').filter(word => word.length > 1);
        const keywordRegexes = keywords.map(keyword => new RegExp(keyword, 'i'));

        products = await this.productModel
          .find({
            status: 'active',
            $or: [
              { name: { $in: keywordRegexes } },
              { 'description.short': { $in: keywordRegexes } },
              { 'description.full': { $in: keywordRegexes } },
              { tags: { $in: keywordRegexes } },
              { 'cosmetic_info.concerns': { $in: keywordRegexes } },
              { 'cosmetic_info.skinType': { $in: keywordRegexes } },
            ]
          })
          .populate('brandId', 'name')
          .populate('categoryIds', 'name')
          .select('name slug price currentPrice description cosmetic_info tags flags images sku')
          .sort({ soldCount: -1, createdAt: -1 })
          .limit(limit)
          .lean()
          .exec();

        if (products.length > 0) {
          this.logger.log(`Keyword search found ${products.length} products`);
          return this.mapProductsToContext(products);
        }
      }

      // Bước 4: Tìm kiếm partial match (chứa một phần từ khóa)
      const partialRegex = new RegExp(`.*${searchQuery}.*`, 'i');
      products = await this.productModel
        .find({
          status: 'active',
          $or: [
            { name: { $regex: partialRegex } },
            { tags: { $in: [partialRegex] } },
            { 'description.short': { $regex: partialRegex } },
          ]
        })
        .populate('brandId', 'name')
        .populate('categoryIds', 'name')
        .select('name slug price currentPrice description cosmetic_info tags flags images sku')
        .sort({ soldCount: -1, createdAt: -1 })
        .limit(limit)
        .lean()
        .exec();

      if (products.length > 0) {
        this.logger.log(`Partial match found ${products.length} products`);
      } else {
        this.logger.log(`No products found for query: "${searchQuery}"`);
      }

      return this.mapProductsToContext(products);
    } catch (error) {
      this.logger.error('Error searching products:', error);
      return [];
    }
  }

  async getProductsBySkinType(skinType: string): Promise<ProductContext[]> {
    try {
      const products = await this.productModel
        .find({
          status: 'active',
          'cosmetic_info.skinType': { $in: [new RegExp(skinType, 'i')] }
        })
        .populate('brandId', 'name')
        .populate('categoryIds', 'name')
        .select('name slug price currentPrice description cosmetic_info tags flags images')
        .limit(10)
        .lean()
        .exec();

      return products.map(product => ({
        id: product._id.toString(),
        name: product.name,
        slug: product.slug || '',
        price: product.price,
        currentPrice: product.currentPrice,
        description: product.description?.short || product.description?.full || '',
        brand: (product.brandId as any)?.name || '',
        categories: Array.isArray(product.categoryIds) ?
          product.categoryIds.map((cat: any) => cat.name).filter(Boolean) : [],
        skinTypes: product.cosmetic_info?.skinType || [],
        concerns: product.cosmetic_info?.concerns || [],
        ingredients: product.cosmetic_info?.ingredients || [],
        tags: product.tags || [],
        status: product.status,
        images: (product.images || []).map((img: any) => ({
          url: img.url,
          alt: img.alt || product.name,
          isPrimary: img.isPrimary || false,
        })),
        flags: {
          isBestSeller: product.flags?.isBestSeller || false,
          isNew: product.flags?.isNew || false,
          isOnSale: product.flags?.isOnSale || false,
          hasGifts: product.flags?.hasGifts || false,
        },
      }));
    } catch (error) {
      this.logger.error('Error getting products by skin type:', error);
      return [];
    }
  }

  async getProductsByConcern(concern: string): Promise<ProductContext[]> {
    try {
      const products = await this.productModel
        .find({
          status: 'active',
          'cosmetic_info.concerns': { $in: [new RegExp(concern, 'i')] }
        })
        .populate('brandId', 'name')
        .populate('categoryIds', 'name')
        .select('name slug price currentPrice description cosmetic_info tags flags images')
        .limit(10)
        .lean()
        .exec();

      return products.map(product => ({
        id: product._id.toString(),
        name: product.name,
        slug: product.slug || '',
        price: product.price,
        currentPrice: product.currentPrice,
        description: product.description?.short || product.description?.full || '',
        brand: (product.brandId as any)?.name || '',
        categories: Array.isArray(product.categoryIds) ?
          product.categoryIds.map((cat: any) => cat.name).filter(Boolean) : [],
        skinTypes: product.cosmetic_info?.skinType || [],
        concerns: product.cosmetic_info?.concerns || [],
        ingredients: product.cosmetic_info?.ingredients || [],
        tags: product.tags || [],
        status: product.status,
        images: (product.images || []).map((img: any) => ({
          url: img.url,
          alt: img.alt || product.name,
          isPrimary: img.isPrimary || false,
        })),
        flags: {
          isBestSeller: product.flags?.isBestSeller || false,
          isNew: product.flags?.isNew || false,
          isOnSale: product.flags?.isOnSale || false,
          hasGifts: product.flags?.hasGifts || false,
        },
      }));
    } catch (error) {
      this.logger.error('Error getting products by concern:', error);
      return [];
    }
  }

  // Helper method để map products thành ProductContext
  private mapProductsToContext(products: any[]): ProductContext[] {
    return products.map(product => ({
      id: product._id.toString(),
      name: product.name,
      slug: product.slug || '',
      price: product.price,
      currentPrice: product.currentPrice,
      description: product.description?.short || product.description?.full || '',
      brand: (product.brandId as any)?.name || '',
      categories: Array.isArray(product.categoryIds) ?
        product.categoryIds.map((cat: any) => cat.name).filter(Boolean) : [],
      skinTypes: product.cosmetic_info?.skinType || [],
      concerns: product.cosmetic_info?.concerns || [],
      ingredients: product.cosmetic_info?.ingredients || [],
      tags: product.tags || [],
      status: product.status,
      images: (product.images || []).map((img: any) => ({
        url: img.url,
        alt: img.alt || product.name,
        isPrimary: img.isPrimary || false,
      })),
      flags: {
        isBestSeller: product.flags?.isBestSeller || false,
        isNew: product.flags?.isNew || false,
        isOnSale: product.flags?.isOnSale || false,
        hasGifts: product.flags?.hasGifts || false,
      },
    }));
  }

  async clearCache(): Promise<void> {
    this.contextCache = null;
    this.lastCacheUpdate = null;
    this.logger.log('Context cache cleared');
  }
}