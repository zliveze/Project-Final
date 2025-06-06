import { useState, useEffect, ChangeEvent, useMemo, useCallback } from 'react';
import { ProductFormData, ProductImage } from '../types'; // Remove ProductSeo, add ProductImage

/**
 * Hook quản lý dữ liệu form sản phẩm
 */
export const useProductFormData = (initialData?: Partial<ProductFormData>) => {
  // Khởi tạo dữ liệu ban đầu với việc đảm bảo rằng các đối tượng cần thiết đều tồn tại
  const initializeData = useCallback((data?: Partial<ProductFormData>): ProductFormData => {
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
    // Process variants and ensure their images are properly formatted
    if (Array.isArray(result.variants)) {
      result.variants = result.variants.map(variant => {
        // Process variant images to ensure they have proper structure
        let processedImages: (ProductImage | string)[] = []; // Explicitly type
        if (Array.isArray(variant.images)) {
          processedImages = variant.images.map((img): ProductImage | string => { // Add return type annotation
            // If image is already an object with url, keep it as is
            if (typeof img === 'object' && img !== null && img.url) {
              return img;
            }

            // If image is a string ID, try to find the corresponding image in product images
            if (typeof img === 'string') {
              const imgStr = img; // Assign to new variable with confirmed string type

              const matchingImage = Array.isArray(result.images) ?
                result.images.find(productImg =>
                  (typeof productImg.id === 'string' && productImg.id === imgStr) ||
                  (typeof productImg.publicId === 'string' && productImg.publicId === imgStr)
                  // Removed the 'includes' checks to simplify type inference
                ) : null;

              if (matchingImage) {
                return matchingImage;
              }

              // If it's a URL string, create an image object using imgStr
              // Use type assertion to resolve persistent 'never' type error
              if ((imgStr as string).startsWith('http') || (imgStr as string).startsWith('/')) {
                return { url: imgStr, id: `img-${Date.now()}-${Math.random().toString(16).slice(2)}` };
              }

              // Otherwise, keep the ID string
              return imgStr; // Return the confirmed string
            }

            return img;
          });
        }

        return {
          ...variant,
          // Ensure variant has a name
          name: variant.name || `Biến thể ${variant.options?.color || ''} ${variant.options?.sizes?.[0] || ''}`.trim(),
          // Use processed images, ensure it's ProductImage[]
          images: processedImages.filter((img): img is ProductImage => typeof img === 'object' && img !== null && 'url' in img)
        };
      });
    } else {
      result.variants = [];
    }

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
    result.variantInventory = Array.isArray(result.variantInventory) ? result.variantInventory : [];

    // Đảm bảo seo tồn tại và có các thuộc tính cần thiết (using inline type)
    result.seo = result.seo || {
      metaTitle: '',
      metaDescription: '',
      keywords: []
    };
    // No need for defaultSeo variable or ProductSeo import

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

    // Đảm bảo các mảng liên quan tồn tại (only relatedProducts exists in type)
    result.relatedProducts = Array.isArray(result.relatedProducts) ? result.relatedProducts : [];
    // Remove relatedEvents and relatedCampaigns as they are not in ProductFormData type
    // result.relatedEvents = Array.isArray(result.relatedEvents) ? result.relatedEvents : [];
    // result.relatedCampaigns = Array.isArray(result.relatedCampaigns) ? result.relatedCampaigns : [];

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

  // Helper function to update nested state immutably
  const updateNestedState = <T extends object>(obj: T, path: string, value: unknown): T => {
    const keys = path.split('.');

    // Create a shallow copy of the top-level object
    const newObj = { ...obj };

    // Use a pointer to traverse and update the new object structure
    let currentLevel: Record<string, unknown> = newObj as Record<string, unknown>;

    for (let i = 0; i < keys.length - 1; i++) {
      const key = keys[i];
      // If the key doesn't exist or is not an object, create a new object
      // Also, ensure we are creating a new object for the path to maintain immutability
      currentLevel[key] = { ...(currentLevel[key] as Record<string, unknown> || {}) };
      currentLevel = currentLevel[key] as Record<string, unknown>;
    }

    const finalKey = keys[keys.length - 1];
    currentLevel[finalKey] = value;
    
    return newObj;
  };


  // Xử lý thay đổi input
  const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    let processedValue: string | number | null = value; // Use null for empty numbers

    // List of numeric field paths that should allow being empty (null)
    const numericFields = [
      'price',
      'currentPrice',
      'cosmetic_info.volume.value',
      'cosmetic_info.expiry.shelf',
      'cosmetic_info.expiry.afterOpening'
      // Add other numeric fields if any
    ];

    if (numericFields.includes(name)) {
      if (value === '') {
        processedValue = null; // Store null for empty number fields
      } else {
        const num = parseFloat(value);
        // Keep 0 if num is 0, otherwise default to 0 for NaN
        processedValue = isNaN(num) ? 0 : num;
      }
    }

    setFormData(prev => updateNestedState(prev, name, processedValue));

    // Auto-update slug
    if (name === 'name') {
      // Ensure slug update happens after name update
      setFormData(prev => updateNestedState(prev, 'slug', generateSlug(value)));
    }
    // Note: Removed the auto-update logic for currentPrice for simplicity.
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
