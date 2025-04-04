import { useState, useCallback } from 'react';
import { ProductFormData, ProductVariant, ProductImage } from '../types';

/**
 * Hook quản lý biến thể sản phẩm
 */
export const useProductVariants = (
  formData: ProductFormData,
  setFormData: React.Dispatch<React.SetStateAction<ProductFormData>>
) => {
  // State và hàm xử lý cho modal thêm biến thể
  const [showAddVariantModal, setShowAddVariantModal] = useState(false);
  const [editingVariant, setEditingVariant] = useState<ProductVariant | null>(null);
  const [isVariantProcessing, setIsVariantProcessing] = useState(false);

  // Mở modal thêm biến thể
  const handleOpenAddVariant = useCallback(() => {
    setEditingVariant(null);
    setShowAddVariantModal(true);
  }, []);

  // Mở modal chỉnh sửa biến thể
  const handleOpenEditVariant = useCallback((variant: ProductVariant) => {
    setEditingVariant({ ...variant });
    setShowAddVariantModal(true);
  }, []);

  // Đóng modal
  const handleCloseVariantModal = useCallback(() => {
    setShowAddVariantModal(false);
    setEditingVariant(null);
  }, []);

  // Thêm hoặc cập nhật biến thể
  const handleSaveVariant = useCallback((variant: ProductVariant) => {
    setIsVariantProcessing(true);
    
    // Đảm bảo chỉ lưu URL Cloudinary trong images, không lưu base64
    const sanitizedVariant = { ...variant };
    if (sanitizedVariant.images && sanitizedVariant.images.length > 0) {
      sanitizedVariant.images = sanitizedVariant.images.map(image => {
        // Nếu image có URL hợp lệ (http/https), giữ nguyên
        // Nếu không, đảm bảo url là rỗng để có thể upload sau
        return {
          ...image,
          url: image.url && image.url.startsWith('http') ? image.url : '',
        };
      });
    }
    
    try {
      if (editingVariant) {
        // Đang chỉnh sửa biến thể đã tồn tại
        const updatedVariants = [...(formData.variants || [])].map(v => 
          v.variantId === editingVariant.variantId ? sanitizedVariant : v
        );
        
        setFormData(prev => ({
          ...prev,
          variants: updatedVariants
        }));
      } else {
        // Thêm biến thể mới với ID tạm thời
        const newVariant = {
          ...sanitizedVariant,
          variantId: `temp-${Date.now()}`
        };
        
        setFormData(prev => ({
          ...prev,
          variants: [...(prev.variants || []), newVariant]
        }));
      }
      
      // Đóng modal sau khi lưu
      handleCloseVariantModal();
    } catch (error) {
      console.error('Error saving variant:', error);
    } finally {
      setIsVariantProcessing(false);
    }
  }, [formData.variants, editingVariant, handleCloseVariantModal, setFormData]);

  // Xóa biến thể
  const handleDeleteVariant = useCallback((variantId: string) => {
    // Nếu đang chỉnh sửa biến thể này, đóng modal
    if (editingVariant && editingVariant.variantId === variantId) {
      handleCloseVariantModal();
    }
    
    const updatedVariants = (formData.variants || []).filter(
      variant => variant.variantId !== variantId
    );
    
    setFormData(prev => ({
      ...prev,
      variants: updatedVariants
    }));
  }, [editingVariant, formData.variants, handleCloseVariantModal, setFormData]);

  // Thêm hình ảnh cho biến thể
  const handleAddVariantImage = useCallback((variantId: string, image: ProductImage) => {
    const updatedVariants = [...(formData.variants || [])].map(variant => {
      if (variant.variantId === variantId) {
        // Đảm bảo ảnh mới không chứa URL base64
        const newImage = { 
          ...image,
          url: image.url && image.url.startsWith('http') ? image.url : '' 
        };
        
        return {
          ...variant,
          images: [...(variant.images || []), newImage]
        };
      }
      return variant;
    });
    
    setFormData(prev => ({
      ...prev,
      variants: updatedVariants
    }));
  }, [formData.variants, setFormData]);

  // Xóa hình ảnh của biến thể
  const handleRemoveVariantImage = useCallback((variantId: string, imageId: string) => {
    const updatedVariants = [...(formData.variants || [])].map(variant => {
      if (variant.variantId === variantId) {
        // Thu hồi URL Object nếu cần thiết
        const imageToRemove = variant.images?.find(img => img.id === imageId);
        if (imageToRemove?.preview && !imageToRemove.preview.startsWith('http')) {
          URL.revokeObjectURL(imageToRemove.preview);
        }
        
        return {
          ...variant,
          images: (variant.images || []).filter(img => img.id !== imageId)
        };
      }
      return variant;
    });
    
    setFormData(prev => ({
      ...prev,
      variants: updatedVariants
    }));
  }, [formData.variants, setFormData]);

  return {
    showAddVariantModal,
    editingVariant,
    isVariantProcessing,
    handleOpenAddVariant,
    handleOpenEditVariant,
    handleCloseVariantModal,
    handleSaveVariant,
    handleDeleteVariant,
    handleAddVariantImage,
    handleRemoveVariantImage
  };
};

export default useProductVariants; 