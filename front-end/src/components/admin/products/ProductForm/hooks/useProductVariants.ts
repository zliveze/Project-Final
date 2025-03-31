import { useState, ChangeEvent } from 'react';
import { ProductFormData, ProductVariant } from '../types';

/**
 * Hook quản lý biến thể sản phẩm
 */
export const useProductVariants = (
  formData: ProductFormData,
  setFormData: React.Dispatch<React.SetStateAction<ProductFormData>>
) => {
  // State quản lý form biến thể
  const [showVariantForm, setShowVariantForm] = useState(false);
  
  // State lưu trữ biến thể đang chỉnh sửa
  const [currentVariant, setCurrentVariant] = useState<ProductVariant>({
    name: '',
    sku: '',
    options: {
      color: '',
      shade: '',
      size: ''
    },
    price: 0,
    images: []
  });
  
  // State index của biến thể đang được chỉnh sửa
  const [editingVariantIndex, setEditingVariantIndex] = useState<number | null>(null);

  /**
   * Khởi tạo và hiển thị form thêm biến thể mới
   */
  const handleAddVariant = () => {
    // Khởi tạo variant mới
    setCurrentVariant({
      variantId: '',
      name: `${formData.name} - Biến thể ${(formData.variants && Array.isArray(formData.variants) ? formData.variants.length : 0) + 1}`,
      sku: `${formData.sku}-${(formData.variants && Array.isArray(formData.variants) ? formData.variants.length : 0) + 1}`,
      options: {
        color: '',
        shade: '',
        size: ''
      },
      price: formData.price,
      images: []
    });
    setShowVariantForm(true);
  };

  /**
   * Hiển thị form chỉnh sửa biến thể
   */
  const handleEditVariant = (index: number) => {
    if (!formData.variants || !Array.isArray(formData.variants)) return;
    
    setCurrentVariant({ ...formData.variants[index] });
    setEditingVariantIndex(index);
    setShowVariantForm(true);
  };

  /**
   * Xóa một biến thể
   */
  const handleRemoveVariant = (index: number) => {
    if (!formData.variants || !Array.isArray(formData.variants)) return;
    
    const updatedVariants = [...formData.variants];
    updatedVariants.splice(index, 1);
    setFormData(prev => ({
      ...prev,
      variants: updatedVariants
    }));
  };

  /**
   * Xử lý thay đổi trong form biến thể
   */
  const handleVariantChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    if (name === 'options.color') {
      setCurrentVariant(prev => ({
        ...prev,
        options: {
          ...prev.options,
          color: value
        }
      }));
    } else if (name === 'options.shade') {
      setCurrentVariant(prev => ({
        ...prev,
        options: {
          ...prev.options,
          shade: value
        }
      }));
    } else if (name === 'options.size') {
      setCurrentVariant(prev => ({
        ...prev,
        options: {
          ...prev.options,
          size: value
        }
      }));
    } else {
      // For non-nested properties like sku, price
      setCurrentVariant(prev => ({
        ...prev,
        [name]: name === 'price' ? parseFloat(value) : value
      }));
    }
  };

  /**
   * Xử lý chọn hình ảnh cho biến thể
   */
  const handleVariantImageSelect = (imageId: string) => {
    if (!formData.images || !Array.isArray(formData.images)) return;
    
    const image = formData.images.find(img => img.id === imageId);
    if (image) {
      let updatedImages = [...currentVariant.images];
      
      if (updatedImages.includes(imageId)) {
        updatedImages = updatedImages.filter(id => id !== imageId);
      } else {
        updatedImages.push(imageId);
      }
      
      setCurrentVariant(prev => ({
        ...prev,
        images: updatedImages
      }));
    }
  };

  /**
   * Lưu biến thể (thêm mới hoặc cập nhật)
   */
  const handleSaveVariant = () => {
    if (!formData.variants || !Array.isArray(formData.variants)) {
      setFormData(prev => ({
        ...prev,
        variants: [currentVariant]
      }));
      setShowVariantForm(false);
      setCurrentVariant({
        name: '',
        sku: '',
        options: { color: '', shade: '', size: '' },
        price: 0,
        images: []
      });
      return;
    }
    
    let updatedVariants = [...formData.variants];
    
    if (editingVariantIndex !== null) {
      // Editing existing variant
      updatedVariants[editingVariantIndex] = currentVariant;
    } else {
      // Adding new variant
      updatedVariants.push({
        ...currentVariant,
        variantId: `var-${Date.now()}`
      });
    }
    
    setFormData(prev => ({
      ...prev,
      variants: updatedVariants
    }));
    
    // Reset and close form
    setShowVariantForm(false);
    setCurrentVariant({
      name: '',
      sku: '',
      options: {
        color: '',
        shade: '',
        size: ''
      },
      price: 0,
      images: []
    });
    setEditingVariantIndex(null);
  };

  /**
   * Hủy form biến thể
   */
  const handleCancelVariant = () => {
    setShowVariantForm(false);
    setEditingVariantIndex(null);
    setCurrentVariant({
      name: '',
      sku: '',
      options: {
        color: '',
        shade: '',
        size: ''
      },
      price: 0,
      images: []
    });
  };

  return {
    showVariantForm,
    currentVariant,
    editingVariantIndex,
    handleAddVariant,
    handleEditVariant,
    handleRemoveVariant,
    handleVariantChange,
    handleVariantImageSelect,
    handleSaveVariant,
    handleCancelVariant
  };
};

export default useProductVariants; 