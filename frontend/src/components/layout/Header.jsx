import React from 'react';

/**
 * Header Top Bar Component with API Connection Status Badge (Phase 6)
 */
export function Header({ onOpenConfig, onOpenApiDocs, isApiLive = false }) {
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

        <button
          className="btn-secondary"
          onClick={onOpenConfig}
          aria-label="Abrir Configuración"
        >
          <svg className="icon icon-sm" viewBox="0 0 24 24">
            <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"></path>
            <circle cx="12" cy="12" r="3"></circle>
          </svg>
          Configuración
        </button>
        <button
          className="btn-secondary"
          onClick={onOpenApiDocs}
          aria-label="Abrir Documentación API"
        >
          <svg className="icon icon-sm" viewBox="0 0 24 24">
            <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path>
            <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path>
          </svg>
          Docs API
        </button>
      </div>
    </div>
  );
}

export default Header;
