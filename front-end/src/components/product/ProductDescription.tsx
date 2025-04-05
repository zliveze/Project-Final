import React, { useState } from 'react';
import { FiChevronDown, FiChevronUp, FiInfo, FiDroplet, FiList, FiAlertCircle, FiMapPin } from 'react-icons/fi';

interface CosmeticInfo {
  skinType?: string[];
  concerns?: string[];
  ingredients?: string[];
  volume?: {
    value?: number;
    unit?: string;
  };
  usage?: string;
  madeIn?: string;
  expiry?: {
    shelf?: number;
    afterOpening?: number;
  };
}

interface ProductDescriptionProps {
  fullDescription: string;
  cosmeticInfo: CosmeticInfo;
}

const ProductDescription: React.FC<ProductDescriptionProps> = ({ fullDescription, cosmeticInfo }) => {
  const [activeTab, setActiveTab] = useState('description');
  const [showAllIngredients, setShowAllIngredients] = useState(false);

  // Hiển thị danh sách thành phần với giới hạn số lượng
  const ingredients = cosmeticInfo?.ingredients || [];
  const displayedIngredients = showAllIngredients 
    ? ingredients 
    : ingredients.slice(0, 5);

  return (
    <div className="py-4">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Thông tin sản phẩm</h2>
      
      {/* Tab Navigation */}
      <div className="flex flex-wrap border-b border-gray-200 mb-6">
        <button
          className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors duration-200 ${
            activeTab === 'description'
              ? 'border-[#d53f8c] text-[#d53f8c]'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
          onClick={() => setActiveTab('description')}
        >
          <div className="flex items-center">
            <FiInfo className="mr-2" />
            <span>Mô tả sản phẩm</span>
          </div>
        </button>
        
        <button
          className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors duration-200 ${
            activeTab === 'ingredients'
              ? 'border-[#d53f8c] text-[#d53f8c]'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
          onClick={() => setActiveTab('ingredients')}
        >
          <div className="flex items-center">
            <FiDroplet className="mr-2" />
            <span>Thành phần</span>
          </div>
        </button>
        
        <button
          className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors duration-200 ${
            activeTab === 'usage'
              ? 'border-[#d53f8c] text-[#d53f8c]'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
          onClick={() => setActiveTab('usage')}
        >
          <div className="flex items-center">
            <FiList className="mr-2" />
            <span>Hướng dẫn sử dụng</span>
          </div>
        </button>
        
        <button
          className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors duration-200 ${
            activeTab === 'info'
              ? 'border-[#d53f8c] text-[#d53f8c]'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
          onClick={() => setActiveTab('info')}
        >
          <div className="flex items-center">
            <FiAlertCircle className="mr-2" />
            <span>Thông tin khác</span>
          </div>
        </button>
      </div>
      
      {/* Tab Content */}
      <div className="py-2">
        {/* Mô tả sản phẩm */}
        {activeTab === 'description' && (
          <div className="prose prose-green max-w-none">
            {fullDescription ? (
              <div dangerouslySetInnerHTML={{ __html: fullDescription }} />
            ) : (
              <p className="text-gray-500">Chưa có mô tả chi tiết cho sản phẩm này.</p>
            )}
          </div>
        )}
        
        {/* Thành phần */}
        {activeTab === 'ingredients' && (
          <div className="space-y-4">
            <p className="text-gray-600">
              Sản phẩm được chiết xuất từ các thành phần tự nhiên, an toàn cho da và đã được kiểm nghiệm lâm sàng.
            </p>
            
            {ingredients.length > 0 ? (
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-medium text-gray-800 mb-3">Thành phần chính:</h3>
                <ul className="space-y-2">
                  {displayedIngredients.map((ingredient, index) => (
                    <li key={index} className="flex items-center">
                      <span className="w-2 h-2 bg-[#d53f8c] rounded-full mr-2"></span>
                      <span className="text-gray-700">{ingredient}</span>
                    </li>
                  ))}
                </ul>
                
                {ingredients.length > 5 && (
                  <button
                    onClick={() => setShowAllIngredients(!showAllIngredients)}
                    className="text-[#d53f8c] hover:underline text-sm mt-2 flex items-center"
                  >
                    {showAllIngredients ? (
                      <>
                        <span>Thu gọn</span>
                        <FiChevronUp className="ml-1" />
                      </>
                    ) : (
                      <>
                        <span>Xem tất cả ({ingredients.length} thành phần)</span>
                        <FiChevronDown className="ml-1" />
                      </>
                    )}
                  </button>
                )}
              </div>
            ) : (
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-gray-500">Chưa có thông tin về thành phần sản phẩm.</p>
              </div>
            )}
            
            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-blue-800 text-sm">
                <strong>Lưu ý:</strong> Nếu bạn có tiền sử dị ứng với bất kỳ thành phần nào, vui lòng tham khảo ý kiến bác sĩ trước khi sử dụng.
              </p>
            </div>
          </div>
        )}
        
        {/* Hướng dẫn sử dụng */}
        {activeTab === 'usage' && (
          <div className="space-y-4">
            <div className="bg-[#f0f7f4] p-5 rounded-lg">
              <h3 className="font-medium text-gray-800 mb-3">Cách sử dụng:</h3>
              {cosmeticInfo?.usage ? (
                <p className="text-gray-700 leading-relaxed">{cosmeticInfo.usage}</p>
              ) : (
                <p className="text-gray-500">Chưa có hướng dẫn sử dụng cho sản phẩm này.</p>
              )}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-medium text-gray-800 mb-2">Thời điểm sử dụng tốt nhất:</h3>
                <p className="text-gray-700">Sáng và tối, sau khi làm sạch da và sử dụng toner.</p>
              </div>
              
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-medium text-gray-800 mb-2">Tần suất sử dụng:</h3>
                <p className="text-gray-700">Hai lần mỗi ngày để đạt hiệu quả tối ưu.</p>
              </div>
            </div>
            
            <div className="bg-yellow-50 p-4 rounded-lg mt-4">
              <p className="text-yellow-800 text-sm">
                <strong>Mẹo:</strong> Để tăng hiệu quả, bạn có thể kết hợp với serum Vitamin C vào buổi sáng và retinol vào buổi tối.
              </p>
            </div>
          </div>
        )}
        
        {/* Thông tin khác */}
        {activeTab === 'info' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center mb-3">
                  <FiMapPin className="text-[#d53f8c] mr-2" />
                  <h3 className="font-medium text-gray-800">Xuất xứ</h3>
                </div>
                <p className="text-gray-700">{cosmeticInfo?.madeIn || 'Chưa có thông tin'}</p>
              </div>
              
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center mb-3">
                  <svg className="w-5 h-5 text-[#d53f8c] mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <h3 className="font-medium text-gray-800">Hạn sử dụng</h3>
                </div>
                <p className="text-gray-700">
                  {cosmeticInfo?.expiry?.shelf ? `${cosmeticInfo.expiry.shelf} tháng kể từ ngày sản xuất.` : 'Chưa có thông tin'} 
                  {cosmeticInfo?.expiry?.afterOpening ? ` ${cosmeticInfo.expiry.afterOpening} tháng sau khi mở.` : ''}
                </p>
              </div>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center mb-3">
                <svg className="w-5 h-5 text-[#d53f8c] mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                <h3 className="font-medium text-gray-800">Chứng nhận và kiểm nghiệm</h3>
              </div>
              <ul className="space-y-2">
                <li className="flex items-start">
                  <span className="w-2 h-2 bg-[#d53f8c] rounded-full mr-2 mt-2"></span>
                  <span className="text-gray-700">Đã được kiểm nghiệm da liễu</span>
                </li>
                <li className="flex items-start">
                  <span className="w-2 h-2 bg-[#d53f8c] rounded-full mr-2 mt-2"></span>
                  <span className="text-gray-700">Không chứa paraben, sulfate và các chất gây hại</span>
                </li>
                <li className="flex items-start">
                  <span className="w-2 h-2 bg-[#d53f8c] rounded-full mr-2 mt-2"></span>
                  <span className="text-gray-700">Không thử nghiệm trên động vật</span>
                </li>
              </ul>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center mb-3">
                <svg className="w-5 h-5 text-[#d53f8c] mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h3 className="font-medium text-gray-800">Lưu ý khi sử dụng</h3>
              </div>
              <ul className="space-y-2">
                <li className="flex items-start">
                  <span className="w-2 h-2 bg-[#d53f8c] rounded-full mr-2 mt-2"></span>
                  <span className="text-gray-700">Tránh tiếp xúc với mắt. Nếu sản phẩm tiếp xúc với mắt, rửa sạch bằng nước.</span>
                </li>
                <li className="flex items-start">
                  <span className="w-2 h-2 bg-[#d53f8c] rounded-full mr-2 mt-2"></span>
                  <span className="text-gray-700">Ngừng sử dụng nếu xuất hiện kích ứng.</span>
                </li>
                <li className="flex items-start">
                  <span className="w-2 h-2 bg-[#d53f8c] rounded-full mr-2 mt-2"></span>
                  <span className="text-gray-700">Bảo quản nơi khô ráo, thoáng mát, tránh ánh nắng trực tiếp.</span>
                </li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductDescription; 