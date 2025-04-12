import { useState, useEffect, useCallback } from 'react';
import { FiX, FiSearch, FiImage, FiCheck, FiLoader, FiList } from 'react-icons/fi';
import Pagination from './Pagination';
import { useProduct, Product } from '@/contexts/ProductContext';
import { useBrands, Brand } from '@/contexts/BrandContext';
import { useCategory, Category } from '@/contexts/CategoryContext';
import { toast } from 'react-toastify';
import { AdminProduct } from '@/hooks/useProductAdmin';

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
// Estimate header/footer height in pixels (adjust if necessary)
const MODAL_CHROME_HEIGHT_PX = 150;


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

  const productContext = useProduct();
  const brandContext = useBrands();
  const categoryContext = useCategory();

  useEffect(() => {
    if (isOpen) {
      setSelectedInModal([...currentlySelectedIds]);
      setSearchTerm('');
      setCurrentPage(1);
      fetchData(1, '');
    } else {
      setItems([]);
      setError(null);
      setTotalItems(0);
      setTotalPages(1);
      setCurrentPage(1);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm, isOpen]);

  const fetchData = useCallback(async (page: number, search: string) => {
    if (!isOpen) return;
    setIsLoading(true);
    setError(null);
    console.log(`Triggering fetch for ${itemType} - Page: ${page}, Search: "${search}"`);
    try {
      if (itemType === 'product') {
        await productContext.fetchAdminProductList({ page, limit: ITEMS_PER_PAGE, search });
      } else if (itemType === 'brand') {
        await brandContext.fetchBrands(page, ITEMS_PER_PAGE, { search });
      } else if (itemType === 'category') {
        await categoryContext.fetchCategories(page, ITEMS_PER_PAGE, search);
      }
    } catch (err: any) {
      console.error(`Error triggering fetch for ${itemType}:`, err);
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
        mappedItems = productContext.products.map((p: Product) => ({
          _id: p._id || p.id || 'unknown-id',
          name: p.name,
          sku: p.sku,
          imageUrl: (p.images && p.images.length > 0 ? p.images.find(img => img.isPrimary)?.url || p.images[0].url : undefined)
        }));
        total = productContext.totalProducts;
        pages = productContext.totalPages;
        currentPg = productContext.currentPage;
      } else if (itemType === 'brand') {
        mappedItems = brandContext.brands.map((b: Brand) => ({
          _id: b.id || b._id || 'unknown-id',
          name: b.name,
          imageUrl: b.logo?.url || undefined
        }));
        total = brandContext.pagination.total;
        pages = brandContext.pagination.totalPages;
        currentPg = brandContext.pagination.page;
      } else if (itemType === 'category') {
        mappedItems = categoryContext.categories.map((c: Category) => ({
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

  const handleConfirm = () => {
    onConfirmSelection(selectedInModal);
    onClose();
  };

  const getTitle = () => {
    switch (itemType) {
      case 'product': return 'Chọn Sản phẩm Áp dụng';
      case 'brand': return 'Chọn Thương hiệu Áp dụng';
      case 'category': return 'Chọn Danh mục Áp dụng';
      default: return 'Chọn Mục';
    }
  };

  const combinedLoading = isLoading || productContext.loading || brandContext.loading || categoryContext.loading;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60]">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity bg-gray-100 bg-opacity-75" onClick={onClose} aria-hidden="true"></div>
        {/* Modal panel - Use flex column layout, set max height for the panel */}
        <div className="inline-flex flex-col align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle w-full lg:max-w-6xl"
             style={{ maxHeight: '85vh' }}> {/* Set max height for the entire panel */}
          {/* Modal Header (Fixed) - flex-shrink-0 */}
          <div className="flex-shrink-0 flex items-center justify-between px-6 py-4 bg-gray-100 border-b border-gray-300">
            <div className="flex items-center">
              <FiList className="w-5 h-5 text-pink-600 mr-2" />
              <h3 className="text-lg font-semibold text-gray-900">
                {getTitle()} <span className="ml-1 px-2 py-0.5 bg-pink-100 text-pink-800 text-sm rounded-md">{selectedInModal.length} đã chọn</span>
              </h3>
            </div>
            <button type="button" className="text-gray-500 hover:text-gray-700 focus:outline-none" onClick={onClose}>
              <span className="sr-only">Đóng</span><FiX className="w-5 h-5" />
            </button>
          </div>
          {/* Modal Body (Scrollable) - flex-grow overflow-y-auto */}
          <div className="flex-grow px-6 py-4 space-y-4 overflow-y-auto">
            {/* Search Bar */}
            <div className="relative">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={`Tìm kiếm ${itemType}...`}
                className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-pink-500 focus:border-pink-500 sm:text-sm"
              />
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FiSearch className="h-5 w-5 text-gray-400" />
              </div>
               {combinedLoading && <FiLoader className="absolute inset-y-0 right-0 pr-3 flex items-center text-pink-500 animate-spin h-5 w-5" />}
            </div>

            {/* Error Message */}
            {error && <p className="text-center text-red-600 bg-red-50 p-2 rounded border border-red-200">{error}</p>}

            {/* Items List View */}
            {combinedLoading && items.length === 0 ? (
              <div className="text-center py-10"><FiLoader className="animate-spin text-pink-600 h-8 w-8 mx-auto" /></div>
            ) : !combinedLoading && items.length === 0 && !error ? (
              <div className="text-center py-10 text-gray-500">Không tìm thấy {itemType} nào phù hợp.</div>
            ) : (
              <div className="border rounded-md overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-16">Chọn</th>
                      <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-16">Ảnh</th>
                      <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tên {itemType}</th>
                      {itemType === 'product' && (
                        <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">SKU</th>
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
                            <div className={`h-5 w-5 rounded ${isSelected ? 'bg-pink-600 text-white flex items-center justify-center' : 'border border-gray-300'}`}>
                              {isSelected && <FiCheck className="h-3 w-3" />}
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

            {/* Pagination */}
            {totalItems > 0 && totalPages > 1 && (
              <div className="pt-4">
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
          </div>
          {/* Modal Footer (Fixed) - flex-shrink-0 */}
          <div className="flex-shrink-0 px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-between items-center">
            <div className="text-sm text-gray-500">
              Đã chọn <span className="font-medium text-pink-600">{selectedInModal.length}</span> {itemType}
            </div>
            <div className="flex space-x-3">
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
                Xác nhận
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
