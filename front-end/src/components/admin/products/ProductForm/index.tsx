import React, { useState, useEffect, useRef, useCallback } from 'react';
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
import { useBrands } from '@/contexts/BrandContext';
import { useCategory } from '@/contexts/CategoryContext';

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

  // Sử dụng BrandContext để lấy danh sách thương hiệu thực
  const { brands: backendBrands, loading: brandsLoading, fetchBrands } = useBrands();
  
  // Sử dụng CategoryContext để lấy danh sách danh mục thực
  const { categories: backendCategories, loading: categoriesLoading, fetchCategories } = useCategory();
  
  // Chuyển đổi định dạng cho phù hợp với component
  const [brands, setBrands] = useState<BrandItem[]>([]);
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  
  // Sử dụng ref để theo dõi xem đã gọi API chưa
  const hasCalledAPI = useRef(false);
  
  // Memoize hàm fetch data để tránh gọi lại nhiều lần
  const fetchData = useCallback(() => {
    // Chỉ gọi API khi chưa gọi trước đó và cần thiết
    if (!hasCalledAPI.current) {
      fetchBrands(1, 100); // Lấy tối đa 100 thương hiệu
      fetchCategories(1, 100); // Lấy tối đa 100 danh mục
      hasCalledAPI.current = true;
    }
  }, [fetchBrands, fetchCategories]);
  
  // Fetch brands và categories khi component mount
  useEffect(() => {
    fetchData();
  }, [fetchData]);
  
  // Khi brands từ backend thay đổi, cập nhật state
  useEffect(() => {
    if (backendBrands && backendBrands.length > 0) {
      // Chuyển đổi từ định dạng backend sang định dạng component
      const formattedBrands = backendBrands.map(brand => ({
        id: brand.id,
        name: brand.name
      }));
      setBrands(formattedBrands);
    }
  }, [backendBrands]);
  
  // Khi categories từ backend thay đổi, cập nhật state
  useEffect(() => {
    if (backendCategories && backendCategories.length > 0) {
      // Chuyển đổi từ định dạng backend sang định dạng component
      const formattedCategories = backendCategories.map(category => ({
        id: category._id || '',
        name: category.name
      }));
      setCategories(formattedCategories);
    }
  }, [backendCategories]);

  // Kiểm tra một lần nữa khi formData thay đổi và chưa có dữ liệu
  useEffect(() => {
    // Nếu đã có dữ liệu sản phẩm và đã chọn brandId hoặc categoryIds
    if (initialData && 
        ((formData.brandId && brands.length === 0) || 
        (formData.categoryIds.length > 0 && categories.length === 0))) {
      // Gọi lại API nếu chưa có dữ liệu và chưa gọi API
      if (!hasCalledAPI.current) {
        fetchData();
      }
    }
  }, [initialData, formData, brands.length, categories.length, fetchData]);

  // Xóa bỏ dữ liệu mẫu cho branches và sử dụng availableBranches từ custom hook
  // const [branches, setBranches] = useState<BranchItem[]>([
  //   { id: '1', name: 'Chi nhánh Hà Nội' },
  //   { id: '2', name: 'Chi nhánh Hồ Chí Minh' },
  //   { id: '3', name: 'Chi nhánh Đà Nẵng' },
  //   { id: '4', name: 'Chi nhánh Cần Thơ' },
  //   { id: '5', name: 'Chi nhánh Hải Phòng' }
  // ]);

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
              branches={availableBranches}
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