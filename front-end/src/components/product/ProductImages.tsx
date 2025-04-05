import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { FiZoomIn, FiChevronLeft, FiChevronRight, FiImage } from 'react-icons/fi';

interface ImageType {
  url: string;
  alt: string;
  isPrimary?: boolean;
}

interface ProductImagesProps {
  images: ImageType[];
  productName: string;
}

const ProductImages: React.FC<ProductImagesProps> = ({ images = [], productName }) => {
  // Nếu không có ảnh, hiển thị ảnh mặc định
  if (!images || images.length === 0) {
    return (
      <div className="relative h-[450px] w-full rounded-lg overflow-hidden border border-gray-200 bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <FiImage className="w-16 h-16 mx-auto text-gray-400" />
          <p className="mt-4 text-gray-500">Chưa có hình ảnh sản phẩm</p>
        </div>
      </div>
    );
  }

  const [mainImage, setMainImage] = useState<ImageType>(
    images.find(img => img.isPrimary) || images[0]
  );
  const [currentIndex, setCurrentIndex] = useState(
    images.findIndex(img => img.isPrimary) !== -1 
      ? images.findIndex(img => img.isPrimary) 
      : 0
  );
  const [isZoomed, setIsZoomed] = useState(false);
  const [zoomPosition, setZoomPosition] = useState({ x: 0, y: 0 });

  // Cập nhật mainImage nếu images thay đổi
  useEffect(() => {
    if (images && images.length > 0) {
      const primaryImage = images.find(img => img.isPrimary) || images[0];
      const primaryIndex = images.findIndex(img => img === primaryImage);
      setMainImage(primaryImage);
      setCurrentIndex(primaryIndex >= 0 ? primaryIndex : 0);
    }
  }, [images]);

  const handlePrevImage = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (images.length <= 1) return;
    
    const newIndex = (currentIndex - 1 + images.length) % images.length;
    setCurrentIndex(newIndex);
    setMainImage(images[newIndex]);
  };

  const handleNextImage = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (images.length <= 1) return;
    
    const newIndex = (currentIndex + 1) % images.length;
    setCurrentIndex(newIndex);
    setMainImage(images[newIndex]);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isZoomed) return;
    
    const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - left) / width) * 100;
    const y = ((e.clientY - top) / height) * 100;
    
    setZoomPosition({ x, y });
  };

  const handleZoomToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsZoomed(!isZoomed);
  };

  return (
    <div className="grid grid-cols-1 gap-4">
      {/* Ảnh chính */}
      <div 
        className={`relative h-[450px] md:h-[550px] w-full rounded-lg overflow-hidden border border-gray-200 group ${
          isZoomed ? 'cursor-zoom-out' : 'cursor-zoom-in'
        }`}
        onClick={() => setIsZoomed(!isZoomed)}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => isZoomed && setIsZoomed(false)}
      >
        <Image
          src={mainImage.url}
          alt={mainImage.alt || productName}
          fill
          className={`object-contain transition-transform duration-300 ${
            isZoomed 
              ? 'scale-150' 
              : 'group-hover:scale-105'
          }`}
          style={
            isZoomed 
              ? { 
                  transformOrigin: `${zoomPosition.x}% ${zoomPosition.y}%`,
                }
              : undefined
          }
          priority
        />
        
        {/* Nút zoom */}
        <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <button 
            className="bg-white/80 backdrop-blur-sm p-2 rounded-full shadow-md text-gray-700 hover:text-[#d53f8c] transition-colors"
            onClick={handleZoomToggle}
          >
            <FiZoomIn className="w-5 h-5" />
          </button>
        </div>
        
        {/* Nút điều hướng */}
        {images.length > 1 && (
          <>
            <button 
              className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-white/80 backdrop-blur-sm p-2 rounded-full shadow-md text-gray-700 hover:text-[#d53f8c] transition-colors opacity-0 group-hover:opacity-100"
              onClick={handlePrevImage}
            >
              <FiChevronLeft className="w-5 h-5" />
            </button>
            
            <button 
              className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-white/80 backdrop-blur-sm p-2 rounded-full shadow-md text-gray-700 hover:text-[#d53f8c] transition-colors opacity-0 group-hover:opacity-100"
              onClick={handleNextImage}
            >
              <FiChevronRight className="w-5 h-5" />
            </button>
          </>
        )}
      </div>

      {/* Danh sách ảnh nhỏ */}
      {images.length > 1 && (
        <div className="flex space-x-3 overflow-x-auto py-2 scrollbar-hide">
          {images.map((image, index) => (
            <div
              key={index}
              className={`relative h-20 w-20 flex-shrink-0 cursor-pointer rounded-md border-2 overflow-hidden transition-all duration-200 hover:shadow-md ${
                mainImage.url === image.url 
                  ? 'border-[#d53f8c] shadow-md scale-105' 
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => {
                setMainImage(image);
                setCurrentIndex(index);
              }}
            >
              <Image
                src={image.url}
                alt={image.alt || `${productName} - Ảnh ${index + 1}`}
                fill
                className="object-cover"
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ProductImages; 