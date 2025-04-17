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
    <div>
      {/* Tab Navigation */}
      <div className="flex flex-wrap border-b border-gray-100 mb-6">
        <button
          className={`px-5 py-3 text-sm font-medium transition-colors duration-200 ${
            activeTab === 'description'
              ? 'text-[#d53f8c] border-b-2 border-[#d53f8c]'
              : 'text-gray-500 hover:text-gray-700'
          }`}
          onClick={() => setActiveTab('description')}
        >
          <div className="flex items-center">
            <FiInfo className="mr-2" />
            <span>Mô tả sản phẩm</span>
          </div>
        </button>

        <button
          className={`px-5 py-3 text-sm font-medium transition-colors duration-200 ${
            activeTab === 'ingredients'
              ? 'text-[#d53f8c] border-b-2 border-[#d53f8c]'
              : 'text-gray-500 hover:text-gray-700'
          }`}
          onClick={() => setActiveTab('ingredients')}
        >
          <div className="flex items-center">
            <FiDroplet className="mr-2" />
            <span>Thành phần</span>
          </div>
        </button>

        <button
          className={`px-5 py-3 text-sm font-medium transition-colors duration-200 ${
            activeTab === 'usage'
              ? 'text-[#d53f8c] border-b-2 border-[#d53f8c]'
              : 'text-gray-500 hover:text-gray-700'
          }`}
          onClick={() => setActiveTab('usage')}
        >
          <div className="flex items-center">
            <FiList className="mr-2" />
            <span>Hướng dẫn sử dụng</span>
          </div>
        </button>

        <button
          className={`px-5 py-3 text-sm font-medium transition-colors duration-200 ${
            activeTab === 'info'
              ? 'text-[#d53f8c] border-b-2 border-[#d53f8c]'
              : 'text-gray-500 hover:text-gray-700'
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
      <div>
        {/* Mô tả sản phẩm */}
        {activeTab === 'description' && (
          <div className="prose prose-pink max-w-none">
            {fullDescription ? (
              <div dangerouslySetInnerHTML={{ __html: fullDescription }} className="text-gray-700" />
            ) : (
              <div className="bg-gray-50 p-6 rounded-lg text-center">
                <p className="text-gray-500">Chưa có mô tả chi tiết cho sản phẩm này.</p>
              </div>
            )}
          </div>
        )}

        {/* Thành phần */}
        {activeTab === 'ingredients' && (
          <div className="space-y-5">
            <div className="bg-gradient-to-r from-pink-50 to-white p-5 rounded-lg">
              <p className="text-gray-700 leading-relaxed">
                Sản phẩm được chiết xuất từ các thành phần tự nhiên, an toàn cho da và đã được kiểm nghiệm lâm sàng.
              </p>
            </div>

            {ingredients.length > 0 ? (
              <div className="bg-white border border-gray-100 p-5 rounded-lg shadow-sm">
                <h3 className="font-medium text-gray-800 mb-4">Thành phần chính:</h3>
                <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {displayedIngredients.map((ingredient, index) => (
                    <li key={index} className="flex items-center">
                      <span className="w-2 h-2 bg-gradient-to-r from-pink-500 to-pink-600 rounded-full mr-2"></span>
                      <span className="text-gray-700">{ingredient}</span>
                    </li>
                  ))}
                </ul>

                {ingredients.length > 5 && (
                  <button
                    onClick={() => setShowAllIngredients(!showAllIngredients)}
                    className="mt-4 px-4 py-2 text-sm font-medium text-pink-600 bg-pink-50 hover:bg-pink-100 rounded-md transition-colors flex items-center justify-center mx-auto"
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
              <div className="bg-white border border-gray-100 p-5 rounded-lg shadow-sm text-center">
                <p className="text-gray-500">Chưa có thông tin về thành phần sản phẩm.</p>
              </div>
            )}

            <div className="bg-blue-50 border border-blue-100 p-4 rounded-lg">
              <p className="text-blue-800 text-sm flex items-start">
                <FiAlertCircle className="mr-2 mt-0.5 flex-shrink-0 text-blue-500" />
                <span>
                  <strong>Lưu ý:</strong> Nếu bạn có tiền sử dị ứng với bất kỳ thành phần nào, vui lòng tham khảo ý kiến bác sĩ trước khi sử dụng.
                </span>
              </p>
            </div>
          </div>
        )}

        {/* Hướng dẫn sử dụng */}
        {activeTab === 'usage' && (
          <div className="space-y-5">
            <div className="bg-white border border-gray-100 p-5 rounded-lg shadow-sm">
              <h3 className="font-medium text-gray-800 mb-4 flex items-center">
                <FiList className="mr-2 text-pink-500" />
                <span>Cách sử dụng:</span>
              </h3>
              {cosmeticInfo?.usage ? (
                <p className="text-gray-700 leading-relaxed">{cosmeticInfo.usage}</p>
              ) : (
                <div className="bg-gray-50 p-4 rounded-lg text-center">
                  <p className="text-gray-500">Chưa có hướng dẫn sử dụng cho sản phẩm này.</p>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-gradient-to-r from-pink-50 to-white p-5 rounded-lg border border-pink-100">
                <h3 className="font-medium text-gray-800 mb-3 flex items-center">
                  <svg className="w-4 h-4 text-pink-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>Thời điểm sử dụng tốt nhất:</span>
                </h3>
                <p className="text-gray-700">Sáng và tối, sau khi làm sạch da và sử dụng toner.</p>
              </div>

              <div className="bg-gradient-to-r from-pink-50 to-white p-5 rounded-lg border border-pink-100">
                <h3 className="font-medium text-gray-800 mb-3 flex items-center">
                  <svg className="w-4 h-4 text-pink-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                  <span>Tần suất sử dụng:</span>
                </h3>
                <p className="text-gray-700">Hai lần mỗi ngày để đạt hiệu quả tối ưu.</p>
              </div>
            </div>

            <div className="bg-yellow-50 border border-yellow-100 p-4 rounded-lg">
              <p className="text-yellow-800 text-sm flex items-start">
                <svg className="w-4 h-4 text-yellow-500 mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
                <span>
                  <strong>Mẹo:</strong> Để tăng hiệu quả, bạn có thể kết hợp với serum Vitamin C vào buổi sáng và retinol vào buổi tối.
                </span>
              </p>
            </div>
          </div>
        )}

        {/* Thông tin khác */}
        {activeTab === 'info' && (
          <div className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white border border-gray-100 p-5 rounded-lg shadow-sm">
                <div className="flex items-center mb-4">
                  <div className="w-10 h-10 rounded-full bg-pink-50 flex items-center justify-center mr-3">
                    <FiMapPin className="text-pink-500" />
                  </div>
                  <h3 className="font-medium text-gray-800">Xuất xứ</h3>
                </div>
                <p className="text-gray-700 ml-13">{cosmeticInfo?.madeIn || 'Chưa có thông tin'}</p>
              </div>

              <div className="bg-white border border-gray-100 p-5 rounded-lg shadow-sm">
                <div className="flex items-center mb-4">
                  <div className="w-10 h-10 rounded-full bg-pink-50 flex items-center justify-center mr-3">
                    <svg className="w-5 h-5 text-pink-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h3 className="font-medium text-gray-800">Hạn sử dụng</h3>
                </div>
                <p className="text-gray-700 ml-13">
                  {cosmeticInfo?.expiry?.shelf ? `${cosmeticInfo.expiry.shelf} tháng kể từ ngày sản xuất.` : 'Chưa có thông tin'}
                  {cosmeticInfo?.expiry?.afterOpening ? ` ${cosmeticInfo.expiry.afterOpening} tháng sau khi mở.` : ''}
                </p>
              </div>
            </div>

            <div className="bg-white border border-gray-100 p-5 rounded-lg shadow-sm">
              <div className="flex items-center mb-4">
                <div className="w-10 h-10 rounded-full bg-pink-50 flex items-center justify-center mr-3">
                  <svg className="w-5 h-5 text-pink-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <h3 className="font-medium text-gray-800">Chứng nhận và kiểm nghiệm</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2">
                <div className="flex items-start bg-gradient-to-r from-pink-50 to-white p-3 rounded-lg">
                  <span className="w-2 h-2 bg-pink-500 rounded-full mr-2 mt-2"></span>
                  <span className="text-gray-700">Đã được kiểm nghiệm da liễu</span>
                </div>
                <div className="flex items-start bg-gradient-to-r from-pink-50 to-white p-3 rounded-lg">
                  <span className="w-2 h-2 bg-pink-500 rounded-full mr-2 mt-2"></span>
                  <span className="text-gray-700">Không chứa paraben, sulfate và các chất gây hại</span>
                </div>
                <div className="flex items-start bg-gradient-to-r from-pink-50 to-white p-3 rounded-lg">
                  <span className="w-2 h-2 bg-pink-500 rounded-full mr-2 mt-2"></span>
                  <span className="text-gray-700">Không thử nghiệm trên động vật</span>
                </div>
              </div>
            </div>

            <div className="bg-white border border-gray-100 p-5 rounded-lg shadow-sm">
              <div className="flex items-center mb-4">
                <div className="w-10 h-10 rounded-full bg-pink-50 flex items-center justify-center mr-3">
                  <svg className="w-5 h-5 text-pink-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="font-medium text-gray-800">Lưu ý khi sử dụng</h3>
              </div>
              <div className="space-y-3 mt-2">
                <div className="flex items-start bg-red-50 p-3 rounded-lg border border-red-100">
                  <span className="w-2 h-2 bg-red-500 rounded-full mr-2 mt-2 flex-shrink-0"></span>
                  <span className="text-gray-700">Tránh tiếp xúc với mắt. Nếu sản phẩm tiếp xúc với mắt, rửa sạch bằng nước.</span>
                </div>
                <div className="flex items-start bg-red-50 p-3 rounded-lg border border-red-100">
                  <span className="w-2 h-2 bg-red-500 rounded-full mr-2 mt-2 flex-shrink-0"></span>
                  <span className="text-gray-700">Ngừng sử dụng nếu xuất hiện kích ứng.</span>
                </div>
                <div className="flex items-start bg-red-50 p-3 rounded-lg border border-red-100">
                  <span className="w-2 h-2 bg-red-500 rounded-full mr-2 mt-2 flex-shrink-0"></span>
                  <span className="text-gray-700">Bảo quản nơi khô ráo, thoáng mát, tránh ánh nắng trực tiếp.</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductDescription;