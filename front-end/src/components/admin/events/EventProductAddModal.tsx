import React, { useState, useEffect } from 'react';
import { FiX, FiSearch, FiPlus } from 'react-icons/fi';

interface Product {
  _id: string;
  name: string;
  image: string;
  price: number;
  brandId: string;
  brandName?: string;
  categoryIds?: string[];
  status: string;
}

interface EventProductAddModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (products: {
    productId: string;
    variantId?: string;
    adjustedPrice: number;
    name?: string;
    image?: string;
    originalPrice?: number;
  }[]) => void;
  excludedProductIds?: string[]; // Các sản phẩm đã được thêm vào sự kiện
}

// Dữ liệu mẫu sản phẩm để thêm vào sự kiện
const sampleProducts: Product[] = [
  {
    _id: 'prod1',
    name: 'Sữa Rửa Mặt CeraVe Sạch Sâu Cho Da Thường Đến Da Dầu',
    image: 'https://media.hcdn.vn/catalog/product/p/r/promotions-auto-sua-rua-mat-cerave-sach-sau-cho-da-thuong-den-da-dau-473ml_zmJwd76vYd8vtRRY_img_220x220_0dff4c_fit_center.png',
    price: 475000,
    brandId: 'brand1',
    brandName: 'CeraVe',
    status: 'active'
  },
  {
    _id: 'prod2',
    name: 'Nước Hoa Hồng Klairs Không Mùi Cho Da Nhạy Cảm 180ml',
    image: 'https://media.hcdn.vn/catalog/product/p/r/promotions-auto-sua-rua-mat-cerave-sach-sau-cho-da-thuong-den-da-dau-473ml_zmJwd76vYd8vtRRY_img_220x220_0dff4c_fit_center.png',
    price: 435000,
    brandId: 'brand2',
    brandName: 'Klairs',
    status: 'active'
  },
  {
    _id: 'prod3',
    name: 'Serum L\'Oreal Sáng Da, Mờ Thâm Bright Maker',
    image: 'https://media.hcdn.vn/catalog/product/p/r/promotions-auto-sua-rua-mat-cerave-sach-sau-cho-da-thuong-den-da-dau-473ml_zmJwd76vYd8vtRRY_img_220x220_0dff4c_fit_center.png',
    price: 499000,
    brandId: 'brand3',
    brandName: 'L\'Oreal',
    status: 'active'
  },
  {
    _id: 'prod4',
    name: 'Sữa Rửa Mặt Cetaphil Gentle Skin Cleanser',
    image: 'https://media.hcdn.vn/catalog/product/p/r/promotions-auto-sua-rua-mat-cerave-sach-sau-cho-da-thuong-den-da-dau-473ml_zmJwd76vYd8vtRRY_img_220x220_0dff4c_fit_center.png',
    price: 445000,
    brandId: 'brand4',
    brandName: 'Cetaphil',
    status: 'active'
  },
  {
    _id: 'prod5',
    name: 'Kem Chống Nắng La Roche-Posay Anthelios SPF 50+',
    image: 'https://media.hcdn.vn/catalog/product/p/r/promotions-auto-sua-rua-mat-cerave-sach-sau-cho-da-thuong-den-da-dau-473ml_zmJwd76vYd8vtRRY_img_220x220_0dff4c_fit_center.png',
    price: 520000,
    brandId: 'brand5',
    brandName: 'La Roche-Posay',
    status: 'active'
  },
  {
    _id: 'prod6',
    name: 'Kem Dưỡng Ẩm Neutrogena Hydro Boost Water Gel',
    image: 'https://media.hcdn.vn/catalog/product/p/r/promotions-auto-sua-rua-mat-cerave-sach-sau-cho-da-thuong-den-da-dau-473ml_zmJwd76vYd8vtRRY_img_220x220_0dff4c_fit_center.png',
    price: 389000,
    brandId: 'brand6',
    brandName: 'Neutrogena',
    status: 'active'
  }
];

const EventProductAddModal: React.FC<EventProductAddModalProps> = ({
  isOpen,
  onClose,
  onAdd,
  excludedProductIds = []
}) => {
  const [modalVisible, setModalVisible] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProducts, setSelectedProducts] = useState<{
    productId: string;
    adjustedPrice: number;
    name?: string;
    image?: string;
    originalPrice?: number;
  }[]>([]);
  const [discountPercent, setDiscountPercent] = useState<number>(30); // Mặc định giảm 30%
  
  // Hiển thị/ẩn modal với animation
  useEffect(() => {
    if (isOpen) {
      setModalVisible(true);
    } else {
      setTimeout(() => {
        setModalVisible(false);
      }, 300);
    }
  }, [isOpen]);
  
  // Lọc sản phẩm theo từ khóa tìm kiếm và loại bỏ các sản phẩm đã được thêm vào sự kiện
  const filteredProducts = sampleProducts
    .filter(product => !excludedProductIds.includes(product._id))
    .filter(product => {
      if (searchTerm.trim() === '') return true;
      
      const searchLower = searchTerm.toLowerCase();
      return (
        product.name.toLowerCase().includes(searchLower) ||
        (product.brandName && product.brandName.toLowerCase().includes(searchLower))
      );
    });
  
  // Kiểm tra xem sản phẩm đã được chọn chưa
  const isProductSelected = (productId: string) => {
    return selectedProducts.some(product => product.productId === productId);
  };
  
  // Xử lý chọn/bỏ chọn sản phẩm
  const toggleProductSelection = (product: Product) => {
    if (isProductSelected(product._id)) {
      // Bỏ chọn sản phẩm
      setSelectedProducts(prev => prev.filter(item => item.productId !== product._id));
    } else {
      // Chọn sản phẩm và tính giá sau khi áp dụng % giảm giá
      const adjustedPrice = Math.round(product.price * (100 - discountPercent) / 100);
      
      setSelectedProducts(prev => [...prev, {
        productId: product._id,
        adjustedPrice,
        name: product.name,
        image: product.image,
        originalPrice: product.price
      }]);
    }
  };
  
  // Xử lý thay đổi % giảm giá
  const handleDiscountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    if (!isNaN(value) && value >= 0 && value <= 100) {
      setDiscountPercent(value);
      
      // Cập nhật giá của tất cả sản phẩm đã chọn
      setSelectedProducts(prev => prev.map(product => {
        const originalProduct = sampleProducts.find(p => p._id === product.productId);
        const originalPrice = originalProduct ? originalProduct.price : (product.originalPrice || 0);
        const newAdjustedPrice = Math.round(originalPrice * (100 - value) / 100);
        
        return {
          ...product,
          adjustedPrice: newAdjustedPrice,
          originalPrice
        };
      }));
    }
  };
  
  // Xử lý thêm sản phẩm vào sự kiện
  const handleAddProducts = () => {
    if (selectedProducts.length > 0) {
      onAdd(selectedProducts);
    }
  };

  if (!modalVisible) return null;

  return (
    <div className={`fixed inset-0 z-50 overflow-y-auto ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'} transition-opacity duration-300`}>
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity" aria-hidden="true">
          <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
        </div>

        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

        <div className={`inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-3xl sm:w-full ${isOpen ? 'sm:scale-100' : 'sm:scale-95'}`}>
          {/* Header */}
          <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 sm:px-6 flex justify-between items-center">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              Thêm sản phẩm vào sự kiện
            </h3>
            <button
              type="button"
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500 focus:outline-none"
            >
              <FiX className="h-5 w-5" />
            </button>
          </div>

          {/* Search and Discount */}
          <div className="px-4 py-3 sm:px-6 border-b border-gray-200">
            <div className="flex flex-wrap gap-3 items-center">
              {/* Search */}
              <div className="relative flex-1 min-w-[200px]">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FiSearch className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Tìm kiếm sản phẩm..."
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              {/* Discount Percentage */}
              <div className="flex items-center gap-2">
                <label htmlFor="discountPercent" className="text-sm font-medium text-gray-700">
                  Giảm giá:
                </label>
                <div className="relative w-24">
                  <input
                    type="number"
                    id="discountPercent"
                    min="0"
                    max="100"
                    className="block w-full pl-3 pr-8 py-2 border border-gray-300 rounded-md leading-5 bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    value={discountPercent}
                    onChange={handleDiscountChange}
                  />
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <span className="text-gray-500 sm:text-sm">%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Product List */}
          <div className="max-h-[400px] overflow-y-auto">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 p-4">
              {filteredProducts.length > 0 ? (
                filteredProducts.map((product) => {
                  const isSelected = isProductSelected(product._id);
                  const adjustedPrice = Math.round(product.price * (100 - discountPercent) / 100);
                  
                  return (
                    <div
                      key={product._id}
                      className={`border rounded-lg overflow-hidden cursor-pointer transition-all hover:shadow-md ${
                        isSelected ? 'border-indigo-500 ring-2 ring-indigo-200' : 'border-gray-200'
                      }`}
                      onClick={() => toggleProductSelection(product)}
                    >
                      <div className="p-3 flex flex-col h-full">
                        <div className="flex mb-2">
                          <div className="h-16 w-16 flex-shrink-0 bg-gray-100 rounded overflow-hidden">
                            {product.image ? (
                              <img
                                src={product.image}
                                alt={product.name}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <div className="h-full w-full flex items-center justify-center bg-gray-200">
                                <span className="text-gray-400 text-xs">No image</span>
                              </div>
                            )}
                          </div>
                          <div className="ml-3 flex-1">
                            <h4 className="text-sm font-medium text-gray-900 line-clamp-2">{product.name}</h4>
                            {product.brandName && (
                              <p className="text-xs text-gray-500 mt-1">{product.brandName}</p>
                            )}
                          </div>
                        </div>
                        
                        <div className="mt-auto pt-2 flex justify-between items-center">
                          <div>
                            <div className="text-xs text-gray-500 line-through">
                              {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(product.price)}
                            </div>
                            <div className="text-sm font-medium text-indigo-600">
                              {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(adjustedPrice)}
                            </div>
                          </div>
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                            isSelected ? 'bg-indigo-500 text-white' : 'bg-gray-100 text-gray-400'
                          }`}>
                            {isSelected ? (
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            ) : (
                              <FiPlus className="h-4 w-4" />
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="col-span-3 py-8 text-center text-gray-500">
                  {searchTerm ? 'Không tìm thấy sản phẩm phù hợp' : 'Không có sản phẩm nào khả dụng'}
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse border-t border-gray-200">
            <button
              type="button"
              className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:ml-3 sm:w-auto sm:text-sm"
              onClick={handleAddProducts}
              disabled={selectedProducts.length === 0}
            >
              Thêm {selectedProducts.length > 0 ? `(${selectedProducts.length})` : ''}
            </button>
            <button
              type="button"
              className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
              onClick={onClose}
            >
              Hủy
            </button>
            
            <div className="mr-auto flex items-center">
              <span className="text-sm text-gray-500">
                Đã chọn: <span className="font-medium text-gray-900">{selectedProducts.length}</span> sản phẩm
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventProductAddModal; 