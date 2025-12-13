import { useState } from 'react';

interface AlertState {
  title: string;
  message: string;
  isVisible: boolean;
}

/**
 * useAlert Hook - Manage alert modal state
 * 
 * Usage:
 * ```tsx
 * const { alert, showAlert, hideAlert } = useAlert();
 * 
 * // Show alert
 * showAlert('API connection failed', 'Error');
 * 
 * // Render component
 * <Alert {...alert} isVisible={alert.isVisible} onClose={hideAlert} />
 * ```
 */
export function useAlert() {
  const [alert, setAlert] = useState<AlertState>({
    title: '',
    message: '',
    isVisible: false,
  });

  const showAlert = (message: string, title: string = 'Alert') => {
    setAlert({
      title,
      message,
      isVisible: true,
    });
  };

  const hideAlert = () => {
    setAlert((prev) => ({
      ...prev,
      isVisible: false,
    }));
  };

  return {
    alert,
    showAlert,
    hideAlert,
  };
}
