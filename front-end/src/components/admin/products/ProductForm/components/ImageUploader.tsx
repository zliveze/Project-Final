import React from 'react';
import { FiImage } from 'react-icons/fi';

interface ImageUploaderProps {
  dragOver: boolean;
  fileInputRef: React.RefObject<HTMLInputElement> | React.MutableRefObject<HTMLInputElement | null>;
  handleImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleDragOver: (e: React.DragEvent<HTMLDivElement>) => void;
  handleDragLeave: (e: React.DragEvent<HTMLDivElement>) => void;
  handleDrop: (e: React.DragEvent<HTMLDivElement>) => void;
}

/**
 * Component cho khu vực tải lên hình ảnh
 */
const ImageUploader: React.FC<ImageUploaderProps> = ({
  dragOver,
  fileInputRef,
  handleImageUpload,
  handleDragOver,
  handleDragLeave,
  handleDrop
}) => {
  return (
    <div 
      className={`border-2 border-dashed rounded-md p-6 text-center mb-4 ${
        dragOver ? 'border-pink-500 bg-pink-50' : 'border-gray-300'
      }`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div className="space-y-2">
        <div className="flex justify-center">
          <FiImage className="h-10 w-10 text-gray-400" />
        </div>
        <div className="text-sm text-gray-600">
          <label htmlFor="file-upload" className="relative cursor-pointer rounded-md font-medium text-pink-600 focus-within:outline-none">
            <span>Tải lên hình ảnh</span>
            <input 
              id="file-upload" 
              name="file-upload" 
              type="file" 
              multiple 
              className="sr-only" 
              onChange={handleImageUpload}
              ref={fileInputRef}
              accept="image/*"
            />
          </label>
          <p className="pl-1">hoặc kéo thả hình ảnh vào đây</p>
        </div>
        <p className="text-xs text-gray-500">
          Hỗ trợ PNG, JPG, GIF tối đa 5MB
        </p>
      </div>
    </div>
  );
};

export default ImageUploader; 