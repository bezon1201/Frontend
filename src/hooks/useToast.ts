import { useState, useCallback } from 'react';
import type { ToastType } from '../components/Toast';

interface ToastState {
  isVisible: boolean;
  title: string;
  description?: string;
  type: ToastType;
}

export function useToast() {
  const [toast, setToast] = useState<ToastState>({
    isVisible: false,
    title: '',
    description: '',
    type: 'success'
  });

  const showToast = useCallback((
    title: string, 
    description?: string, 
    type: ToastType = 'success'
  ) => {
    setToast({
      isVisible: true,
      title,
      description,
      type
    });
  }, []);

  const hideToast = useCallback(() => {
    setToast(prev => ({ ...prev, isVisible: false }));
  }, []);

  return {
    toast,
    showToast,
    hideToast
  };
}
