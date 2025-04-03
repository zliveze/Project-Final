import { useState, useEffect, ChangeEvent, useMemo, useCallback } from 'react';
import { ProductFormData, ProductSeo } from '../types';

/**
 * Hook quản lý dữ liệu form sản phẩm
 */
export const useProductFormData = (initialData?: any) => {
  // Khởi tạo dữ liệu ban đầu với việc đảm bảo rằng các đối tượng cần thiết đều tồn tại
  const initializeData = useCallback((data: any): ProductFormData => {
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
    
    // Khởi tạo luôn tất cả các trường để tránh việc render nhiều lần
    result.description = result.description || { short: '', full: '' };
    result.flags = result.flags || { isBestSeller: false, isNew: true, isOnSale: false, hasGifts: false };
    result.variants = Array.isArray(result.variants) ? result.variants : [];
    
    // Xử lý đặc biệt cho images - đảm bảo các ảnh đã có đều có giá trị preview trùng với url
    if (Array.isArray(result.images)) {
      result.images = result.images.map(image => ({
        ...image,
        preview: image.preview || image.url, // Đảm bảo preview luôn có giá trị, sử dụng url nếu không có preview
        id: image.id || `existing-${Date.now()}-${Math.random().toString(16).slice(2)}` // Đảm bảo id tồn tại
      }));
    } else {
      result.images = [];
    }
    
    result.inventory = Array.isArray(result.inventory) ? result.inventory : [];
    
    // Đảm bảo seo tồn tại và có các thuộc tính cần thiết
    const defaultSeo: ProductSeo = {
      metaTitle: '',
      metaDescription: '',
      keywords: []
    };
    result.seo = result.seo || defaultSeo;
    
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
    
    // Đảm bảo gifts tồn tại
    result.gifts = Array.isArray(result.gifts) ? result.gifts : [];
    
    // Đảm bảo các mảng liên quan tồn tại
    result.relatedProducts = Array.isArray(result.relatedProducts) ? result.relatedProducts : [];
    result.relatedEvents = Array.isArray(result.relatedEvents) ? result.relatedEvents : [];
    result.relatedCampaigns = Array.isArray(result.relatedCampaigns) ? result.relatedCampaigns : [];
    
    return result;
  }, []);

  // Khởi tạo dữ liệu trước với memo để tránh tính toán lại
  const initialFormData = useMemo(() => 
    initializeData(initialData || {}), 
    [initialData, initializeData]
  );

  // State chính cho form data
  const [formData, setFormData] = useState<ProductFormData>(initialFormData);

  // Tự động tạo slug từ tên
  const generateSlug = (name: string): string => {
    return name
      .toLowerCase()
      .replace(/à|á|ạ|ả|ã|â|ầ|ấ|ậ|ẩ|ẫ|ă|ằ|ắ|ặ|ẳ|ẵ/g, 'a')
      .replace(/è|é|ẹ|ẻ|ẽ|ê|ề|ế|ệ|ể|ễ/g, 'e')
      .replace(/ì|í|ị|ỉ|ĩ/g, 'i')
      .replace(/ò|ó|ọ|ỏ|õ|ô|ồ|ố|ộ|ổ|ỗ|ơ|ờ|ớ|ợ|ở|ỡ/g, 'o')
      .replace(/ù|ú|ụ|ủ|ũ|ư|ừ|ứ|ự|ử|ữ/g, 'u')
      .replace(/ỳ|ý|ỵ|ỷ|ỹ/g, 'y')
      .replace(/đ/g, 'd')
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '')
      .replace(/-+/g, '-')
      .replace(/^-+/, '')
      .replace(/-+$/, '');
  };

  // Xử lý thay đổi input
  const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    // Xử lý cho nested objects (dùng dot notation trong name để xác định path)
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData(prev => {
        const parentValue = prev[parent as keyof ProductFormData];
        if (typeof parentValue === 'object' && parentValue !== null) {
          return {
            ...prev,
            [parent]: {
              ...parentValue,
              [child]: value
            }
          };
        }
        return prev;
      });
    } 
    // Xử lý cho trường price
    else if (name === 'price' || name === 'currentPrice') {
      const numValue = parseFloat(value) || 0;
      setFormData(prev => ({
        ...prev,
        [name]: numValue
      }));
      
      // Tự động cập nhật currentPrice khi price thay đổi nếu chúng bằng nhau trước đó
      if (name === 'price' && formData.price === formData.currentPrice) {
        setFormData(prev => ({
          ...prev,
          currentPrice: numValue
        }));
      }
    }
    // Xử lý cho trường name - tự động tạo slug
    else if (name === 'name') {
      setFormData(prev => ({
        ...prev,
        [name]: value,
        slug: generateSlug(value)
      }));
    }
    // Xử lý cho các trường còn lại
    else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  // Xử lý thay đổi checkbox
  const handleCheckboxChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    
    // Xử lý cho nested objects (dùng dot notation trong name để xác định path)
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData(prev => {
        const parentValue = prev[parent as keyof ProductFormData];
        if (typeof parentValue === 'object' && parentValue !== null) {
          return {
            ...prev,
            [parent]: {
              ...parentValue,
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

  // Xử lý thay đổi select nhiều giá trị
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

  // Cập nhật form data khi initialData thay đổi
  useEffect(() => {
    if (initialData) {
      setFormData(initializeData(initialData));
      // Không cần trì hoãn khởi tạo vì đã khởi tạo đầy đủ trong initializeData
    }
  }, [initialData, initializeData]);

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