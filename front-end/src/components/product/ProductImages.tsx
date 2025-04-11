import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { FiZoomIn, FiChevronLeft, FiChevronRight, FiImage } from 'react-icons/fi';
import { formatImageUrl } from '@/utils/imageUtils';

// Export ImageType
export interface ImageType {
  url: string;
  alt: string;
  isPrimary?: boolean;
  variantName?: string; // Added to display variant info on thumbnails
}

interface ProductImagesProps {
  images: ImageType[];
  productName: string;
  initialImageUrl?: string; // Added prop for initial image selection
}

const ProductImages: React.FC<ProductImagesProps> = ({ images = [], productName, initialImageUrl }) => {
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

  // Find the initial image based on initialImageUrl or primary flag or first image
  const findInitialImage = (): ImageType => {
    if (initialImageUrl) {
      const initial = images.find(img => img.url === initialImageUrl);
      if (initial) return initial;
    }
    return images.find(img => img.isPrimary) || images[0];
  };

  const [mainImage, setMainImage] = useState<ImageType>(findInitialImage());
  const [currentIndex, setCurrentIndex] = useState(() => {
    const initialImg = findInitialImage();
    const index = images.findIndex(img => img.url === initialImg.url);
    return index >= 0 ? index : 0;
  });
  const [isZoomed, setIsZoomed] = useState(false);
  const [zoomPosition, setZoomPosition] = useState({ x: 0, y: 0 });

  // Update mainImage if initialImageUrl changes or images array changes
  useEffect(() => {
    if (images && images.length > 0) {
      const newInitialImage = findInitialImage();
      const newIndex = images.findIndex(img => img.url === newInitialImage.url);
      setMainImage(newInitialImage);
      setCurrentIndex(newIndex >= 0 ? newIndex : 0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [images, initialImageUrl]); // Re-run if images or initialImageUrl changes

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
          src={formatImageUrl(mainImage.url)}
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
                src={formatImageUrl(image.url)}
                alt={image.alt || `${productName} - Ảnh ${index + 1}`}
                fill
                className="object-cover"
              />
              {/* Display Variant Name */}
              {image.variantName && (
                <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white text-[10px] px-1 py-0.5 truncate text-center">
                  {image.variantName}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ProductImages;
