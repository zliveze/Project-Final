import { useState, useRef, DragEvent, ChangeEvent } from 'react';
import { ProductFormData, ProductImage } from '../types';

/**
 * Hook quản lý hình ảnh sản phẩm
 */
export const useProductImages = (
  formData: ProductFormData,
  setFormData: React.Dispatch<React.SetStateAction<ProductFormData>>
) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  /**
   * Xử lý upload hình ảnh từ file input
   */
  const handleImageUpload = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newImages: ProductImage[] = [];
      
      Array.from(e.target.files).forEach(file => {
        const reader = new FileReader();
        reader.onload = () => {
          const newImage: ProductImage = {
            url: '',
            alt: file.name.split('.')[0],
            isPrimary: (!formData.images || !Array.isArray(formData.images) || formData.images.length === 0) && newImages.length === 0,
            file: file,
            preview: reader.result as string,
            id: `temp-${Date.now()}-${Math.random().toString(16).slice(2)}`
          };
          
          newImages.push(newImage);
          
          // Cập nhật state nếu đã đọc tất cả files
          if (newImages.length === e.target.files!.length) {
            setFormData(prev => ({
              ...prev,
              images: [...(prev.images || []), ...newImages]
            }));
          }
        };
        reader.readAsDataURL(file);
      });
    }
  };

  /**
   * Xử lý khi kéo file vào khu vực upload
   */
  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(true);
  };

  /**
   * Xử lý khi kéo file ra khỏi khu vực upload
   */
  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
  };

  /**
   * Xử lý khi thả file vào khu vực upload
   */
  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      if (fileInputRef.current) {
        fileInputRef.current.files = e.dataTransfer.files;
        handleImageUpload({ target: { files: e.dataTransfer.files } } as any);
      }
    }
  };

  /**
   * Xóa một hình ảnh
   */
  const handleRemoveImage = (imageId: string) => {
    // Xử lý xóa ảnh
    let updatedImages = [...(formData.images || [])];
    const removeIndex = updatedImages.findIndex(img => img.id === imageId);
    
    if (removeIndex !== -1) {
      // Nếu xóa ảnh chính, chọn ảnh đầu tiên còn lại làm ảnh chính
      if (updatedImages[removeIndex].isPrimary && updatedImages.length > 1) {
        const nextIndex = removeIndex === updatedImages.length - 1 ? 0 : removeIndex + 1;
        updatedImages[nextIndex].isPrimary = true;
      }
      
      updatedImages.splice(removeIndex, 1);
      
      // Cập nhật formData
      setFormData(prev => ({
        ...prev,
        images: updatedImages
      }));
    }
  };

  /**
   * Đặt một hình ảnh làm ảnh chính
   */
  const handleSetPrimaryImage = (imageId: string) => {
    if (!formData.images || !Array.isArray(formData.images)) return;
    
    const updatedImages = formData.images.map((image: ProductImage) => ({
      ...image,
      isPrimary: image.id === imageId
    }));
    
    setFormData(prev => ({
      ...prev,
      images: updatedImages
    }));
  };

  /**
   * Cập nhật alt text cho hình ảnh
   */
  const handleImageAltChange = (imageId: string, alt: string) => {
    if (!formData.images || !Array.isArray(formData.images)) return;
    
    const updatedImages = formData.images.map((image: ProductImage) => 
      image.id === imageId ? { ...image, alt } : image
    );
    
    setFormData(prev => ({
      ...prev,
      images: updatedImages
    }));
  };

  return {
    fileInputRef,
    dragOver,
    handleImageUpload,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    handleRemoveImage,
    handleSetPrimaryImage,
    handleImageAltChange
  };
};

export default useProductImages; 