import React from 'react';

/**
 * Header Top Bar Component with API Connection Status Badge
 */
export function Header({ isApiLive = false }) {
  return (
    <div className="top-bar">
      <div className="logo">
        <svg className="icon" viewBox="0 0 24 24" style={{ color: 'var(--brand-primary)' }}>
          <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"></path>
        </svg>
        KMS - Centro de Conocimiento
      </div>

      <div className="header-actions" style={{ alignItems: 'center' }}>
        {/* Connection Status Badge */}
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '4px 10px',
            borderRadius: 'var(--radius-full)',
            fontSize: '0.75rem',
            fontWeight: 600,
            background: isApiLive ? '#E1FAEC' : '#FFF9E5',
            color: isApiLive ? '#05CD99' : '#D97706',
            border: `1px solid ${isApiLive ? '#A7F3D0' : '#FDE68A'}`,
          }}
        >
          <span
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: isApiLive ? '#05CD99' : '#D97706',
            }}
          ></span>
          <span>{isApiLive ? 'API: En Línea (Spring Boot)' : 'API: Modo Demo (Mocks)'}</span>
        </div>
      </div>
    </div>
  );
}

export default Header;
