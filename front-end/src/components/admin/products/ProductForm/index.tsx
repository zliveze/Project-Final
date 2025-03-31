import React, { useState, useEffect, useRef } from 'react';
import { Tab } from '@headlessui/react';
import { FiSave, FiX } from 'react-icons/fi';

// Import các types
import { 
  ProductFormProps, 
  ProductFormData, 
  BrandItem, 
  CategoryItem, 
  BranchItem 
} from './types';

// Import các custom hooks
import useProductFormData from './hooks/useProductFormData';
import useProductTags from './hooks/useProductTags';
import useProductImages from './hooks/useProductImages';
import useProductVariants from './hooks/useProductVariants';
import useProductInventory from './hooks/useProductInventory';
import useProductGifts from './hooks/useProductGifts';

// Import các tab components
import BasicInfoTab from './tabs/BasicInfoTab';
import ImagesAndVariantsTab from './tabs/ImagesAndVariantsTab';
import CosmeticInfoTab from './tabs/CosmeticInfoTab';
import SeoDescriptionTab from './tabs/SeoDescriptionTab';
import InventoryTab from './tabs/InventoryTab';
import GiftsTab from './tabs/GiftsTab';

/**
 * Component ProductForm chính, kết hợp các tab components và custom hooks
 */
const ProductForm: React.FC<ProductFormProps> = ({
  initialData,
  onSubmit,
  onCancel,
  isViewMode = false
}) => {
  // Sử dụng custom hook để quản lý form data
  const {
    formData,
    setFormData,
    handleInputChange,
    handleCheckboxChange,
    handleMultiSelectChange
  } = useProductFormData(initialData);

  // Sử dụng custom hook để quản lý tags
  const {
    handleTagsChange,
    removeTag,
    handleSeoKeywordsChange,
    removeSeoKeyword,
    handleConcernsChange,
    removeConcern,
    handleIngredientsChange,
    removeIngredient
  } = useProductTags(formData, setFormData);

  // Sử dụng custom hook để quản lý hình ảnh
  const {
    fileInputRef,
    dragOver,
    handleImageUpload,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    handleRemoveImage,
    handleSetPrimaryImage,
    handleImageAltChange
  } = useProductImages(formData, setFormData);

  // Sử dụng custom hook để quản lý biến thể
  const {
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
  } = useProductVariants(formData, setFormData);

  // Sử dụng custom hook để quản lý tồn kho
  const {
    showBranchModal,
    availableBranches,
    handleInventoryChange,
    handleRemoveInventory,
    handleAddBranch,
    handleShowBranchModal,
    handleCloseBranchModal,
    getTotalInventory,
    getInStockBranchesCount,
    getLowStockBranchesCount
  } = useProductInventory(formData, setFormData);

  // Sử dụng custom hook để quản lý quà tặng
  const {
    handleGiftChange,
    handleRemoveGift,
    handleAddGift,
    handleGiftImageUrlChange,
    handleGiftImageAltChange,
    handleGiftConditionChange,
    hasGifts,
    getValidGiftsCount
  } = useProductGifts(formData, setFormData);

  // Sample data cho các dropdown
  const [brands, setBrands] = useState<BrandItem[]>([
    { id: '1', name: 'Yumin' },
    { id: '2', name: 'The Face Shop' },
    { id: '3', name: 'Innisfree' },
    { id: '4', name: 'Laneige' }
  ]);

  const [categories, setCategories] = useState<CategoryItem[]>([
    { id: '1', name: 'Chăm sóc da' },
    { id: '2', name: 'Trang điểm' },
    { id: '3', name: 'Chăm sóc tóc' },
    { id: '4', name: 'Nước hoa' },
    { id: '5', name: 'Phụ kiện' }
  ]);

  const [branches, setBranches] = useState<BranchItem[]>([
    { id: '1', name: 'Chi nhánh Hà Nội' },
    { id: '2', name: 'Chi nhánh Hồ Chí Minh' },
    { id: '3', name: 'Chi nhánh Đà Nẵng' },
    { id: '4', name: 'Chi nhánh Cần Thơ' },
    { id: '5', name: 'Chi nhánh Hải Phòng' }
  ]);

  // Xử lý submit form
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate các trường bắt buộc
    const requiredFields = ['name', 'sku', 'brandId'];
    const missingFields = requiredFields.filter(field => !formData[field as keyof ProductFormData]);
    
    if (missingFields.length > 0) {
      alert(`Vui lòng điền đầy đủ các trường bắt buộc: ${missingFields.join(', ')}`);
      return;
    }
    
    // Xác nhận trước khi submit
    if (!isViewMode && window.confirm('Bạn có chắc chắn muốn lưu thông tin sản phẩm này?')) {
      onSubmit(formData);
    } else if (isViewMode) {
      onSubmit(formData);
    }
  };

  // Tab titles
  const tabTitles = [
    'Thông tin cơ bản',
    'Hình ảnh & Biến thể',
    'Thông tin mỹ phẩm',
    'SEO & Mô tả',
    'Tồn kho',
    'Quà tặng'
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Tiêu đề và các nút */}
      <div className="bg-white shadow px-6 py-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold text-gray-900">
          {isViewMode ? 'Xem thông tin sản phẩm' : (initialData ? 'Sửa sản phẩm' : 'Thêm sản phẩm mới')}
        </h1>
        
        <div className="flex space-x-2">
          <button
            type="button"
            onClick={onCancel}
            className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500"
          >
            <FiX className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
            {isViewMode ? 'Đóng' : 'Hủy'}
          </button>
          
          {!isViewMode && (
            <button
              type="submit"
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-pink-600 hover:bg-pink-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500"
            >
              <FiSave className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
              Lưu sản phẩm
            </button>
          )}
        </div>
      </div>

      {/* Tab Navigation */}
      <Tab.Group>
        <Tab.List className="flex space-x-1 border-b border-gray-200">
          {tabTitles.map((title, idx) => (
            <Tab
              key={idx}
              className={({ selected }) =>
                `py-3 px-4 text-sm font-medium border-b-2 -mb-px focus:outline-none whitespace-nowrap
                ${selected 
                  ? 'border-pink-500 text-pink-600' 
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`
              }
            >
              {title}
            </Tab>
          ))}
        </Tab.List>
        
        <Tab.Panels className="mt-2">
          {/* Tab 1: Thông tin cơ bản */}
          <Tab.Panel className="rounded-xl bg-white p-6 shadow">
            <BasicInfoTab 
              formData={formData}
              handleInputChange={handleInputChange}
              handleCheckboxChange={handleCheckboxChange}
              handleTagsChange={handleTagsChange}
              handleMultiSelectChange={handleMultiSelectChange}
              removeTag={removeTag}
              isViewMode={isViewMode}
              brands={brands}
              categories={categories}
            />
          </Tab.Panel>

          {/* Tab 2: Hình ảnh & Biến thể */}
          <Tab.Panel className="rounded-xl bg-white p-6 shadow">
            <ImagesAndVariantsTab
              formData={formData}
              isViewMode={isViewMode}
              fileInputRef={fileInputRef}
              dragOver={dragOver}
              handleImageUpload={handleImageUpload}
              handleDragOver={handleDragOver}
              handleDragLeave={handleDragLeave}
              handleDrop={handleDrop}
              handleRemoveImage={handleRemoveImage}
              handleSetPrimaryImage={handleSetPrimaryImage}
              handleImageAltChange={handleImageAltChange}
              showVariantForm={showVariantForm}
              currentVariant={currentVariant}
              editingVariantIndex={editingVariantIndex}
              handleAddVariant={handleAddVariant}
              handleEditVariant={handleEditVariant}
              handleRemoveVariant={handleRemoveVariant}
              handleVariantChange={handleVariantChange}
              handleVariantImageSelect={handleVariantImageSelect}
              handleSaveVariant={handleSaveVariant}
              handleCancelVariant={handleCancelVariant}
            />
          </Tab.Panel>

          {/* Tab 3: Thông tin mỹ phẩm */}
          <Tab.Panel className="rounded-xl bg-white p-6 shadow">
            <CosmeticInfoTab
              formData={formData}
              handleInputChange={handleInputChange}
              handleConcernsChange={handleConcernsChange}
              handleIngredientsChange={handleIngredientsChange}
              removeConcern={removeConcern}
              removeIngredient={removeIngredient}
              isViewMode={isViewMode}
            />
          </Tab.Panel>

          {/* Tab 4: SEO & Mô tả */}
          <Tab.Panel className="rounded-xl bg-white p-6 shadow">
            <SeoDescriptionTab
              formData={formData}
              handleInputChange={handleInputChange}
              handleSeoKeywordsChange={handleSeoKeywordsChange}
              removeSeoKeyword={removeSeoKeyword}
              isViewMode={isViewMode}
            />
          </Tab.Panel>

          {/* Tab 5: Tồn kho */}
          <Tab.Panel className="rounded-xl bg-white p-6 shadow">
            <InventoryTab
              formData={formData}
              isViewMode={isViewMode}
              showBranchModal={showBranchModal}
              availableBranches={availableBranches}
              handleInventoryChange={handleInventoryChange}
              handleRemoveInventory={handleRemoveInventory}
              handleAddBranch={handleAddBranch}
              handleShowBranchModal={handleShowBranchModal}
              handleCloseBranchModal={handleCloseBranchModal}
              getTotalInventory={getTotalInventory}
              getInStockBranchesCount={getInStockBranchesCount}
              getLowStockBranchesCount={getLowStockBranchesCount}
              branches={branches}
            />
          </Tab.Panel>

          {/* Tab 6: Quà tặng */}
          <Tab.Panel className="rounded-xl bg-white p-6 shadow">
            <GiftsTab
              formData={formData}
              handleGiftChange={handleGiftChange}
              handleRemoveGift={handleRemoveGift}
              handleAddGift={handleAddGift}
              handleGiftImageUrlChange={handleGiftImageUrlChange}
              handleGiftImageAltChange={handleGiftImageAltChange}
              handleGiftConditionChange={handleGiftConditionChange}
              hasGifts={hasGifts}
              getValidGiftsCount={getValidGiftsCount}
              isViewMode={isViewMode}
              handleCheckboxChange={handleCheckboxChange}
            />
          </Tab.Panel>
        </Tab.Panels>
      </Tab.Group>
    </form>
  );
};

export default ProductForm; 