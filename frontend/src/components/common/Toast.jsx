import React from 'react';

export function Toast({ toastState }) {
  const { visible, message, type } = toastState;

  return (
    <div
      id="toast"
      className={`toast ${type === 'success' ? 'success' : ''} ${visible ? 'show' : ''}`}
      role="alert"
      aria-live="polite"
    >
      <svg className="icon icon-sm" viewBox="0 0 24 24">
        <polyline points="20 6 9 17 4 12"></polyline>
      </svg>
      <span>{message}</span>
    </div>
  );
}

export default Toast;
