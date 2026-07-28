import React from 'react';

export function Button({
  children,
  variant = 'primary',
  isLoading = false,
  disabled = false,
  onClick,
  type = 'button',
  style = {},
  className = '',
}) {
  const btnClass = variant === 'secondary' ? 'btn-secondary' : 'btn-primary';

  return (
    <button
      type={type}
      className={`${btnClass} ${className}`}
      onClick={onClick}
      disabled={disabled || isLoading}
      style={style}
    >
      {isLoading ? (
        <svg className="icon icon-sm spin" viewBox="0 0 24 24">
          <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"></path>
        </svg>
      ) : null}
      {children}
    </button>
  );
}

export default Button;
