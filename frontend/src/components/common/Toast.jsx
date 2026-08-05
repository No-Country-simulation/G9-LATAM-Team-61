import React from 'react';

export function Toast({ toastState, onClose }) {
  const { visible, message, type } = toastState;

  return (
    <div
      id="toast"
      className={`toast ${type === 'success' ? 'success' : type === 'error' ? 'error' : ''} ${visible ? 'show' : ''}`}
      role="alert"
      aria-live="polite"
    >
      <svg className="icon icon-sm" viewBox="0 0 24 24" style={{ flexShrink: 0 }}>
        {type === 'success' ? (
          <polyline points="20 6 9 17 4 12"></polyline>
        ) : (
          <circle cx="12" cy="12" r="10"></circle>
        )}
      </svg>
      <span style={{ flex: 1, fontSize: '0.9rem' }}>{message}</span>
      <button
        type="button"
        onClick={onClose}
        style={{
          background: 'transparent',
          border: 'none',
          color: 'white',
          cursor: 'pointer',
          padding: '2px',
          display: 'flex',
          alignItems: 'center',
          opacity: 0.8,
        }}
        aria-label="Cerrar notificación"
      >
        <svg className="icon icon-sm" viewBox="0 0 24 24">
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      </button>
    </div>
  );
}

export default Toast;
