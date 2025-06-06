import React, { useState, useMemo } from 'react';
import Image from 'next/image'; // Added import for next/image
import { FiHeart, FiEye, FiTrash2, FiShoppingCart, FiSearch, FiGrid, FiList, FiPackage, FiTag, FiFilter, FiInfo } from 'react-icons/fi';
import { toast } from 'react-hot-toast';

interface Variant {
  _id: string;
  name: string;
  price?: number;
  stock?: number;
  // Add other relevant variant properties here, e.g., color, size
}

interface Product {
  productId: {
    _id: string;
    name: string;
    images?: string[];
    price: number;
    status: 'in_stock' | 'out_of_stock' | 'discontinued';
    variants?: Variant[];
  };
  variantId?: string;
  addedAt?: string;
}

interface UserWishlistTableProps {
  wishlistItems: Product[];
  onDelete: (productId: string, variantId: string) => void;
  onView: (productId: string) => void;
  onAddToCart: (productId: string, variantId: string) => void;
  // userId: string; // Removed as it's not used
}

const UserWishlistTable: React.FC<UserWishlistTableProps> = ({
  wishlistItems,
  onDelete,
  onView,
  onAddToCart
  // userId // Removed as it's not used
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('grid');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  // Log debug thông tin wishlist
  console.log('Wishlist items received:', wishlistItems);

  const handleDelete = (productId: string, variantId: string = '') => {
    // Hiển thị loading toast
    const loadingToast = toast.loading('Đang xóa sản phẩm...');
    
    // Mô phỏng API call
    setTimeout(() => {
      onDelete(productId, variantId);
      toast.dismiss(loadingToast);
      toast.success('Đã xóa sản phẩm khỏi danh sách yêu thích!');
    }, 600);
  };

  const handleAddToCart = (productId: string, variantId: string = '') => {
    // Hiển thị loading toast
    const loadingToast = toast.loading('Đang thêm vào giỏ hàng...');
    
    // Mô phỏng API call
    setTimeout(() => {
      onAddToCart(productId, variantId);
      toast.dismiss(loadingToast);
      toast.success('Đã thêm sản phẩm vào giỏ hàng!');
    }, 600);
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'in_stock':
        return 'Còn hàng';
      case 'out_of_stock':
        return 'Hết hàng';
      case 'discontinued':
        return 'Ngừng kinh doanh';
      default:
        return status;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'in_stock':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'out_of_stock':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'discontinued':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  // Lọc danh sách sản phẩm yêu thích
  const filteredItems = useMemo(() => {
    return wishlistItems.filter(item => {
      // Kiểm tra xem item.productId có tồn tại và là object không
      if (!item.productId || typeof item.productId !== 'object') {
        console.log('Invalid product item:', item);
        return false;
      }
      
      // Lọc theo từ khóa tìm kiếm
      const searchMatch = searchTerm === '' || 
        item.productId.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.productId._id.toLowerCase().includes(searchTerm.toLowerCase());
      
      // Lọc theo trạng thái
      const statusMatch = filterStatus === 'all' || item.productId.status === filterStatus;
      
      return searchMatch && statusMatch;
    });
  }, [wishlistItems, searchTerm, filterStatus]);

  // Hiển thị danh sách dưới dạng lưới
  const renderGridView = () => {
    if (filteredItems.length === 0) {
      return (
        <div className="p-8 text-center text-gray-500 bg-gray-50 rounded-lg border border-dashed border-gray-300">
          <FiHeart className="mx-auto h-12 w-12 text-gray-400" />
          <p className="mt-2 text-lg font-medium">Không tìm thấy sản phẩm yêu thích</p>
          <p className="mt-1">{searchTerm || filterStatus !== 'all' ? 'Không có kết quả phù hợp với tìm kiếm của bạn.' : 'Người dùng này chưa thêm sản phẩm nào vào danh sách yêu thích.'}</p>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredItems.map((item) => {
          const product = item.productId;
          const imageUrl = product.images && product.images.length > 0 ? product.images[0] : '';
          const formattedDate = item.addedAt ? new Date(item.addedAt).toLocaleDateString('vi-VN') : 'Không xác định';
          
          return (
            <div 
              key={`${product._id}-${item.variantId || 'default'}`} 
              className="border rounded-lg overflow-hidden transition-all hover:shadow-md"
            >
              <div className="relative w-full" style={{ paddingTop: '75%' }}> {/* Changed paddingBottom to paddingTop for aspect ratio with next/image */}
                {imageUrl ? (
                  <Image
                    src={imageUrl}
                    alt={product.name}
                    layout="fill"
                    objectFit="cover"
                  />
                ) : (
                  <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center bg-gray-100">
                    <FiPackage className="w-10 h-10 text-gray-400" />
                  </div>
                )}
                <div className="absolute top-2 right-2">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(product.status)}`}>
                    {getStatusText(product.status)}
                  </span>
                </div>
              </div>
              <div className="p-4">
                <h3 className="font-medium text-gray-900 text-sm sm:text-base truncate" title={product.name}>
                  {product.name}
                </h3>
                <div className="flex justify-between items-center mt-2">
                  <div className="text-pink-600 font-semibold">{formatPrice(product.price)}</div>
                  <div className="text-xs text-gray-500">{formattedDate}</div>
                </div>
                <div className="mt-3 pt-3 border-t border-gray-100 grid grid-cols-3 gap-1">
                  <button 
                    onClick={() => onView(product._id)}
                    className="flex flex-col items-center justify-center p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors text-xs"
                    title="Xem sản phẩm"
                  >
                    <FiEye className="w-4 h-4 mb-1" />
                    <span>Xem</span>
                  </button>
                  <button 
                    onClick={() => handleAddToCart(product._id, item.variantId || '')}
                    className={`flex flex-col items-center justify-center p-1.5 rounded transition-colors text-xs ${
                      product.status === 'in_stock' 
                        ? 'text-green-600 hover:bg-green-50'
                        : 'text-gray-400 cursor-not-allowed'
                    }`}
                    disabled={product.status !== 'in_stock'}
                    title={product.status === 'in_stock' ? 'Thêm vào giỏ hàng' : 'Sản phẩm hiện không khả dụng'}
                  >
                    <FiShoppingCart className="w-4 h-4 mb-1" />
                    <span>Thêm</span>
                  </button>
                  <button 
                    onClick={() => handleDelete(product._id, item.variantId || '')}
                    className="flex flex-col items-center justify-center p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors text-xs"
                    title="Xóa khỏi danh sách yêu thích"
                  >
                    <FiTrash2 className="w-4 h-4 mb-1" />
                    <span>Xóa</span>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  // Hiển thị danh sách dưới dạng bảng
  const renderTableView = () => {
    return (
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Sản phẩm
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Giá
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Trạng thái
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">
                Ngày thêm
              </th>
              <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Thao tác
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredItems.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-10 text-center text-gray-500">
                  <FiHeart className="mx-auto h-12 w-12 text-gray-400" />
                  <p className="mt-2 text-lg font-medium">Không tìm thấy sản phẩm yêu thích</p>
                  <p className="mt-1">{searchTerm || filterStatus !== 'all' ? 'Không có kết quả phù hợp với tìm kiếm của bạn.' : 'Người dùng này chưa thêm sản phẩm nào vào danh sách yêu thích.'}</p>
                </td>
              </tr>
            ) : (
              filteredItems.map((item) => {
                const product = item.productId;
                const imageUrl = product.images && product.images.length > 0 ? product.images[0] : '';
                const formattedDate = item.addedAt ? new Date(item.addedAt).toLocaleDateString('vi-VN') : 'Không xác định';
                const productIdShort = product._id.substring(0, 8);
                const variantIdShort = item.variantId ? item.variantId.substring(0, 8) : '-';
                
                return (
                  <tr key={`${product._id}-${item.variantId || 'default'}`} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-16 w-16 rounded-md overflow-hidden relative"> {/* Added relative positioning */}
                          {imageUrl ? (
                            <Image
                              src={imageUrl}
                              alt={product.name}
                              layout="fill"
                              objectFit="cover"
                            />
                          ) : (
                            <div className="h-full w-full flex items-center justify-center bg-gray-100">
                              <FiPackage className="w-6 h-6 text-gray-400" />
                            </div>
                          )}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900 line-clamp-2">{product.name}</div>
                          <div className="text-xs text-gray-500 mt-1">
                            <span className="inline-block mr-2">
                              <FiPackage className="inline-block mr-1" />
                              {productIdShort}
                            </span>
                            <span className="inline-block">
                              <FiTag className="inline-block mr-1" />
                              {variantIdShort}
                            </span>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-pink-600">{formatPrice(product.price)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 inline-flex items-center text-xs leading-5 font-semibold rounded-full ${getStatusColor(product.status)}`}>
                        {getStatusText(product.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 hidden md:table-cell">
                      {formattedDate}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <button 
                          onClick={() => onView(product._id)}
                          className="text-blue-600 hover:text-blue-900 p-1 rounded-full hover:bg-blue-50 transition-colors"
                          title="Xem sản phẩm"
                        >
                          <FiEye className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleAddToCart(product._id, item.variantId || '')}
                          className={`p-1 rounded-full transition-colors ${
                            product.status === 'in_stock' 
                              ? 'text-green-600 hover:text-green-900 hover:bg-green-50'
                              : 'text-gray-400 cursor-not-allowed'
                          }`}
                          title={product.status === 'in_stock' ? 'Thêm vào giỏ hàng' : 'Sản phẩm hiện không khả dụng'}
                          disabled={product.status !== 'in_stock'}
                        >
                          <FiShoppingCart className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleDelete(product._id, item.variantId || '')}
                          className="text-red-600 hover:text-red-900 p-1 rounded-full hover:bg-red-50 transition-colors"
                          title="Xóa khỏi danh sách yêu thích"
                        >
                          <FiTrash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div className="bg-white shadow-md rounded-lg overflow-hidden border border-gray-100 hover:shadow-lg transition-shadow">
      <div className="p-5 border-b border-gray-200 bg-gradient-to-r from-pink-50 to-white">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center">
            <div className="w-10 h-10 rounded-full bg-pink-100 flex items-center justify-center mr-3">
              <FiHeart className="text-pink-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-800">Danh sách sản phẩm yêu thích</h2>
              <p className="text-sm text-gray-500">Quản lý sản phẩm yêu thích của người dùng</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <button 
              onClick={() => setViewMode(viewMode === 'table' ? 'grid' : 'table')}
              className="px-3 py-1.5 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-pink-500 transition-colors flex items-center"
            >
              {viewMode === 'table' ? (
                <>
                  <FiGrid className="mr-1.5" />
                  Xem dạng lưới
                </>
              ) : (
                <>
                  <FiList className="mr-1.5" />
                  Xem dạng bảng
                </>
              )}
            </button>
          </div>
        </div>
      </div>
      
      <div className="p-5">
        <div className="mb-4 flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FiSearch className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Tìm kiếm sản phẩm..."
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-pink-500 focus:border-pink-500 sm:text-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="max-w-xs">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FiFilter className="h-5 w-5 text-gray-400" />
              </div>
              <select
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-pink-500 focus:border-pink-500 sm:text-sm appearance-none"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <option value="all">Tất cả trạng thái</option>
                <option value="in_stock">Còn hàng</option>
                <option value="out_of_stock">Hết hàng</option>
                <option value="discontinued">Ngừng kinh doanh</option>
              </select>
            </div>
          </div>
        </div>
        
        {wishlistItems.length > 0 && (
          <div className="mb-4 flex items-start gap-2 text-sm text-gray-600 bg-blue-50 p-3 rounded-md border border-blue-100">
            <FiInfo className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
            <p>
              Đã tìm thấy {filteredItems.length} sản phẩm {searchTerm || filterStatus !== 'all' ? 'phù hợp' : ''} trong danh sách yêu thích.
              {filterStatus !== 'all' && ` Đang lọc theo: ${getStatusText(filterStatus)}.`}
            </p>
          </div>
        )}
        
        <div className="overflow-hidden">
          {wishlistItems.length === 0 ? (
            <div className="p-8 text-center text-gray-500 bg-gray-50 rounded-lg border border-dashed border-gray-300">
              <FiHeart className="mx-auto h-12 w-12 text-gray-400" />
              <p className="mt-2 text-lg font-medium">Không có sản phẩm yêu thích</p>
              <p className="mt-1">Người dùng này chưa thêm sản phẩm nào vào danh sách yêu thích.</p>
            </div>
          ) : (
            viewMode === 'grid' ? renderGridView() : renderTableView()
          )}
        </div>
      </div>
    </div>
  );
};

export default UserWishlistTable;
