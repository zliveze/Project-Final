import { toast, ToastOptions } from 'react-toastify';

// Standard toast configuration
const defaultOptions: ToastOptions = {
  position: "bottom-right",
  autoClose: 3000,
  hideProgressBar: false,
  closeOnClick: true,
  pauseOnHover: true,
  draggable: true,
  progress: undefined,
};

// Success toast with standard styling
export const showSuccessToast = (message: string, options?: ToastOptions) => {
  return toast.success(message, {
    ...defaultOptions,
    ...options,
  });
};

// Error toast with standard styling
export const showErrorToast = (message: string, options?: ToastOptions) => {
  return toast.error(message, {
    ...defaultOptions,
    ...options,
  });
};

// Info toast with standard styling
export const showInfoToast = (message: string, options?: ToastOptions) => {
  return toast.info(message, {
    ...defaultOptions,
    ...options,
  });
};

// Warning toast with standard styling
export const showWarningToast = (message: string, options?: ToastOptions) => {
  return toast.warning(message, {
    ...defaultOptions,
    ...options,
  });
};

// Loading toast with standard styling
export const showLoadingToast = (message: string = 'Đang xử lý...', options?: ToastOptions) => {
  return toast.loading(message, {
    ...defaultOptions,
    ...options,
  });
};

// Dismiss a specific toast
export const dismissToast = (toastId: string | number) => {
  toast.dismiss(toastId);
};

// Dismiss all toasts
export const dismissAllToasts = () => {
  toast.dismiss();
};

// Export the toast object for advanced usage if needed
export { toast };
