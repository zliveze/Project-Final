import React, { useState } from 'react';
import { FiMapPin, FiChevronDown, FiChevronUp, FiPackage } from 'react-icons/fi';

interface Branch {
  _id: string;
  name: string;
  address?: string;
  phone?: string;
}

interface InventoryItem {
  branchId: string;
  quantity: number;
  lowStockThreshold: number;
}

interface ProductInventoryProps {
  inventory: InventoryItem[];
  branches: Branch[];
}

const ProductInventory: React.FC<ProductInventoryProps> = ({ inventory = [], branches = [] }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  // Nếu không có dữ liệu tồn kho
  if (!inventory || inventory.length === 0) {
    return (
      <div>
        <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
          <FiPackage className="mr-2 text-[#d53f8c]" />
          Tình trạng tồn kho
        </h3>
        <div className="bg-gray-50 rounded-lg p-4">
          <p className="text-gray-500 text-center">Chưa có thông tin tồn kho</p>
        </div>
      </div>
    );
  }

  // Tính tổng số lượng tồn kho
  const totalQuantity = inventory.reduce((sum, item) => sum + (item?.quantity || 0), 0);
  
  // Kiểm tra xem có chi nhánh nào sắp hết hàng không
  const hasLowStock = inventory.some(item => 
    item?.quantity > 0 && 
    item?.lowStockThreshold && 
    item.quantity <= item.lowStockThreshold
  );

  // Lấy thông tin chi nhánh từ branchId
  const getBranchInfo = (branchId: string) => {
    return branches.find(branch => branch._id === branchId);
  };

  return (
    <div>
      <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
        <FiPackage className="mr-2 text-[#d53f8c]" />
        Tình trạng tồn kho
      </h3>
      
      <div className="bg-gray-50 rounded-lg p-3">
        {/* Allow clicking to expand even if only 1 branch */}
        <div 
          className={`flex items-center justify-between ${inventory.length > 0 ? 'cursor-pointer' : ''}`}
          onClick={() => inventory.length > 0 && setIsExpanded(!isExpanded)} 
        >
          <div className="flex items-center">
            <FiMapPin className="text-[#d53f8c] mr-2" />
            <span className="text-sm font-medium">
              {totalQuantity > 0 ? (
                <span className="text-green-600">Còn hàng ({totalQuantity})</span>
              ) : (
                <span className="text-red-600">Hết hàng</span>
              )}
            </span>
            {hasLowStock && (
              <span className="ml-2 px-2 py-0.5 bg-orange-100 text-orange-700 text-xs rounded-full">
                Sắp hết
              </span>
            )}
          </div>
          {/* Show arrow if there is inventory (even just 1 branch) */}
          {inventory.length > 0 && ( 
            <button className="text-gray-500 hover:text-[#d53f8c] transition-colors">
              {isExpanded ? <FiChevronUp /> : <FiChevronDown />}
            </button>
          )}
        </div>

        {/* Show expanded list if isExpanded and there's inventory */}
        {isExpanded && inventory.length > 0 && ( 
          <div className="mt-3 space-y-2 border-t border-gray-200 pt-3">
            {inventory.map((item, index) => {
              if (!item) return null; 
              
              const branch = getBranchInfo(item.branchId);
              const isLowStock = item.quantity <= item.lowStockThreshold && item.quantity > 0;
              
              return (
                <div key={index} className="flex items-start justify-between text-sm bg-white p-2 rounded-lg"> {/* Changed items-center to items-start */}
                  <div className="flex-1 mr-2"> {/* Added flex-1 and margin */}
                    <span className="font-medium">{branch?.name || `Chi nhánh ${index + 1}`}</span>
                    {/* Display Branch Address */}
                    {branch?.address && (
                      <div className="text-xs text-gray-500 mt-0.5 line-clamp-2"> {/* Added line-clamp */}
                        {branch.address}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center">
                    {item.quantity > 0 ? (
                      <>
                        <span className={`${isLowStock ? 'text-orange-600' : 'text-green-600'} font-medium`}>
                          Còn {item.quantity}
                        </span>
                        {isLowStock && (
                          <span className="ml-1 px-1.5 py-0.5 bg-orange-100 text-orange-700 text-xs rounded-full">
                            Sắp hết
                          </span>
                        )}
                      </>
                    ) : (
                      <span className="text-red-600 font-medium">Hết hàng</span>
                    )}
                  </div>
                </div>
              );
            })}
            
            {branches?.length > 0 && branches.some(branch => !inventory.some(item => item?.branchId === branch._id)) && (
              <p className="text-xs text-gray-500 mt-2 italic">
                * Một số chi nhánh không có sẵn sản phẩm này
              </p>
            )}
          </div>
        )}
      </div>
      
      {branches?.length > 0 && (
        <div className="mt-3 text-sm text-gray-600">
          <p className="flex items-center">
            <FiMapPin className="text-[#d53f8c] mr-2" />
            <span>Có mặt tại tất cả chi nhánh</span>
          </p>
        </div>
      )}
    </div>
  );
};

export default ProductInventory;
