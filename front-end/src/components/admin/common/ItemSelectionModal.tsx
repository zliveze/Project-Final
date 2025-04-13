import { useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { FiX, FiSearch, FiImage, FiCheck, FiLoader, FiList, FiCheckSquare, FiSquare } from 'react-icons/fi';
import Pagination from './Pagination';
import { useProduct } from '@/contexts/ProductContext';
import { useBrands } from '@/contexts/BrandContext';
import { useCategory } from '@/contexts/CategoryContext';
import { toast } from 'react-toastify';

interface SelectableItem {
  _id: string;
  name: string;
  imageUrl?: string;
  sku?: string;
}

interface ItemSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  itemType: 'product' | 'brand' | 'category';
  currentlySelectedIds: string[];
  onConfirmSelection: (selectedIds: string[]) => void;
}

const ITEMS_PER_PAGE = 10;

export default function ItemSelectionModal({
  isOpen,
  onClose,
  itemType,
  currentlySelectedIds,
  onConfirmSelection,
}: ItemSelectionModalProps) {
  const [items, setItems] = useState<SelectableItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [selectedInModal, setSelectedInModal] = useState<string[]>([]);
  const [selectAll, setSelectAll] = useState(false);
  const portalRef = useRef<HTMLDivElement | null>(null);

  const productContext = useProduct();
  const brandContext = useBrands();
  const categoryContext = useCategory();

  // Tạo portal container khi component mount
  useEffect(() => {
    // Tạo một div mới cho portal nếu chưa có
    if (!portalRef.current) {
      const div = document.createElement('div');
      div.id = 'item-selection-modal-portal';
      document.body.appendChild(div);
      portalRef.current = div;
    }

    // Cleanup khi component unmount
    return () => {
      if (portalRef.current) {
        document.body.removeChild(portalRef.current);
        portalRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (isOpen) {
      // Prevent scrolling on body when modal is open
      document.body.style.overflow = 'hidden';
      
      setSelectedInModal([...currentlySelectedIds]);
      setSearchTerm('');
      setCurrentPage(1);
      fetchData(1, '');
    } else {
      // Allow scrolling when modal is closed
      document.body.style.overflow = 'unset';
      
      setItems([]);
      setError(null);
      setTotalItems(0);
      setTotalPages(1);
      setCurrentPage(1);
    }
    
    // Cleanup
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, itemType]);

  useEffect(() => {
    if (isOpen) {
      setSelectedInModal([...currentlySelectedIds]);
    }
  }, [currentlySelectedIds, isOpen]);

  useEffect(() => {
    const handler = setTimeout(() => {
      if (isOpen) {
        setCurrentPage(1);
        fetchData(1, searchTerm);
      }
    }, 500);
    return () => clearTimeout(handler);
  }, [searchTerm, isOpen]);

  const fetchData = useCallback(async (page: number, search: string) => {
    if (!isOpen) return;
    setIsLoading(true);
    setError(null);
    
    try {
      if (itemType === 'product') {
        await productContext.fetchAdminProductList({ page, limit: ITEMS_PER_PAGE, search });
      } else if (itemType === 'brand') {
        await brandContext.fetchBrands(page, ITEMS_PER_PAGE, { search });
      } else if (itemType === 'category') {
        await categoryContext.fetchCategories(page, ITEMS_PER_PAGE, search);
      }
    } catch (err: any) {
      console.error(`Error fetching ${itemType}:`, err);
      const message = `Không thể tải danh sách ${itemType}. ${err.message || ''}`;
      setError(message);
      toast.error(message);
      setItems([]);
      setTotalItems(0);
      setTotalPages(1);
      setCurrentPage(1);
    } finally {
      setIsLoading(false);
    }
  }, [isOpen, itemType, productContext, brandContext, categoryContext]);

  useEffect(() => {
    if (isOpen) {
      let mappedItems: SelectableItem[] = [];
      let total = 0;
      let pages = 1;
      let currentPg = 1;

      if (itemType === 'product') {
        mappedItems = productContext.products.map((p: any) => ({
          _id: p._id || p.id || 'unknown-id',
          name: p.name,
          sku: p.sku,
          imageUrl: (p.images && p.images.length > 0 ? p.images.find((img: any) => img.isPrimary)?.url || p.images[0].url : undefined)
        }));
        total = productContext.totalProducts;
        pages = productContext.totalPages;
        currentPg = productContext.currentPage;
      } else if (itemType === 'brand') {
        mappedItems = brandContext.brands.map((b: any) => ({
          _id: b.id || b._id || 'unknown-id',
          name: b.name,
          imageUrl: b.logo?.url || undefined
        }));
        total = brandContext.pagination.total;
        pages = brandContext.pagination.totalPages;
        currentPg = brandContext.pagination.page;
      } else if (itemType === 'category') {
        mappedItems = categoryContext.categories.map((c: any) => ({
          _id: c._id || 'unknown-id',
          name: c.name,
          imageUrl: c.image?.url || undefined
        }));
        total = categoryContext.totalCategories;
        pages = categoryContext.totalPages;
        currentPg = categoryContext.currentPage;
      }
      setItems(mappedItems);
      setTotalItems(total);
      setTotalPages(pages);
      if (currentPage !== currentPg) {
         setCurrentPage(currentPg);
      }
    }
  }, [
      isOpen, itemType, currentPage,
      productContext.products, productContext.totalProducts, productContext.totalPages, productContext.currentPage,
      brandContext.brands, brandContext.pagination,
      categoryContext.categories, categoryContext.totalCategories, categoryContext.totalPages, categoryContext.currentPage
  ]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    fetchData(page, searchTerm);
  };

  const handleSelectItem = (itemId: string) => {
    setSelectedInModal(prevSelected =>
      prevSelected.includes(itemId)
        ? prevSelected.filter(id => id !== itemId)
        : [...prevSelected, itemId]
    );
  };

  const handleSelectAll = () => {
    const newSelectAll = !selectAll;
    setSelectAll(newSelectAll);
    
    if (newSelectAll) {
      // Add all current page items to selection if not already selected
      const currentPageIds = items.map(item => item._id);
      setSelectedInModal(prev => {
        const existingIds = new Set(prev);
        const newSelection = [...prev];
        
        currentPageIds.forEach(id => {
          if (!existingIds.has(id)) {
            newSelection.push(id);
          }
        });
        
        return newSelection;
      });
    } else {
      // Remove all current page items from selection
      const currentPageIds = new Set(items.map(item => item._id));
      setSelectedInModal(prev => prev.filter(id => !currentPageIds.has(id)));
    }
  };

  const handleSelectAllOnPage = () => {
    const allCurrentPageIds = items.map(item => item._id);
    const allSelected = allCurrentPageIds.every(id => selectedInModal.includes(id));
    
    if (allSelected) {
      // If all are selected, deselect all on current page
      setSelectedInModal(prev => prev.filter(id => !allCurrentPageIds.includes(id)));
    } else {
      // If not all selected, select all on current page
      setSelectedInModal(prev => {
        const existingIds = new Set(prev);
        const newSelection = [...prev];
        
        allCurrentPageIds.forEach(id => {
          if (!existingIds.has(id)) {
            newSelection.push(id);
          }
        });
        
        return newSelection;
      });
    }
  };

  const handleConfirm = () => {
    onConfirmSelection(selectedInModal);
    onClose();
  };

  const getTitle = () => {
    switch (itemType) {
      case 'product': return 'Chọn Sản phẩm';
      case 'brand': return 'Chọn Thương hiệu';
      case 'category': return 'Chọn Danh mục';
      default: return 'Chọn Mục';
    }
  };

  const combinedLoading = isLoading || productContext.loading || brandContext.loading || categoryContext.loading;
  
  // Check if all items on current page are selected
  const allOnPageSelected = items.length > 0 && items.every(item => selectedInModal.includes(item._id));

  if (!isOpen || !portalRef.current) return null;

  // Render modal as a portal ngoài các modal khác
  const modalContent = (
    <div className="fixed inset-0 z-[1001] bg-gray-600 bg-opacity-75 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl flex flex-col max-h-[85vh]">
          {/* Header - fixed */}
          <div className="sticky top-0 z-10 bg-gray-100 border-b border-gray-200 px-6 py-4 flex items-center justify-between rounded-t-lg">
            <h3 className="text-lg font-medium text-gray-900 flex items-center">
              <FiList className="w-5 h-5 text-pink-600 mr-2" />
              {getTitle()}
              <span className="ml-2 px-2 py-0.5 bg-pink-100 text-pink-800 text-sm rounded-md">
                {selectedInModal.length} đã chọn
              </span>
            </h3>
            <button
              type="button"
              className="text-gray-500 hover:text-gray-700 focus:outline-none"
              onClick={onClose}
            >
              <FiX className="w-5 h-5" />
            </button>
          </div>
          
          {/* Search bar */}
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="relative">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={`Tìm kiếm ${itemType === 'product' ? 'sản phẩm' : itemType === 'brand' ? 'thương hiệu' : 'danh mục'}...`}
                className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500 sm:text-sm"
              />
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FiSearch className="h-5 w-5 text-gray-400" />
              </div>
              {combinedLoading && <FiLoader className="absolute inset-y-0 right-0 pr-3 flex items-center text-pink-500 animate-spin h-5 w-5" />}
            </div>
          </div>

          {/* Body - scrollable */}
          <div className="flex-1 overflow-y-auto">
            {/* Error Message */}
            {error && (
              <div className="p-4">
                <div className="text-center text-red-600 bg-red-50 p-2 rounded border border-red-200">
                  {error}
                </div>
              </div>
            )}

            {/* Loading State */}
            {combinedLoading && items.length === 0 ? (
              <div className="text-center py-10">
                <FiLoader className="animate-spin text-pink-600 h-8 w-8 mx-auto" />
              </div>
            ) : !combinedLoading && items.length === 0 && !error ? (
              <div className="text-center py-10 text-gray-500">
                Không tìm thấy {itemType === 'product' ? 'sản phẩm' : itemType === 'brand' ? 'thương hiệu' : 'danh mục'} nào phù hợp.
              </div>
            ) : (
              <div className="overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase w-12">
                        <button 
                          onClick={handleSelectAllOnPage}
                          className="flex items-center focus:outline-none"
                          title={allOnPageSelected ? "Bỏ chọn tất cả" : "Chọn tất cả"}
                        >
                          {allOnPageSelected ? (
                            <FiCheckSquare className="h-5 w-5 text-pink-600" />
                          ) : (
                            <FiSquare className="h-5 w-5 text-gray-400" />
                          )}
                        </button>
                      </th>
                      <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase w-16">Ảnh</th>
                      <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tên</th>
                      {itemType === 'product' && (
                        <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase w-32">SKU</th>
                      )}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {items.map((item) => {
                      const isSelected = selectedInModal.includes(item._id);
                      return (
                        <tr
                          key={item._id}
                          onClick={() => handleSelectItem(item._id)}
                          className={`cursor-pointer hover:bg-gray-50 transition-colors ${isSelected ? 'bg-pink-50' : ''}`}
                        >
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className="flex items-center justify-center">
                              {isSelected ? (
                                <FiCheckSquare className="h-5 w-5 text-pink-600" />
                              ) : (
                                <FiSquare className="h-5 w-5 text-gray-400" />
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className="h-10 w-10 bg-gray-100 rounded flex items-center justify-center overflow-hidden border">
                              {item.imageUrl ? (
                                <img src={item.imageUrl} alt={item.name} className="object-contain w-full h-full" />
                              ) : (
                                <FiImage className="h-5 w-5 text-gray-400" />
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">{item.name}</div>
                          </td>
                          {itemType === 'product' && item.sku && (
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{item.sku}</td>
                          )}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Pagination and actions */}
          <div className="sticky bottom-0 z-10 bg-gray-50 border-t border-gray-200 px-6 py-4 rounded-b-lg">
            <div className="flex items-center justify-between">
              {/* Pagination */}
              {totalItems > 0 && totalPages > 1 && (
                <div className="flex-1 flex justify-center">
                  <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={handlePageChange}
                    totalItems={totalItems}
                    itemsPerPage={ITEMS_PER_PAGE}
                    showItemsInfo={true}
                  />
                </div>
              )}

              {/* Action buttons */}
              <div className="flex gap-3 ml-auto">
                <div className="text-sm text-gray-500 flex items-center mr-2">
                  <span className="font-medium text-pink-600">{selectedInModal.length}</span> được chọn
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500"
                >
                  Hủy
                </button>
                <button
                  type="button"
                  onClick={handleConfirm}
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-pink-600 hover:bg-pink-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500"
                >
                  Xác nhận ({selectedInModal.length})
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, portalRef.current);
}
