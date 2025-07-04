import React, { useEffect } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import ImportProgressBar from './ImportProgressBar';
import { FiCheckCircle, FiAlertTriangle, FiLoader } from 'react-icons/fi';
import { ImportTask } from '@/hooks/useImportProgress';

// Cờ điều khiển việc hiển thị debug logs
const DEBUG_MODE = process.env.NODE_ENV === 'development';

// Hàm debug log - chỉ hiển thị khi DEBUG_MODE = true
const debugLog = (...args: unknown[]) => {
  if (DEBUG_MODE) {
    console.log('[ImportProgressModal]', ...args);
  }
};

interface ImportProgressModalProps {
  isOpen: boolean;
  onClose: () => void;
  task: ImportTask | null;
  selectedBranchName?: string;
}

const ImportProgressModal: React.FC<ImportProgressModalProps> = ({ isOpen, onClose, task, selectedBranchName }) => {
  // KHÔNG tự động đóng modal - để người dùng tự đóng
  // useEffect(() => {
  //   let timeoutId: NodeJS.Timeout;

  //   if (task?.status === 'completed') {
  //     debugLog('Nhận trạng thái hoàn thành, sẽ đóng sau 3 giây');
  //     timeoutId = setTimeout(() => {
  //       debugLog('Đóng modal sau khi hoàn thành');
  //       onClose();
  //     }, 3000);
  //   }

  //   return () => {
  //     if (timeoutId) {
  //       clearTimeout(timeoutId);
  //     }
  //   };
  // }, [task, onClose]);

  useEffect(() => {
    debugLog(`Modal ${isOpen ? 'mở' : 'đóng'}`, { task });
  }, [isOpen, task]);

  const getTitle = () => {
    if (!task || task.status === 'pending' || task.status === 'processing') {
      return (
        <>
          <FiLoader className="mr-2 text-pink-500 animate-spin" />
          Đang import dữ liệu
        </>
      );
    }
    if (task.status === 'completed') {
      return (
        <>
          <FiCheckCircle className="mr-2 text-green-500" />
          Import hoàn tất
        </>
      );
    }
    if (task.status === 'failed') {
      return (
        <>
          <FiAlertTriangle className="mr-2 text-red-500" />
          Lỗi import
        </>
      );
    }
    return null;
  };



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
                <Dialog.Title
                  as="h3"
                  className="text-lg font-medium leading-6 text-gray-900 flex items-center"
                >
                  {getTitle()}
                </Dialog.Title>

                <div className="mt-4">
                  {selectedBranchName && (
                    <div className="mb-3 p-2 bg-pink-50 border border-pink-100 rounded-md">
                      <p className="text-sm text-pink-700">
                        Chi nhánh: <span className="font-medium">{selectedBranchName}</span>
                      </p>
                    </div>
                  )}

                  {task ? (
                    <ImportProgressBar
                      progress={task.progress}
                      status={task.status}
                      message={task.message}
                    />
                  ) : (
                    <div>
                      <p className="text-sm text-gray-500 mb-2">
                        Đang khởi tạo tác vụ...
                      </p>
                      <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <div
                          className="h-2.5 rounded-full bg-pink-500 animate-pulse"
                          style={{ width: '10%' }}
                        ></div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="mt-6 flex justify-end">
                  <button
                    type="button"
                    className={`inline-flex justify-center rounded-md border border-transparent px-4 py-2 text-sm font-medium text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${
                      task?.status === 'completed' || task?.status === 'failed'
                        ? 'bg-pink-600 hover:bg-pink-700 focus-visible:ring-pink-500'
                        : 'bg-gray-400 cursor-not-allowed'
                    }`}
                    onClick={onClose}
                    disabled={task?.status !== 'completed' && task?.status !== 'failed'}
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

export default ImportProgressModal;
