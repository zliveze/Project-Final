import React, { useState, useEffect } from 'react';
import { FiSearch, FiX, FiPlus, FiCheck } from 'react-icons/fi';
import Image from 'next/image';
import { Product } from './CampaignForm';

// Dữ liệu mẫu cho sản phẩm
const sampleProducts = [
  {
    id: 'P001',
    name: 'Kem dưỡng ẩm Intensive',
    description: 'Kem dưỡng ẩm chuyên sâu cho da khô',
    image: 'https://via.placeholder.com/50',
    price: 350000,
    category: 'Skin Care',
    variants: [
      { id: 'V001', name: '50ml', price: 350000 },
      { id: 'V002', name: '100ml', price: 590000 },
    ]
  },
  {
    id: 'P002',
    name: 'Serum Vitamin C',
    description: 'Serum làm sáng da với Vitamin C tinh khiết',
    image: 'https://via.placeholder.com/50',
    price: 420000,
    category: 'Skin Care',
    variants: [
      { id: 'V003', name: '30ml', price: 420000 },
    ]
  },
  {
    id: 'P003',
    name: 'Kem chống nắng SPF 50',
    description: 'Kem chống nắng bảo vệ da khỏi tia UV',
    image: 'https://via.placeholder.com/50',
    price: 280000,
    category: 'Sun Care',
    variants: [
      { id: 'V004', name: '50ml', price: 280000 },
      { id: 'V005', name: '100ml', price: 450000 },
    ]
  },
  {
    id: 'P004',
    name: 'Sữa rửa mặt tạo bọt',
    description: 'Sữa rửa mặt làm sạch sâu, dịu nhẹ với da',
    image: 'https://via.placeholder.com/50',
    price: 180000,
    category: 'Cleansers',
    variants: [
      { id: 'V006', name: '100ml', price: 180000 },
      { id: 'V007', name: '200ml', price: 320000 },
    ]
  },
  {
    id: 'P005',
    name: 'Toner cân bằng độ pH',
    description: 'Toner không cồn, cân bằng độ pH cho da',
    image: 'https://via.placeholder.com/50',
    price: 250000,
    category: 'Toners',
    variants: [
      { id: 'V008', name: '200ml', price: 250000 },
    ]
  },
  {
    id: 'P006',
    name: 'Mặt nạ dưỡng ẩm overnight',
    description: 'Mặt nạ ngủ dưỡng ẩm qua đêm',
    image: 'https://via.placeholder.com/50',
    price: 320000,
    category: 'Masks',
    variants: [
      { id: 'V009', name: '50ml', price: 320000 },
      { id: 'V010', name: '100ml', price: 550000 },
    ]
  }
];

interface ProductSelectionTableProps {
  onClose: () => void;
  onAddProducts: (products: Product[]) => void;
  selectedProducts: Product[];
}

const ProductSelectionTable: React.FC<ProductSelectionTableProps> = ({
  onClose,
  onAddProducts,
  selectedProducts = []
}) => {
  const [products, setProducts] = useState(sampleProducts);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [tempSelectedProducts, setTempSelectedProducts] = useState<Product[]>(selectedProducts);

  // Tìm kiếm sản phẩm
  const filteredProducts = products.filter(product => {
    const matchesSearch = 
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  // Kiểm tra sản phẩm đã được chọn chưa
  const isProductSelected = (productId: string, variantId: string) => {
    return tempSelectedProducts.some(
      p => p.productId === productId && p.variantId === variantId
    );
  };

  // Thêm sản phẩm vào danh sách tạm thời
  const handleSelectProduct = (product: any, variant: any) => {
    const selected = isProductSelected(product.id, variant.id);
    
    if (selected) {
      // Nếu đã chọn rồi thì xóa khỏi danh sách
      setTempSelectedProducts(prev => 
        prev.filter(p => !(p.productId === product.id && p.variantId === variant.id))
      );
    } else {
      // Nếu chưa chọn thì thêm vào danh sách
      setTempSelectedProducts(prev => [
        ...prev,
        {
          productId: product.id,
          productName: product.name,
          variantId: variant.id,
          variantName: variant.name,
          originalPrice: variant.price,
          adjustedPrice: Math.round(variant.price * 0.9), // Giảm giá mặc định 10%
          image: product.image
        }
      ]);
    }
  };

  // Xác nhận thêm sản phẩm
  const handleConfirm = () => {
    onAddProducts(tempSelectedProducts);
  };

  // Danh sách danh mục
  const categories = ['Skin Care', 'Sun Care', 'Cleansers', 'Toners', 'Masks'];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"></div>
      
      <div className="relative bg-white rounded-lg shadow-xl w-[95vw] max-w-5xl mx-auto z-50">
        <div className="bg-pink-50 px-4 py-3 border-b border-pink-100 flex items-center justify-between">
          <h3 className="text-lg font-medium text-gray-900">
            Chọn sản phẩm cho chiến dịch
          </h3>
          <button
            type="button"
            className="bg-white rounded-md text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500 p-1"
            onClick={onClose}
          >
            <span className="sr-only">Đóng</span>
            <FiX className="h-6 w-6" />
          </button>
        </div>
          
        <div className="p-4">
          <p className="text-sm text-gray-500 mb-4">
            Chọn các sản phẩm và thiết lập giá đặc biệt cho chiến dịch của bạn.
          </p>

          <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-3 md:space-y-0 mb-4">
            <div className="w-full md:w-1/3">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Tìm kiếm sản phẩm..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500 pl-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <FiSearch className="absolute left-3 top-2.5 text-gray-400" />
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <select
                className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
              >
                <option value="all">Tất cả danh mục</option>
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="mt-2 border border-gray-200 rounded-md">
            <div className="max-h-[55vh] overflow-y-auto">
              <table className="w-full table-fixed divide-y divide-gray-200">
                <thead className="bg-gray-50 sticky top-0 z-10">
                  <tr>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[35%]">
                      Sản phẩm
                    </th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[15%]">
                      Biến thể
                    </th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[15%]">
                      Giá bán
                    </th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[15%]">
                      Danh mục
                    </th>
                    <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider w-[20%]">
                      Thao tác
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredProducts.map((product) => (
                    product.variants.map((variant) => (
                      <tr key={`${product.id}-${variant.id}`}>
                        <td className="px-4 py-3">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10">
                              <Image
                                src={product.image}
                                alt={product.name}
                                width={40}
                                height={40}
                                className="rounded-md object-cover"
                              />
                            </div>
                            <div className="ml-3">
                              <div className="text-sm font-medium text-gray-900">
                                {product.name}
                              </div>
                              <div className="text-sm text-gray-500 truncate">
                                {product.description.substring(0, 50)}...
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-500">
                          {variant.name}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-500">
                          {variant.price.toLocaleString('vi-VN')}₫
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-500">
                          {product.category}
                        </td>
                        <td className="px-4 py-3 text-right text-sm font-medium">
                          <button
                            type="button"
                            onClick={() => handleSelectProduct(product, variant)}
                            className={`inline-flex items-center px-3 py-1.5 border rounded-md text-sm font-medium ${
                              isProductSelected(product.id, variant.id)
                                ? 'border-pink-300 bg-pink-100 text-pink-700 hover:bg-pink-200'
                                : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                            }`}
                          >
                            {isProductSelected(product.id, variant.id) ? (
                              <>
                                <FiCheck className="mr-1.5 -ml-0.5 h-4 w-4" />
                                Đã chọn
                              </>
                            ) : (
                              <>
                                <FiPlus className="mr-1.5 -ml-0.5 h-4 w-4" />
                                Chọn
                              </>
                            )}
                          </button>
                        </td>
                      </tr>
                    ))
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
        
        <div className="bg-gray-50 px-4 py-3 border-t border-gray-200 flex flex-col sm:flex-row justify-between items-center">
          <div className="text-sm text-gray-500 mb-3 sm:mb-0">
            Đã chọn {tempSelectedProducts.length} sản phẩm
          </div>
          <div className="flex justify-end">
            <button
              type="button"
              className="inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500 sm:ml-3 sm:w-auto sm:text-sm"
              onClick={onClose}
            >
              Hủy
            </button>
            <button
              type="button"
              className="inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-pink-600 text-base font-medium text-white hover:bg-pink-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500 sm:ml-3 sm:w-auto sm:text-sm"
              onClick={handleConfirm}
            >
              Xác nhận ({tempSelectedProducts.length} sản phẩm)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductSelectionTable; 