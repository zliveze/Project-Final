import React, { useEffect } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import ImportProgressBar from './ImportProgressBar';
import { FiCheckCircle, FiAlertTriangle, FiLoader } from 'react-icons/fi';

// Cờ điều khiển việc hiển thị debug logs
const DEBUG_MODE = false;

// Hàm debug log - chỉ hiển thị khi DEBUG_MODE = true
const debugLog = (...args: unknown[]) => {
  if (DEBUG_MODE) {
    console.log(...args);
  }
};

interface ImportProgressModalProps {
  isOpen: boolean;
  onClose: () => void;
  progress: {
    progress: number;
    status: string;
    message?: string;
    branchName?: string; // Thêm trường branchName để hiển thị chi nhánh đã chọn
  } | null;
  selectedBranchName?: string; // Thêm trường selectedBranchName để hiển thị chi nhánh đã chọn
}

const ImportProgressModal: React.FC<ImportProgressModalProps> = ({ isOpen, onClose, progress, selectedBranchName }) => {
  // Tự động đóng modal khi hoàn thành sau 3 giây
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    if (progress?.status === 'completed' && progress.progress === 100) {
      debugLog('ImportProgressModal: Nhận trạng thái hoàn thành, sẽ đóng sau 3 giây');
      timeoutId = setTimeout(() => {
        debugLog('ImportProgressModal: Đóng modal sau khi hoàn thành');
        onClose();
      }, 3000);
    } else if (progress?.status === 'error') {
      debugLog('ImportProgressModal: Nhận trạng thái lỗi');
    } else if (progress && DEBUG_MODE) {
      // Chỉ log khi trạng thái thay đổi đáng kể (chỉ log mỗi 10%)
      if (progress.progress % 10 === 0) {
        debugLog(`ImportProgressModal: Tiến trình ${progress.progress}%, trạng thái: ${progress.status}`);
      }
    }

    return () => {
      if (timeoutId) {
        debugLog('ImportProgressModal: Hủy hẹn giờ đóng modal');
        clearTimeout(timeoutId);
      }
    };
  }, [progress, onClose]);

  // Log trạng thái modal để debug - chỉ log khi mở/đóng modal hoặc có lỗi
  useEffect(() => {
    if (DEBUG_MODE) {
      debugLog(`ImportProgressModal: Modal ${isOpen ? 'mở' : 'đóng'}, progress:`, progress);
    }
  }, [isOpen, progress]);

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={() => {
        debugLog('ImportProgressModal: Người dùng đóng modal');
        onClose();
      }}>
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
                <Dialog.Title
                  as="h3"
                  className="text-lg font-medium leading-6 text-gray-900 flex items-center"
                >
                  {progress?.status === 'completed' ? (
                    <>
                      <FiCheckCircle className="mr-2 text-green-500" />
                      Import hoàn tất
                    </>
                  ) : progress?.status === 'error' ? (
                    <>
                      <FiAlertTriangle className="mr-2 text-red-500" />
                      Lỗi import
                    </>
                  ) : (
                    <>
                      <FiLoader className="mr-2 text-pink-500 animate-spin" />
                      Đang import dữ liệu
                    </>
                  )}
                </Dialog.Title>

                <div className="mt-4">
                  {/* Hiển thị thông tin chi nhánh đã chọn */}
                  {(progress?.branchName || selectedBranchName) && (
                    <div className="mb-3 p-2 bg-pink-50 border border-pink-100 rounded-md">
                      <p className="text-sm text-pink-700">
                        Chi nhánh: <span className="font-medium">{progress?.branchName || selectedBranchName}</span>
                      </p>
                    </div>
                  )}

                  {progress ? (
                    <ImportProgressBar
                      progress={progress.progress}
                      status={progress.status}
                      message={progress.message}
                    />
                  ) : (
                    <div>
                      <p className="text-sm text-gray-500 mb-2">
                        Đang kết nối đến server...
                      </p>
                      <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <div
                          className="h-2.5 rounded-full bg-pink-500 animate-pulse"
                          style={{ width: '30%' }}
                        ></div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="mt-6 flex justify-end">
                  <button
                    type="button"
                    className={`inline-flex justify-center rounded-md border border-transparent px-4 py-2 text-sm font-medium text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${
                      progress?.status === 'completed' || progress?.status === 'error' || !progress
                        ? 'bg-pink-600 hover:bg-pink-700 focus-visible:ring-pink-500'
                        : 'bg-gray-400 cursor-not-allowed'
                    }`}
                    onClick={() => {
                      debugLog('ImportProgressModal: Người dùng nhấn nút đóng');
                      onClose();
                    }}
                    disabled={progress?.status !== 'completed' && progress?.status !== 'error' && progress !== null}
                  >
                    {progress?.status === 'completed' || progress?.status === 'error'
                      ? 'Đóng'
                      : progress === null
                        ? 'Đóng khẩn cấp'
                        : 'Đang xử lý...'}
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

export default ImportProgressModal;
