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
import { useBranches } from '@/contexts/BranchContext';

// Import các tab components
import BasicInfoTab from './tabs/BasicInfoTab';
import ImagesAndVariantsTab from './tabs/ImagesAndVariantsTab';
import CosmeticInfoTab from './tabs/CosmeticInfoTab';
import SeoDescriptionTab from './tabs/SeoDescriptionTab';
import InventoryTab from './tabs/InventoryTab';
import GiftsTab from './tabs/GiftsTab';

/**
 * Utility function to generate a URL-friendly slug from a string.
 */
const slugify = (text: string): string => {
  if (!text) return ''; // Return empty string if input is empty
  return text
    .toString()
    .toLowerCase()
    .normalize('NFD') // Normalize diacritics
    .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
    .replace(/\s+/g, '-') // Replace spaces with -
    .replace(/[^\w-]+/g, '') // Remove all non-word chars except -
    .replace(/--+/g, '-') // Replace multiple - with single -
    .replace(/^-+/, '') // Trim - from start of text
    .replace(/-+$/, ''); // Trim - from end of text
};

/**
 * Component ProductForm chính, kết hợp các tab components và custom hooks
 */
const ProductForm: React.FC<ProductFormProps> = ({
  initialData,
  onSubmit,
  onCancel,
  isViewMode = false
}) => {
  // State để theo dõi tab hiện tại
  const [currentTab, setCurrentTab] = useState(0);

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

  // Sử dụng custom hook để quản lý biến thể (refactored)
  const {
    showVariantForm,      // Renamed state
    editingVariant,       // Still useful to know if editing vs adding
    currentVariantData,   // The data for the form
    isVariantProcessing,  // Loading state for save
    handleOpenAddVariant,
    handleOpenEditVariant,
    handleCancelVariant,  // Renamed close handler
    handleSaveVariant,    // Updated save handler
    handleDeleteVariant,
    handleVariantChange,  // New handler for form input
    handleVariantImageSelect // New handler for image selection
  } = useProductVariants(formData, setFormData, formData.images || []); // Pass formData.images here

  // Sử dụng BrandContext để lấy danh sách thương hiệu thực
  const { brands: backendBrands, loading: brandsLoading, fetchBrands } = useBrands();

  // Sử dụng CategoryContext để lấy danh sách danh mục thực
  const { categories: backendCategories, loading: categoriesLoading, fetchCategories } = useCategory();

  // Sử dụng BranchContext để lấy danh sách chi nhánh thực
  const { branches: backendBranches, loading: branchesLoading, fetchBranches } = useBranches();

  // Chuyển đổi định dạng cho phù hợp với component
  const [brands, setBrands] = useState<BrandItem[]>([]);
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [branches, setBranches] = useState<BranchItem[]>([]);

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
    getLowStockBranchesCount,
    hasVariants,
    // Variant inventory methods
    selectedBranchForVariants,
    branchVariants,
    handleSelectBranchForVariants,
    handleClearBranchSelection,
    handleVariantInventoryChange,
    // Combination inventory methods
    selectedVariantForCombinations,
    variantCombinations,
    handleSelectVariantForCombinations,
    handleClearVariantSelection,
    handleCombinationInventoryChange
  } = useProductInventory(formData, setFormData, branches); // Truyền danh sách chi nhánh vào hook

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

  // Sử dụng ref để theo dõi xem đã gọi API chưa
  const hasCalledAPI = useRef(false);

  // Memoize hàm fetch data để tránh gọi lại nhiều lần
  const fetchData = useCallback(() => {
    // Chỉ gọi API khi chưa gọi trước đó và cần thiết
    if (!hasCalledAPI.current) {
      fetchBrands(1, 100); // Lấy tối đa 100 thương hiệu
      fetchCategories(1, 100); // Lấy tối đa 100 danh mục
      fetchBranches(1, 100); // Lấy tối đa 100 chi nhánh
      hasCalledAPI.current = true;
    }
  }, [fetchBrands, fetchCategories, fetchBranches]);

  // Fetch brands, categories và branches khi component mount
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

  // Khi branches từ backend thay đổi, cập nhật state
  useEffect(() => {
    if (backendBranches && backendBranches.length > 0) {
      // Chuyển đổi từ định dạng backend sang định dạng component
      const formattedBranches = backendBranches.map(branch => ({
        id: branch.id,
        name: branch.name
      }));
      setBranches(formattedBranches);
    }
  }, [backendBranches]);

  // Kiểm tra một lần nữa khi formData thay đổi và chưa có dữ liệu
  useEffect(() => {
    // Nếu đã có dữ liệu sản phẩm và đã chọn brandId hoặc categoryIds
    if (initialData &&
        ((formData.brandId && brands.length === 0) ||
        ((formData.categoryIds?.length ?? 0) > 0 && categories.length === 0))) { // Safely check categoryIds length
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

  // Xử lý khi chuyển tab
  const handleTabChange = (index: number) => {
    setCurrentTab(index);
  };

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

    // Prepare data for submission
    const dataToSubmit = { ...formData };

    // Auto-generate slug if it's empty and name is present
    if (!dataToSubmit.slug && dataToSubmit.name) {
      dataToSubmit.slug = slugify(dataToSubmit.name);
      console.log(`Generated slug: ${dataToSubmit.slug}`); // Log generated slug
    }

    // Submit dữ liệu form nếu hợp lệ
    onSubmit(dataToSubmit);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Tab.Group onChange={handleTabChange}>
          <Tab.List className="flex p-1 space-x-1 bg-gray-100 rounded-lg">
          <Tab
            className={({ selected }) =>
              `w-full py-2.5 text-sm font-medium rounded-md
              ${selected
                ? 'bg-white text-pink-600 shadow'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200'
              }`
            }
          >
            Thông tin cơ bản
          </Tab>
          <Tab
            className={({ selected }) =>
              `w-full py-2.5 text-sm font-medium rounded-md
              ${selected
                ? 'bg-white text-pink-600 shadow'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200'
              }`
            }
          >
            Hình ảnh & Biến thể
          </Tab>
          <Tab
            className={({ selected }) =>
              `w-full py-2.5 text-sm font-medium rounded-md
              ${selected
                ? 'bg-white text-pink-600 shadow'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200'
              }`
            }
          >
            Thông tin mỹ phẩm
          </Tab>
          <Tab
            className={({ selected }) =>
              `w-full py-2.5 text-sm font-medium rounded-md
              ${selected
                ? 'bg-white text-pink-600 shadow'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200'
              }`
            }
          >
            SEO & Mô tả
          </Tab>
          <Tab
            className={({ selected }) =>
              `w-full py-2.5 text-sm font-medium rounded-md
              ${selected
                ? 'bg-white text-pink-600 shadow'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200'
              }`
            }
          >
            Tồn kho
          </Tab>
          <Tab
            className={({ selected }) =>
              `w-full py-2.5 text-sm font-medium rounded-md
              ${selected
                ? 'bg-white text-pink-600 shadow'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200'
              }`
            }
          >
            Quà tặng
          </Tab>
        </Tab.List>
        <Tab.Panels className="mt-2">
          <Tab.Panel className="p-4 bg-white rounded-xl shadow">
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

          <Tab.Panel className="p-4 bg-white rounded-xl shadow">
            <ImagesAndVariantsTab
              formData={formData}
              fileInputRef={fileInputRef}
              dragOver={dragOver}
              handleImageUpload={handleImageUpload}
              handleDragOver={handleDragOver}
              handleDragLeave={handleDragLeave}
              handleDrop={handleDrop}
              handleRemoveImage={handleRemoveImage}
              handleSetPrimaryImage={handleSetPrimaryImage}
              handleImageAltChange={handleImageAltChange}
              // Pass all necessary props from the refactored hook to the tab
              handleOpenAddVariant={handleOpenAddVariant}
              handleOpenEditVariant={handleOpenEditVariant}
              handleDeleteVariant={handleDeleteVariant}
              showVariantForm={showVariantForm}
              editingVariant={editingVariant} // Pass the original variant being edited
              currentVariantData={currentVariantData} // Pass the form data
              handleVariantChange={handleVariantChange}
              handleVariantImageSelect={handleVariantImageSelect}
              handleSaveVariant={handleSaveVariant}
              handleCancelVariant={handleCancelVariant}
              isVariantProcessing={isVariantProcessing} // Pass loading state if needed by VariantForm
              isViewMode={isViewMode}
            />
          </Tab.Panel>

          <Tab.Panel className="p-4 bg-white rounded-xl shadow">
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

          <Tab.Panel className="p-4 bg-white rounded-xl shadow">
            <SeoDescriptionTab
              formData={formData}
              handleInputChange={handleInputChange}
              handleSeoKeywordsChange={handleSeoKeywordsChange}
              removeSeoKeyword={removeSeoKeyword}
              isViewMode={isViewMode}
            />
          </Tab.Panel>

          <Tab.Panel className="p-4 bg-white rounded-xl shadow">
            <InventoryTab
              formData={formData}
              handleInventoryChange={handleInventoryChange}
              handleRemoveInventory={handleRemoveInventory}
              handleAddBranch={handleAddBranch}
              handleShowBranchModal={handleShowBranchModal}
              handleCloseBranchModal={handleCloseBranchModal}
              showBranchModal={showBranchModal}
              availableBranches={availableBranches}
              getTotalInventory={getTotalInventory}
              getInStockBranchesCount={getInStockBranchesCount}
              getLowStockBranchesCount={getLowStockBranchesCount}
              hasVariants={hasVariants}
              isViewMode={isViewMode}
              branches={branches}
              // Variant inventory props
              selectedBranchForVariants={selectedBranchForVariants}
              branchVariants={branchVariants}
              handleSelectBranchForVariants={handleSelectBranchForVariants}
              handleClearBranchSelection={handleClearBranchSelection}
              handleVariantInventoryChange={handleVariantInventoryChange}
              // Combination inventory props
              selectedVariantForCombinations={selectedVariantForCombinations}
              variantCombinations={variantCombinations}
              handleSelectVariantForCombinations={handleSelectVariantForCombinations}
              handleClearVariantSelection={handleClearVariantSelection}
              handleCombinationInventoryChange={handleCombinationInventoryChange}
            />
          </Tab.Panel>

          <Tab.Panel className="p-4 bg-white rounded-xl shadow">
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

      {!isViewMode && (
        <div className="flex justify-end space-x-3 pt-4 border-t">
          <button
            type="button"
            onClick={onCancel}
            className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500"
          >
            <FiX className="mr-2 -ml-1 h-5 w-5" /> Hủy
          </button>
          <button
            type="submit"
            className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-pink-600 hover:bg-pink-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500"
          >
            <FiSave className="mr-2 -ml-1 h-5 w-5" /> Lưu
          </button>
        </div>
      )}
    </form>
  );
};

export default ProductForm;
