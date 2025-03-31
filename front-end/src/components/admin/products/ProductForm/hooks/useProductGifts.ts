import { ProductFormData, GiftItem } from '../types';

/**
 * Hook quản lý quà tặng kèm sản phẩm
 */
export const useProductGifts = (
  formData: ProductFormData,
  setFormData: React.Dispatch<React.SetStateAction<ProductFormData>>
) => {
  /**
   * Cập nhật thông tin quà tặng
   */
  const handleGiftChange = (index: number, field: string, value: any) => {
    if (!formData.gifts || !Array.isArray(formData.gifts)) {
      return;
    }
    
    const updatedGifts = [...formData.gifts];
    
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      const parentValue = updatedGifts[index][parent as keyof GiftItem];
      
      // Đảm bảo parentValue là object
      if (parentValue && typeof parentValue === 'object') {
        updatedGifts[index] = {
          ...updatedGifts[index],
          [parent]: {
            ...parentValue,
            [child]: value
          }
        };
      }
    } else {
      updatedGifts[index] = {
        ...updatedGifts[index],
        [field]: value
      };
    }
    
    setFormData(prev => ({
      ...prev,
      gifts: updatedGifts
    }));
  };
  
  /**
   * Xóa một quà tặng
   */
  const handleRemoveGift = (index: number) => {
    if (!formData.gifts || !Array.isArray(formData.gifts)) {
      return;
    }
    
    const updatedGifts = [...formData.gifts];
    updatedGifts.splice(index, 1);
    
    // Nếu không còn quà tặng nào, cập nhật cả flag
    if (updatedGifts.length === 0) {
      setFormData(prev => ({
        ...prev,
        gifts: updatedGifts,
        flags: {
          ...prev.flags,
          hasGifts: false
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        gifts: updatedGifts
      }));
    }
  };
  
  /**
   * Thêm quà tặng mới
   */
  const handleAddGift = () => {
    const newGift = {
      giftId: `gift-${Date.now()}`,
      name: '',
      description: '',
      productId: '',
      image: {
        url: '',
        alt: ''
      },
      quantity: 1,
      value: 0,
      type: 'sample' as const,
      conditions: {
        minPurchaseAmount: 0,
        minQuantity: 1,
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        limitedQuantity: 0
      },
      status: 'active' as const
    };
    
    setFormData(prev => ({
      ...prev,
      gifts: prev.gifts && Array.isArray(prev.gifts) ? [...prev.gifts, newGift] : [newGift],
      flags: {
        ...prev.flags,
        hasGifts: true
      }
    }));
  };

  /**
   * Cập nhật URL hình ảnh quà tặng
   */
  const handleGiftImageUrlChange = (index: number, url: string) => {
    handleGiftChange(index, 'image.url', url);
  };

  /**
   * Cập nhật alt text cho hình ảnh quà tặng
   */
  const handleGiftImageAltChange = (index: number, alt: string) => {
    handleGiftChange(index, 'image.alt', alt);
  };

  /**
   * Cập nhật điều kiện quà tặng
   */
  const handleGiftConditionChange = (index: number, conditionField: string, value: any) => {
    handleGiftChange(index, `conditions.${conditionField}`, value);
  };

  /**
   * Kiểm tra xem sản phẩm có quà tặng hay không
   */
  const hasGifts = (): boolean => {
    return (
      formData.flags.hasGifts && 
      formData.gifts && 
      Array.isArray(formData.gifts) && 
      formData.gifts.length > 0
    );
  };

  /**
   * Đếm số lượng quà tặng hợp lệ (có tên)
   */
  const getValidGiftsCount = (): number => {
    if (!formData.gifts || !Array.isArray(formData.gifts)) {
      return 0;
    }

    return formData.gifts.filter(gift => gift.name.trim() !== '').length;
  };

  return {
    handleGiftChange,
    handleRemoveGift,
    handleAddGift,
    handleGiftImageUrlChange,
    handleGiftImageAltChange,
    handleGiftConditionChange,
    hasGifts,
    getValidGiftsCount
  };
};

export default useProductGifts; 