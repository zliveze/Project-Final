import { useState, useEffect, ChangeEvent } from 'react';
import { ProductFormData, ProductSeo } from '../types';

/**
 * Hook quản lý dữ liệu form sản phẩm
 */
export const useProductFormData = (initialData?: any) => {
  // Khởi tạo dữ liệu ban đầu với việc đảm bảo rằng các đối tượng cần thiết đều tồn tại
  const initializeData = (data: any): ProductFormData => {
    // Tạo một bản sao của dữ liệu hoặc đối tượng trống nếu data là null/undefined
    const result = { ...(data || {}) } as ProductFormData;
    
    // Đảm bảo các trường cơ bản tồn tại
    result.name = result.name || '';
    result.sku = result.sku || '';
    result.slug = result.slug || '';
    result.price = result.price || 0;
    result.currentPrice = result.currentPrice || 0;
    result.status = result.status || 'active';
    result.brandId = result.brandId || '';
    
    // Đảm bảo các mảng cơ bản tồn tại
    result.categoryIds = Array.isArray(result.categoryIds) ? result.categoryIds : [];
    result.tags = Array.isArray(result.tags) ? result.tags : [];
    result.variants = Array.isArray(result.variants) ? result.variants : [];
    result.images = Array.isArray(result.images) ? result.images : [];
    result.inventory = Array.isArray(result.inventory) ? result.inventory : [];
    
    // Đảm bảo description tồn tại và có các thuộc tính cần thiết
    result.description = result.description || { short: '', full: '' };
    result.description.short = result.description.short || '';
    result.description.full = result.description.full || '';
    
    // Đảm bảo seo tồn tại và có các thuộc tính cần thiết
    const defaultSeo: ProductSeo = {
      metaTitle: '',
      metaDescription: '',
      keywords: []
    };
    result.seo = result.seo || defaultSeo;
    
    if (result.seo) {
      result.seo.metaTitle = result.seo.metaTitle || '';
      result.seo.metaDescription = result.seo.metaDescription || '';
      result.seo.keywords = Array.isArray(result.seo.keywords) ? result.seo.keywords : [];
    }
    
    // Đảm bảo flags tồn tại và có các thuộc tính cần thiết
    result.flags = result.flags || { isBestSeller: false, isNew: true, isOnSale: false, hasGifts: false };
    result.flags.isBestSeller = result.flags.isBestSeller || false;
    result.flags.isNew = result.flags.isNew !== undefined ? result.flags.isNew : true;
    result.flags.isOnSale = result.flags.isOnSale || false;
    result.flags.hasGifts = result.flags.hasGifts || false;
    
    // Đảm bảo cosmetic_info tồn tại và có các thuộc tính cần thiết
    result.cosmetic_info = result.cosmetic_info || {
      skinType: [],
      concerns: [],
      ingredients: [],
      volume: { value: 0, unit: 'ml' },
      expiry: { shelf: 0, afterOpening: 0 },
      usage: '',
      madeIn: ''
    };
    
    result.cosmetic_info.skinType = Array.isArray(result.cosmetic_info.skinType) ? result.cosmetic_info.skinType : [];
    result.cosmetic_info.concerns = Array.isArray(result.cosmetic_info.concerns) ? result.cosmetic_info.concerns : [];
    result.cosmetic_info.ingredients = Array.isArray(result.cosmetic_info.ingredients) ? result.cosmetic_info.ingredients : [];
    
    // Đảm bảo volume tồn tại
    result.cosmetic_info.volume = result.cosmetic_info.volume || { value: 0, unit: 'ml' };
    result.cosmetic_info.volume.value = result.cosmetic_info.volume.value || 0;
    result.cosmetic_info.volume.unit = result.cosmetic_info.volume.unit || 'ml';
    
    // Đảm bảo expiry tồn tại
    result.cosmetic_info.expiry = result.cosmetic_info.expiry || { shelf: 0, afterOpening: 0 };
    
    // Chuyển đổi sang số nếu là chuỗi
    if (typeof result.cosmetic_info.expiry === 'object') {
      result.cosmetic_info.expiry.shelf = Number(result.cosmetic_info.expiry.shelf || 0);
      result.cosmetic_info.expiry.afterOpening = Number(result.cosmetic_info.expiry.afterOpening || 0);
    } else if (typeof result.cosmetic_info.expiry === 'string') {
      // Nếu expiry là chuỗi (có thể là từ API trả về), tạo đối tượng mới
      result.cosmetic_info.expiry = { shelf: 0, afterOpening: 0 };
    }
    
    // Đảm bảo các thuộc tính khác
    result.cosmetic_info.usage = result.cosmetic_info.usage || '';
    result.cosmetic_info.madeIn = result.cosmetic_info.madeIn || '';
    
    // Đảm bảo gifts tồn tại
    result.gifts = Array.isArray(result.gifts) ? result.gifts : [];
    
    // Đảm bảo các mảng liên quan tồn tại
    result.relatedProducts = Array.isArray(result.relatedProducts) ? result.relatedProducts : [];
    result.relatedEvents = Array.isArray(result.relatedEvents) ? result.relatedEvents : [];
    result.relatedCampaigns = Array.isArray(result.relatedCampaigns) ? result.relatedCampaigns : [];
    
    return result;
  };

  // State chính cho form data
  const [formData, setFormData] = useState<ProductFormData>(initializeData(initialData || {}));

  // Cập nhật form data khi initialData thay đổi
  useEffect(() => {
    if (initialData) {
      setFormData(initializeData(initialData));
    }
  }, [initialData]);

  // Tạo slug tự động từ tên sản phẩm
  const generateSlug = (name: string): string => {
    return name
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  // Xử lý thay đổi trường input cơ bản
  const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData(prev => {
        // Tạo một bản sao của object cha (nếu tồn tại)
        const parentObj = prev[parent as keyof ProductFormData];
        
        if (typeof parentObj === 'object' && parentObj !== null) {
          return {
            ...prev,
            [parent]: {
              ...parentObj,
              [child]: value
            }
          };
        }
        return prev;
      });
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
      
      // Auto-generate slug when name changes
      if (name === 'name') {
        setFormData(prev => ({
          ...prev,
          name: value,
          slug: generateSlug(value)
        }));
      }
    }
  };

  // Xử lý thay đổi checkbox
  const handleCheckboxChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData(prev => {
        // Tạo một bản sao của object cha (nếu tồn tại)
        const parentObj = prev[parent as keyof ProductFormData];
        
        if (typeof parentObj === 'object' && parentObj !== null) {
          return {
            ...prev,
            [parent]: {
              ...parentObj,
              [child]: checked
            }
          };
        }
        return prev;
      });
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: checked
      }));
    }
  };

  // Xử lý select multiple
  const handleMultiSelectChange = (e: ChangeEvent<HTMLSelectElement>) => {
    const { name, options } = e.target;
    const selectedValues = Array.from(options)
      .filter(option => option.selected)
      .map(option => option.value);
    
    setFormData(prev => ({
      ...prev,
      [name]: selectedValues
    }));
  };

  return {
    formData,
    setFormData,
    handleInputChange,
    handleCheckboxChange,
    handleMultiSelectChange,
    generateSlug
  };
};

export default useProductFormData; 