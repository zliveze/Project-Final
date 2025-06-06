import { useState, useRef, DragEvent, ChangeEvent, useCallback, useEffect } from 'react';
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
  const [isUploading, setIsUploading] = useState(false);

  // Access the ProductContext for image uploads
  // const { uploadProductImage } = useProduct(); // Removed as it's not used in this hook

  /**
   * Xử lý upload hình ảnh từ file input
   */
  const handleImageUpload = useCallback(async (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setIsUploading(true);
      const newImages: ProductImage[] = [];
      
      // Tạo object từ file
      for (const file of Array.from(e.target.files)) {
        // Kiểm tra định dạng file
        if (!file.type.match(/^image\/(jpeg|png|gif|jpg)$/)) {
          console.error(`File không được hỗ trợ: ${file.name}. Chỉ hỗ trợ PNG, JPG, GIF.`);
          continue;
        }

        // Kiểm tra kích thước file (tối đa 5MB)
        if (file.size > 5 * 1024 * 1024) {
          console.error(`File quá lớn: ${file.name}. Kích thước tối đa 5MB.`);
          continue;
        }
        
        // Chỉ tạo URL tạm thời để preview mà không lưu base64
        const tempURL = URL.createObjectURL(file);
        
        // Tạo một ID tạm thời cho hình ảnh
        const tempId = `temp-${Date.now()}-${Math.random().toString(16).slice(2)}`;
        
        const newImage: ProductImage = {
          url: '', // Không lưu URL nào cho đến khi upload thành công
          alt: file.name.split('.')[0],
          isPrimary: (!formData.images || !Array.isArray(formData.images) || formData.images.length === 0) && newImages.length === 0,
          file: file, // Lưu file để upload sau
          preview: tempURL, // Dùng URL tạm thời để hiển thị preview
          id: tempId
        };

        newImages.push(newImage);
      }

      // Update the form data with the new images
      setFormData(prev => ({
        ...prev,
        images: [...(prev.images || []), ...newImages]
      }));

      // Upload logic is now handled in the page component (index.tsx)
      // after form submission (handleSaveNewProduct / handleUpdateProduct).
      // This hook only manages the local state (adding files and previews).
      console.log('Added new images with previews to local state. Upload will occur on form save.');
      setIsUploading(false);
    }
  }, [setFormData, formData.images]);

  /**
   * Clean up khi component unmount
   */
  useEffect(() => {
    return () => {
      // Dọn dẹp các URL object đã tạo
      if (formData.images) {
        formData.images.forEach(image => {
          if (image.preview && !image.preview.startsWith('http')) {
            URL.revokeObjectURL(image.preview);
          }
        });
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty dependency array ensures cleanup only runs on unmount

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
  const handleDrop = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      if (fileInputRef.current) {
        fileInputRef.current.files = e.dataTransfer.files;
        handleImageUpload({ target: { files: e.dataTransfer.files } } as unknown as ChangeEvent<HTMLInputElement>);
      }
    }
  }, [handleImageUpload]);

  /**
   * Xóa một hình ảnh
   */
  const handleRemoveImage = (imageId: string) => {
    // Xử lý xóa ảnh
    const updatedImages = [...(formData.images || [])];
    const removeIndex = updatedImages.findIndex(img => img.id === imageId);

    if (removeIndex !== -1) {
      // Nếu có preview URL cần thu hồi
      const image = updatedImages[removeIndex];
      if (image.preview && !image.preview.startsWith('http')) {
        URL.revokeObjectURL(image.preview);
      }

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
    isUploading,
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
