import React, { useState } from 'react';
import { FiHeart, FiEye, FiTrash2, FiShoppingCart, FiSearch, FiGrid, FiList, FiPackage, FiTag, FiFilter, FiInfo } from 'react-icons/fi';
import { toast } from 'react-hot-toast';

interface Product {
  productId: string;
  variantId: string;
  name: string;
  imageUrl: string;
  price: number;
  status: 'in_stock' | 'out_of_stock' | 'discontinued';
  addedAt: string;
}

interface UserWishlistTableProps {
  wishlistItems: Product[];
  onDelete: (productId: string, variantId: string) => void;
  onView: (productId: string) => void;
  onAddToCart: (productId: string, variantId: string) => void;
  userId: string;
}

const UserWishlistTable: React.FC<UserWishlistTableProps> = ({
  wishlistItems,
  onDelete,
  onView,
  onAddToCart,
  userId
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('grid');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const handleDelete = (productId: string, variantId: string) => {
    // Hiển thị loading toast
    const loadingToast = toast.loading('Đang xóa sản phẩm...');
    
    // Mô phỏng API call
    setTimeout(() => {
      onDelete(productId, variantId);
      toast.dismiss(loadingToast);
      toast.success('Đã xóa sản phẩm khỏi danh sách yêu thích!');
    }, 600);
  };

  const handleAddToCart = (productId: string, variantId: string) => {
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
  const filteredItems = wishlistItems.filter(item => {
    // Lọc theo từ khóa tìm kiếm
    const searchMatch = searchTerm === '' || 
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.productId.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Lọc theo trạng thái
    const statusMatch = filterStatus === 'all' || item.status === filterStatus;
    
    return searchMatch && statusMatch;
  });

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
        {filteredItems.map((item) => (
          <div 
            key={`${item.productId}-${item.variantId}`} 
            className="border rounded-lg overflow-hidden transition-all hover:shadow-md"
          >
            <div className="relative w-full" style={{ paddingBottom: '75%' }}>
              <img 
                src={item.imageUrl} 
                alt={item.name} 
                className="absolute top-0 left-0 w-full h-full object-cover"
              />
              <div className="absolute top-2 right-2">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(item.status)}`}>
                  {getStatusText(item.status)}
                </span>
              </div>
            </div>
            <div className="p-4">
              <h3 className="font-medium text-gray-900 text-sm sm:text-base truncate" title={item.name}>
                {item.name}
              </h3>
              <div className="flex justify-between items-center mt-2">
                <div className="text-pink-600 font-semibold">{formatPrice(item.price)}</div>
                <div className="text-xs text-gray-500">{item.addedAt}</div>
              </div>
              <div className="mt-3 pt-3 border-t border-gray-100 grid grid-cols-3 gap-1">
                <button 
                  onClick={() => onView(item.productId)}
                  className="flex flex-col items-center justify-center p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors text-xs"
                  title="Xem sản phẩm"
                >
                  <FiEye className="w-4 h-4 mb-1" />
                  <span>Xem</span>
                </button>
                <button 
                  onClick={() => handleAddToCart(item.productId, item.variantId)}
                  className={`flex flex-col items-center justify-center p-1.5 rounded transition-colors text-xs ${
                    item.status === 'in_stock' 
                      ? 'text-green-600 hover:bg-green-50'
                      : 'text-gray-400 cursor-not-allowed'
                  }`}
                  disabled={item.status !== 'in_stock'}
                  title={item.status === 'in_stock' ? 'Thêm vào giỏ hàng' : 'Sản phẩm hiện không khả dụng'}
                >
                  <FiShoppingCart className="w-4 h-4 mb-1" />
                  <span>Thêm</span>
                </button>
                <button 
                  onClick={() => handleDelete(item.productId, item.variantId)}
                  className="flex flex-col items-center justify-center p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors text-xs"
                  title="Xóa khỏi danh sách yêu thích"
                >
                  <FiTrash2 className="w-4 h-4 mb-1" />
                  <span>Xóa</span>
                </button>
              </div>
            </div>
          </div>
        ))}
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
              filteredItems.map((item) => (
                <tr key={`${item.productId}-${item.variantId}`} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-16 w-16 rounded-md overflow-hidden">
                        <img className="h-full w-full object-cover" src={item.imageUrl} alt={item.name} />
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900 line-clamp-2">{item.name}</div>
                        <div className="text-xs text-gray-500 mt-1">
                          <span className="inline-block mr-2">
                            <FiPackage className="inline-block mr-1" />
                            {item.productId.slice(0, 8)}
                          </span>
                          <span className="inline-block">
                            <FiTag className="inline-block mr-1" />
                            {item.variantId.slice(0, 8)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-pink-600">{formatPrice(item.price)}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 inline-flex items-center text-xs leading-5 font-semibold rounded-full ${getStatusColor(item.status)}`}>
                      {getStatusText(item.status)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 hidden md:table-cell">
                    {item.addedAt}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end space-x-2">
                      <button 
                        onClick={() => onView(item.productId)}
                        className="text-blue-600 hover:text-blue-900 p-1 rounded-full hover:bg-blue-50 transition-colors"
                        title="Xem sản phẩm"
                      >
                        <FiEye className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleAddToCart(item.productId, item.variantId)}
                        className={`p-1 rounded-full transition-colors ${
                          item.status === 'in_stock' 
                            ? 'text-green-600 hover:text-green-900 hover:bg-green-50'
                            : 'text-gray-400 cursor-not-allowed'
                        }`}
                        title={item.status === 'in_stock' ? 'Thêm vào giỏ hàng' : 'Sản phẩm hiện không khả dụng'}
                        disabled={item.status !== 'in_stock'}
                      >
                        <FiShoppingCart className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleDelete(item.productId, item.variantId)}
                        className="text-red-600 hover:text-red-900 p-1 rounded-full hover:bg-red-50 transition-colors"
                        title="Xóa khỏi danh sách yêu thích"
                      >
                        <FiTrash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
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