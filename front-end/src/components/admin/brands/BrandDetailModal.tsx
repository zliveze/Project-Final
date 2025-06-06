import { useState, useEffect } from 'react';
import { FiX, FiEdit, FiTrash2, FiExternalLink, FiFacebook, FiInstagram, FiYoutube, FiMapPin, FiGlobe, FiStar, FiCheck, FiInfo, FiCalendar, FiEye } from 'react-icons/fi';
import { Brand } from '@/contexts/BrandContext'; // Import Brand from BrandContext
import { formatDate } from '@/utils/formatDate';

interface BrandDetailModalProps {
  brand: Brand | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

const BrandDetailModal: React.FC<BrandDetailModalProps> = ({ brand, isOpen, onClose, onEdit, onDelete }) => {
  const [modalVisible, setModalVisible] = useState(false);

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

  if (!brand || (!isOpen && !modalVisible)) return null;

  const handleEdit = () => {
    if (brand.id) {
      onClose();
      onEdit(brand.id);
    } else {
      console.error("Cannot edit brand: ID is missing.");
      // Optionally, show a toast message to the user
    }
  };

  const handleDelete = () => {
    if (brand.id) {
      onClose();
      onDelete(brand.id);
    } else {
      console.error("Cannot delete brand: ID is missing.");
      // Optionally, show a toast message to the user
    }
  };

  return (
    <div className={`fixed inset-0 z-[1000] overflow-y-auto ${isOpen ? 'opacity-100' : 'opacity-0'} transition-opacity duration-300`}>
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity" aria-hidden="true">
          <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
        </div>

        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">
          &#8203;
        </span>

        <div
          className={`inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-sm transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full ${
            isOpen ? 'translate-y-0 sm:scale-100' : 'translate-y-4 sm:scale-95'
          }`}
        >
          <div className="absolute top-0 right-0 pt-4 pr-4 z-10">
            <button
              type="button"
              className="bg-white rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-pink-500 p-2 transition-colors"
              onClick={onClose}
            >
              <span className="sr-only">Đóng</span>
              <FiX className="h-5 w-5" />
            </button>
          </div>

          <div className="bg-pink-50 px-4 py-3 border-b border-pink-100 flex items-center">
            <div className="w-10 h-10 rounded-full bg-pink-100 flex items-center justify-center mr-3">
              <FiEye className="text-pink-600" />
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-medium text-gray-900">
                {brand.name}
              </h2>
              <div className="flex space-x-2 mt-1">
                {brand.featured && (
                  <div className="px-2 py-0.5 inline-flex items-center text-xs font-medium rounded-full bg-yellow-100 text-yellow-800">
                    <FiStar className="mr-1 h-3 w-3" />
                    Nổi bật
                  </div>
                )}
                <div className={`px-2 py-0.5 inline-flex items-center text-xs font-medium rounded-full ${
                  brand.status === 'active'
                    ? 'bg-green-100 text-green-800'
                    : 'bg-red-100 text-red-800'
                  }`}>
                  <FiCheck className="mr-1 h-3 w-3" />
                  {brand.status === 'active' ? 'Hoạt động' : 'Không hoạt động'}
                </div>
              </div>
            </div>
          </div>

                <div className="px-6 py-6">
                  <div className="grid grid-cols-1 gap-y-6 sm:grid-cols-2 sm:gap-x-8">
                    <div className="sm:col-span-2">
                      <div className="flex items-center text-sm text-gray-500 mb-1">
                        <FiInfo className="mr-1.5 h-4 w-4 text-gray-400" />
                        Mô tả
                      </div>
                      <p className="text-gray-700 leading-relaxed">{brand.description}</p>
                    </div>

                    {brand.origin && (
                      <div>
                        <div className="flex items-center text-sm text-gray-500 mb-1">
                          <FiMapPin className="mr-1.5 h-4 w-4 text-gray-400" />
                          Xuất xứ
                        </div>
                        <p className="text-gray-900">{brand.origin}</p>
                      </div>
                    )}

                    {brand.website && (
                      <div>
                        <div className="flex items-center text-sm text-gray-500 mb-1">
                          <FiGlobe className="mr-1.5 h-4 w-4 text-gray-400" />
                          Website
                        </div>
                        <a
                          href={brand.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800 hover:underline flex items-center"
                        >
                          {brand.website.replace(/^https?:\/\/(www\.)?/, '')}
                          <FiExternalLink className="ml-1 h-3 w-3" />
                        </a>
                      </div>
                    )}

                    <div>
                      <div className="flex items-center text-sm text-gray-500 mb-1">
                        <FiCalendar className="mr-1.5 h-4 w-4 text-gray-400" />
                        Ngày tạo
                      </div>
                      <p className="text-gray-900">{formatDate(brand.createdAt ? (brand.createdAt instanceof Date ? brand.createdAt.toISOString() : brand.createdAt) : '', true)}</p>
                    </div>

                    <div>
                      <div className="flex items-center text-sm text-gray-500 mb-1">
                        <FiCalendar className="mr-1.5 h-4 w-4 text-gray-400" />
                        Cập nhật lần cuối
                      </div>
                      <p className="text-gray-900">{formatDate(brand.updatedAt ? (brand.updatedAt instanceof Date ? brand.updatedAt.toISOString() : brand.updatedAt) : '', true)}</p>
                    </div>

                    <div className="sm:col-span-2">
                      <h4 className="text-sm font-medium text-gray-700 mb-3 pb-2 border-b">Mạng xã hội</h4>
                      <div className="flex flex-wrap gap-2">
                        {brand.socialMedia?.facebook ? (
                          <a
                            href={brand.socialMedia.facebook}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center px-3 py-1.5 rounded-full text-sm border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 transition-colors shadow-sm"
                          >
                            <FiFacebook className="mr-1.5 h-4 w-4 text-blue-600" />
                            Facebook
                          </a>
                        ) : null}

                        {brand.socialMedia?.instagram ? (
                          <a
                            href={brand.socialMedia.instagram}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center px-3 py-1.5 rounded-full text-sm border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 transition-colors shadow-sm"
                          >
                            <FiInstagram className="mr-1.5 h-4 w-4 text-pink-600" />
                            Instagram
                          </a>
                        ) : null}

                        {brand.socialMedia?.youtube ? (
                          <a
                            href={brand.socialMedia.youtube}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center px-3 py-1.5 rounded-full text-sm border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 transition-colors shadow-sm"
                          >
                            <FiYoutube className="mr-1.5 h-4 w-4 text-red-600" />
                            Youtube
                          </a>
                        ) : null}

                        {(!brand.socialMedia?.facebook && !brand.socialMedia?.instagram && !brand.socialMedia?.youtube) && (
                          <span className="text-gray-500 text-sm italic">Không có thông tin mạng xã hội</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 px-6 py-4 sm:flex sm:flex-row-reverse border-t">
                  <button
                    type="button"
                    className="inline-flex items-center justify-center rounded-md bg-pink-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-pink-500 transition-colors sm:ml-3"
                    onClick={handleEdit}
                  >
                    <FiEdit className="mr-2 -ml-0.5 h-4 w-4" /> Chỉnh sửa
                  </button>
                  <button
                    type="button"
                    className="mt-3 inline-flex items-center justify-center rounded-md bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm ring-1 ring-inset ring-gray-200 hover:bg-gray-50 transition-colors sm:mt-0"
                    onClick={onClose}
                  >
                    Đóng
                  </button>
                  <button
                    type="button"
                    className="mt-3 inline-flex w-full justify-center rounded-md bg-red-50 px-3 py-2 text-sm font-medium text-red-700 shadow-sm ring-1 ring-inset ring-red-200 hover:bg-red-100 sm:mt-0 sm:w-auto sm:mr-auto transition-colors"
                    onClick={handleDelete}
                  >
                    <FiTrash2 className="mr-2 -ml-0.5 h-4 w-4" /> Xóa
                  </button>
                </div>
        </div>
      </div>
    </div>
  );
};

export default BrandDetailModal;
