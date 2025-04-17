import { ProductFormData, GiftItem } from '../types';

/**
 * Hook quản lý quà tặng kèm sản phẩm
 */
export const useProductGifts = (
  formData: ProductFormData,
  setFormData: React.Dispatch<React.SetStateAction<ProductFormData>>
) => {
  /**
   * Cập nhật thông tin quà tặng (đảm bảo tính bất biến)
   */
  const handleGiftChange = (index: number, field: string, value: any) => {
    setFormData(prev => {
      // Đảm bảo gifts là một mảng
      const currentGifts = Array.isArray(prev.gifts) ? prev.gifts : [];
      
      // Tạo một bản sao mới của mảng gifts
      const updatedGifts = [...currentGifts];

      // Lấy đối tượng gift cần cập nhật
      const giftToUpdate = updatedGifts[index];

      // Nếu không tìm thấy gift (index không hợp lệ), không làm gì cả
      if (!giftToUpdate) {
        console.error(`[useProductGifts] Invalid index ${index} for gifts array.`);
        return prev; 
      }

      let newGiftData;

      // Xử lý trường lồng nhau (ví dụ: 'image.url', 'conditions.startDate')
      if (field.includes('.')) {
        const [parentKey, childKey] = field.split('.') as [keyof GiftItem, string];
        const currentParentValue = giftToUpdate[parentKey];

        // Đảm bảo parent là một object trước khi cập nhật con
        if (currentParentValue && typeof currentParentValue === 'object') {
          // Tạo một bản sao mới của object cha với giá trị con được cập nhật
          const newParentValue = {
            ...(currentParentValue as object), // Type assertion needed here
            [childKey]: value,
          };
          // Tạo một bản sao mới của gift với object cha đã được cập nhật
          newGiftData = {
            ...giftToUpdate,
            [parentKey]: newParentValue,
          };
        } else {
           // Nếu parent không tồn tại hoặc không phải object, tạo mới nó
           console.warn(`[useProductGifts] Initializing parent key "${String(parentKey)}" for gift index ${index}.`);
           newGiftData = {
             ...giftToUpdate,
             [parentKey]: { [childKey]: value },
           };
        }
      } 
      // Xử lý trường ở cấp độ gốc (ví dụ: 'name', 'productId')
      else {
        newGiftData = {
          ...giftToUpdate,
          [field as keyof GiftItem]: value,
        };
      }

      // Thay thế gift cũ bằng gift mới trong mảng đã sao chép
      updatedGifts[index] = newGiftData;

      // Trả về state formData mới với mảng gifts đã được cập nhật
      return {
        ...prev,
        gifts: updatedGifts,
      };
    });
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
   * Kiểm tra xem sản phẩm có quà tặng hay không (xử lý flags có thể undefined)
   */
  const hasGifts = (): boolean => {
    // Sử dụng optional chaining (?.) và nullish coalescing (??)
    // để kiểm tra an toàn và cung cấp giá trị mặc định false
    const hasGiftsFlag = formData.flags?.hasGifts ?? false; 
    
    return (
      hasGiftsFlag && 
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
