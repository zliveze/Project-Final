import React from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import { FiCheckCircle, FiAlertTriangle, FiInfo, FiX } from 'react-icons/fi';

interface ImportSummaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  summary: {
    success: boolean;
    created: number;
    updated: number;
    errors: string[];
    totalProducts: number;
    statusChanges?: {
      toOutOfStock: number;
      toActive: number;
    };
  } | null;
}

const ImportSummaryModal: React.FC<ImportSummaryModalProps> = ({ isOpen, onClose, summary }) => {
  if (!summary) return null;

  const hasErrors = summary.errors.length > 0;
  const successCount = summary.created + summary.updated;
  const successRate = summary.totalProducts > 0 
    ? Math.round((successCount / summary.totalProducts) * 100) 
    : 0;

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/25" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-lg bg-white p-6 text-left align-middle shadow-xl transition-all">
                <div className="flex justify-between items-center">
                  <Dialog.Title
                    as="h3"
                    className="text-lg font-medium leading-6 text-gray-900 flex items-center"
                  >
                    {summary.success ? (
                      <>
                        <FiCheckCircle className="mr-2 text-green-500" />
                        Import hoàn tất
                      </>
                    ) : (
                      <>
                        <FiAlertTriangle className="mr-2 text-yellow-500" />
                        Import hoàn tất với cảnh báo
                      </>
                    )}
                  </Dialog.Title>
                  <button
                    type="button"
                    className="text-gray-400 hover:text-gray-500"
                    onClick={onClose}
                  >
                    <FiX className="h-5 w-5" />
                  </button>
                </div>

                <div className="mt-4">
                  <div className="bg-gray-50 p-4 rounded-md mb-4">
                    <h4 className="font-medium text-gray-700 mb-2">Tổng kết</h4>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="bg-white p-3 rounded border border-gray-200">
                        <p className="text-sm text-gray-500">Tổng sản phẩm</p>
                        <p className="text-xl font-semibold text-gray-800">{summary.totalProducts}</p>
                      </div>
                      <div className="bg-white p-3 rounded border border-gray-200">
                        <p className="text-sm text-gray-500">Tỷ lệ thành công</p>
                        <p className="text-xl font-semibold text-gray-800">{successRate}%</p>
                      </div>
                      <div className="bg-white p-3 rounded border border-gray-200">
                        <p className="text-sm text-gray-500">Sản phẩm mới</p>
                        <p className="text-xl font-semibold text-green-600">{summary.created}</p>
                      </div>
                      <div className="bg-white p-3 rounded border border-gray-200">
                        <p className="text-sm text-gray-500">Sản phẩm cập nhật</p>
                        <p className="text-xl font-semibold text-blue-600">{summary.updated}</p>
                      </div>
                    </div>
                  </div>

                  {summary.statusChanges && (
                    <div className="bg-pink-50 p-4 rounded-md mb-4">
                      <h4 className="font-medium text-pink-700 mb-2 flex items-center">
                        <FiInfo className="mr-1" /> Thay đổi trạng thái
                      </h4>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="bg-white p-3 rounded border border-pink-100">
                          <p className="text-sm text-gray-500">Chuyển sang hết hàng</p>
                          <p className="text-xl font-semibold text-pink-600">{summary.statusChanges.toOutOfStock}</p>
                        </div>
                        <div className="bg-white p-3 rounded border border-pink-100">
                          <p className="text-sm text-gray-500">Chuyển sang còn hàng</p>
                          <p className="text-xl font-semibold text-green-600">{summary.statusChanges.toActive}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {hasErrors && (
                    <div className="mt-4">
                      <h4 className="font-medium text-red-600 mb-2 flex items-center">
                        <FiAlertTriangle className="mr-1" /> Lỗi ({summary.errors.length})
                      </h4>
                      <div className="max-h-40 overflow-y-auto bg-red-50 p-3 rounded-md border border-red-100">
                        <ul className="list-disc pl-5 space-y-1">
                          {summary.errors.map((error, index) => (
                            <li key={index} className="text-sm text-red-600">
                              {error}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}
                </div>

                <div className="mt-6 flex justify-end">
                  <button
                    type="button"
                    className="inline-flex justify-center rounded-md border border-transparent px-4 py-2 text-sm font-medium text-white bg-pink-600 hover:bg-pink-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-pink-500 focus-visible:ring-offset-2"
                    onClick={onClose}
                  >
                    Đóng
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};

export default ImportSummaryModal;
