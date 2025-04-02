import { Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { FiX, FiEdit, FiTrash2, FiExternalLink, FiFacebook, FiInstagram, FiYoutube, FiMapPin, FiGlobe, FiStar, FiCheck, FiInfo, FiCalendar } from 'react-icons/fi';
import Image from 'next/image';
import { Brand } from './BrandForm';
import { formatDate } from '@/utils/formatDate';

interface BrandDetailModalProps {
  brand: Brand | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

const BrandDetailModal: React.FC<BrandDetailModalProps> = ({ brand, isOpen, onClose, onEdit, onDelete }) => {
  if (!brand) return null;

  const handleEdit = () => {
    onClose();
    onEdit(brand.id);
  };

  const handleDelete = () => {
    onClose();
    onDelete(brand.id);
  };

  return (
    <Transition.Root show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-10" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
        </Transition.Child>

        <div className="fixed inset-0 z-10 overflow-y-auto">
          <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-2xl">
                <div className="absolute right-0 top-0 hidden pr-4 pt-4 sm:block">
                  <button
                    type="button"
                    className="rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:ring-offset-2"
                    onClick={onClose}
                  >
                    <span className="sr-only">Đóng</span>
                    <FiX className="h-6 w-6" aria-hidden="true" />
                  </button>
                </div>

                <div className="bg-pink-50 px-4 py-5 sm:px-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="h-12 w-12 rounded-full overflow-hidden border border-pink-200 bg-white mr-3">
                        {brand.logo && brand.logo.url ? (
                          <Image
                            src={brand.logo.url}
                            alt={brand.name}
                            width={48}
                            height={48}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="h-full w-full flex items-center justify-center bg-pink-100 text-pink-500">
                            {brand.name.charAt(0).toUpperCase()}
                          </div>
                        )}
                      </div>
                      <h3 className="text-lg leading-6 font-medium text-gray-900">
                        {brand.name}
                      </h3>
                    </div>
                    <div className="flex space-x-1">
                      {brand.featured && (
                        <div className="px-2 py-1 inline-flex items-center text-xs font-medium rounded-full bg-yellow-100 text-yellow-800">
                          <FiStar className="mr-1 h-3 w-3 fill-current" />
                          Nổi bật
                        </div>
                      )}
                      <div className={`px-2 py-1 inline-flex items-center text-xs font-medium rounded-full ${
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

                <div className="px-4 py-5 sm:p-6">
                  <div className="grid grid-cols-1 gap-y-6 sm:grid-cols-2 sm:gap-x-6">
                    <div className="sm:col-span-2">
                      <div className="flex items-center text-sm text-gray-500 mb-1">
                        <FiInfo className="mr-1.5 h-4 w-4 text-gray-400" />
                        Mô tả
                      </div>
                      <p className="text-gray-900">{brand.description}</p>
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
                      <p className="text-gray-900">{formatDate(brand.createdAt, true)}</p>
                    </div>

                    <div>
                      <div className="flex items-center text-sm text-gray-500 mb-1">
                        <FiCalendar className="mr-1.5 h-4 w-4 text-gray-400" />
                        Cập nhật lần cuối
                      </div>
                      <p className="text-gray-900">{formatDate(brand.updatedAt, true)}</p>
                    </div>

                    <div className="sm:col-span-2">
                      <h4 className="text-sm font-medium text-gray-500 mb-2">Mạng xã hội</h4>
                      <div className="flex flex-wrap gap-2">
                        {brand.socialMedia?.facebook ? (
                          <a 
                            href={brand.socialMedia.facebook} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="inline-flex items-center px-3 py-1 rounded-full text-sm border border-gray-200 bg-gray-50 text-gray-700 hover:bg-gray-100"
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
                            className="inline-flex items-center px-3 py-1 rounded-full text-sm border border-gray-200 bg-gray-50 text-gray-700 hover:bg-gray-100"
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
                            className="inline-flex items-center px-3 py-1 rounded-full text-sm border border-gray-200 bg-gray-50 text-gray-700 hover:bg-gray-100"
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

                <div className="bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
                  <button
                    type="button"
                    className="inline-flex w-full justify-center rounded-md bg-pink-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-pink-500 sm:ml-3 sm:w-auto"
                    onClick={handleEdit}
                  >
                    <FiEdit className="mr-2 -ml-0.5 h-4 w-4" /> Chỉnh sửa
                  </button>
                  <button
                    type="button"
                    className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:mt-0 sm:w-auto"
                    onClick={onClose}
                  >
                    Đóng
                  </button>
                  <button
                    type="button"
                    className="mt-3 inline-flex w-full justify-center rounded-md bg-red-50 px-3 py-2 text-sm font-semibold text-red-700 shadow-sm ring-1 ring-inset ring-red-300 hover:bg-red-100 sm:mt-0 sm:w-auto sm:mr-auto"
                    onClick={handleDelete}
                  >
                    <FiTrash2 className="mr-2 -ml-0.5 h-4 w-4" /> Xóa
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
};

export default BrandDetailModal; 