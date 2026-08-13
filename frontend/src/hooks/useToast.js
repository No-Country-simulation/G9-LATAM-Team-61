import { useState, useRef, useCallback } from 'react';

/**
 * Custom Hook for Toast Notifications
 */
export function useToast(autoCloseMs = 4000) {
  const [toastState, setToastState] = useState({
    visible: false,
    message: '',
    type: 'info',
  });

  const timerRef = useRef(null);

  const showToast = useCallback((message, type = 'info') => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    setToastState({ visible: true, message, type });
    timerRef.current = setTimeout(() => {
      setToastState((prev) => ({ ...prev, visible: false }));
    }, autoCloseMs);
  }, [autoCloseMs]);

  const closeToast = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    setToastState((prev) => ({ ...prev, visible: false }));
  }, []);

  return {
    toastState,
    showToast,
    closeToast,
  };
}

export default useToast;
