# Toast Notification System

This document outlines the standardized toast notification system used across the application.

## Overview

The application uses a centralized toast notification system based on `react-toastify`. This ensures consistent styling and behavior across all interfaces.

## Usage

### Import

```typescript
import { 
  showSuccessToast, 
  showErrorToast, 
  showInfoToast, 
  showWarningToast,
  showLoadingToast,
  dismissToast,
  dismissAllToasts
} from '@/utils/toast';
```

### Basic Usage

```typescript
// Success toast
showSuccessToast('Operation completed successfully!');

// Error toast
showErrorToast('An error occurred. Please try again.');

// Info toast
showInfoToast('Please note this important information.');

// Warning toast
showWarningToast('This action cannot be undone.');

// Loading toast
const toastId = showLoadingToast('Processing your request...');

// Later, dismiss the loading toast
dismissToast(toastId);

// Dismiss all toasts
dismissAllToasts();
```

### Custom Options

You can pass custom options to override the default settings:

```typescript
showSuccessToast('Custom toast', {
  position: "top-center",
  autoClose: 5000,
  hideProgressBar: true,
  // Other react-toastify options
});
```

## Default Configuration

The default toast configuration is:

- **Position**: Bottom right
- **Auto Close**: 3000ms (3 seconds)
- **Progress Bar**: Visible
- **Newest on Top**: Yes
- **Close on Click**: Yes
- **Draggable**: Yes
- **Pause on Hover**: Yes
- **Theme**: Light

## Toast Container

The toast container is configured in the `DefaultLayout.tsx` file with the following settings:

```tsx
<ToastContainer
  position="bottom-right"
  autoClose={3000}
  hideProgressBar={false}
  newestOnTop
  closeOnClick
  rtl={false}
  pauseOnFocusLoss
  draggable
  pauseOnHover
  style={{ zIndex: 9999 }}
  toastStyle={{
    marginBottom: '60px',
    marginRight: '10px'
  }}
  theme="light"
/>
```

## Implementation Details

The toast utility is implemented in `src/utils/toast.ts` and provides a wrapper around `react-toastify` to ensure consistent styling and behavior.

## Best Practices

1. Always use the utility functions instead of direct `toast` calls
2. Use the appropriate toast type for the message (success, error, info, warning)
3. Keep toast messages concise and clear
4. Use loading toasts for operations that take time, and dismiss them when complete
