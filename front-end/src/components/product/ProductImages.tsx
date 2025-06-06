import React, { useState, useEffect, useCallback } from 'react'; // useMemo removed
import Image from 'next/image';
import { FiZoomIn, FiChevronLeft, FiChevronRight, FiImage } from 'react-icons/fi';
import { formatImageUrl } from '@/utils/imageUtils';
import { handleImageError } from '@/utils/imageErrorHandler';

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
  // Helper function, memoized with useCallback as it's used in useEffect dependencies and for useState initialization.
  const findInitialImage = useCallback((): ImageType | undefined => {
    if (!images || images.length === 0) {
      return undefined; // Return undefined if no images
    }
    if (initialImageUrl) {
      const initial = images.find(img => img.url === initialImageUrl);
      if (initial) return initial;
    }
    const primary = images.find(img => img.isPrimary);
    if (primary) return primary;
    // Fallback to the first image if images array is not empty
    return images[0];
  }, [images, initialImageUrl]);

  // Hooks are now at the top, before any conditional returns.
  // mainImage can be undefined if findInitialImage returns undefined (e.g., images is empty).
  const [mainImage, setMainImage] = useState<ImageType | undefined>(() => findInitialImage());
  const [currentIndex, setCurrentIndex] = useState(() => {
    const initialImg = findInitialImage(); // Uses the useCallback version
    if (!initialImg || !images || images.length === 0) return 0; // Default to 0 if no initial image or images are empty
    const index = images.findIndex(img => img.url === initialImg.url);
    return index >= 0 ? index : 0;
  });
  const [isZoomed, setIsZoomed] = useState(false);
  const [zoomPosition, setZoomPosition] = useState({ x: 0, y: 0 });

  // Define useCallback hooks before any conditional returns
  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!isZoomed) return;

    const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - left) / width) * 100;
    const y = ((e.clientY - top) / height) * 100;

    setZoomPosition({ x, y });
  }, [isZoomed]);

  const handleZoomToggle = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setIsZoomed(!isZoomed);
  }, [isZoomed]);

  // Update mainImage and currentIndex if images or initialImageUrl props change.
  useEffect(() => {
    const newInitialSelectedImage = findInitialImage(); // findInitialImage is from useCallback

    if (newInitialSelectedImage) {
      // If the derived image is different from the current main image, update.
      if (mainImage?.url !== newInitialSelectedImage.url) {
        setMainImage(newInitialSelectedImage);
      }
      // Always update index if image is found, to ensure consistency.
      const newIndex = images.findIndex(img => img.url === newInitialSelectedImage.url);
      if (newIndex !== -1 && currentIndex !== newIndex) {
        setCurrentIndex(newIndex);
      } else if (newIndex === -1 && images.length > 0) {
         // Fallback: if findInitialImage result is not in images (should be rare), or images[0] is the choice
         if (mainImage?.url !== images[0].url) setMainImage(images[0]); // set to first image
         if (currentIndex !== 0) setCurrentIndex(0); // set index to 0
      }
    } else {
      // This case means `images` is empty or became empty.
      if (mainImage !== undefined) {
        setMainImage(undefined);
      }
      if (currentIndex !== 0) {
        setCurrentIndex(0);
      }
    }
  }, [images, initialImageUrl, findInitialImage, currentIndex, mainImage]); // Added missing dependencies

  // Early return: If there are no images or mainImage couldn't be determined, show placeholder.
  // This check is now AFTER all hooks have been called.
  if (!images || images.length === 0 || !mainImage) {
    return (
      <div className="relative h-[450px] w-full rounded-lg overflow-hidden border border-gray-200 bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <FiImage className="w-16 h-16 mx-auto text-gray-400" />
          <p className="mt-4 text-gray-500">Chưa có hình ảnh sản phẩm</p>
        </div>
      </div>
    );
  }

  // Component logic continues, assuming `images` is not empty and `mainImage` is defined (ImageType).
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

  return (
    <div className="flex flex-col">
      {/* Ảnh chính */}
      <div className="relative">
        <div
          className={`relative h-[350px] md:h-[500px] w-full rounded-lg overflow-hidden group ${isZoomed ? 'cursor-zoom-out' : 'cursor-zoom-in'}`}
          onClick={() => setIsZoomed(!isZoomed)}
          onMouseMove={handleMouseMove}
          onMouseLeave={() => isZoomed && setIsZoomed(false)}
        >
          <Image
            src={formatImageUrl(mainImage.url)}
            alt={mainImage.alt || productName}
            fill
            className={`object-contain transition-transform duration-300 ${isZoomed ? 'scale-150' : 'group-hover:scale-105'}`}
            style={isZoomed ? { transformOrigin: `${zoomPosition.x}% ${zoomPosition.y}%` } : undefined}
            priority
            onError={(e) => handleImageError(e)}
          />

          {/* Nút zoom */}
          <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <button
              className="bg-white/90 backdrop-blur-sm p-2 rounded-full shadow-sm text-gray-700 hover:text-[#d53f8c] transition-colors"
              onClick={handleZoomToggle}
            >
              <FiZoomIn className="w-4 h-4" />
            </button>
          </div>

          {/* Nút điều hướng */}
          {images.length > 1 && (
            <>
              <button
                className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-white/90 backdrop-blur-sm p-2 rounded-full shadow-sm text-gray-700 hover:text-[#d53f8c] transition-colors opacity-0 group-hover:opacity-100"
                onClick={handlePrevImage}
              >
                <FiChevronLeft className="w-4 h-4" />
              </button>

              <button
                className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-white/90 backdrop-blur-sm p-2 rounded-full shadow-sm text-gray-700 hover:text-[#d53f8c] transition-colors opacity-0 group-hover:opacity-100"
                onClick={handleNextImage}
              >
                <FiChevronRight className="w-4 h-4" />
              </button>
            </>
          )}
        </div>

        {/* Chỉ số ảnh hiện tại */}
        {images.length > 1 && (
          <div className="absolute bottom-4 right-4 bg-black/50 backdrop-blur-sm text-white text-xs px-2 py-1 rounded-full">
            {currentIndex + 1} / {images.length}
          </div>
        )}
      </div>

      {/* Danh sách ảnh nhỏ - Hiển thị bên dưới */}
      {images.length > 1 && (
        <div className="flex flex-wrap gap-2 mt-4 justify-center">
          {images.map((image, index) => (
            <div
              key={index}
              className={`relative h-16 w-16 flex-shrink-0 cursor-pointer rounded-md overflow-hidden transition-all duration-200 ${mainImage.url === image.url
                ? 'ring-2 ring-[#d53f8c] shadow-sm scale-105'
                : 'ring-1 ring-gray-200 hover:ring-gray-300'
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
                loading="lazy"
                sizes="64px"
                onError={(e) => handleImageError(e)}
              />
              {/* Display Variant Name */}
              {image.variantName && (
                <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white text-[8px] px-1 py-0.5 truncate text-center">
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
