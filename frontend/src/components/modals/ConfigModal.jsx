import React, { useState } from 'react';
import Button from '../common/Button';

/**
 * System Configuration Modal Component (Phase 5)
 */
export function ConfigModal({ isOpen, onClose, onSaveConfig }) {
  const [threshold, setThreshold] = useState(85);
  const [autoTags, setAutoTags] = useState(true);

  if (!isOpen) return null;

  const handleSave = () => {
    onSaveConfig({ threshold, autoTags });
    onClose();
  };

  return (
    <div
      className="modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-config-title"
      onClick={(e) => e.target.classList.contains('modal-overlay') && onClose()}
    >
      <div className="modal-content">
        <button className="modal-close" onClick={onClose} aria-label="Cerrar">
          <svg className="icon icon-sm" viewBox="0 0 24 24">
            <path d="M18 6L6 18M6 6l12 12"></path>
          </svg>
        </button>
        <h2
          id="modal-config-title"
          className="section-title"
          style={{ marginBottom: '2rem', border: 'none', padding: 0 }}
        >
          <svg className="icon" viewBox="0 0 24 24">
            <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"></path>
            <circle cx="12" cy="12" r="3"></circle>
          </svg>
          Configuraciones del Sistema
        </h2>

        <div
          className="form-group"
          style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}
        >
          <div>
            <label htmlFor="input-threshold">Umbral de Confianza</label>
            <p id="desc-threshold" style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
              Probabilidad mínima para auto-clasificar.
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <input
              id="input-threshold"
              type="range"
              min="50"
              max="99"
              value={threshold}
              style={{ width: '150px', accentColor: 'var(--brand-primary)' }}
              aria-describedby="desc-threshold"
              onChange={(e) => setThreshold(e.target.value)}
            />
            <span
              id="val-threshold"
              style={{
                background: '#F4F7FE',
                padding: '0.3rem 0.8rem',
                borderRadius: '0.2rem',
                fontWeight: 'bold',
                border: '1px solid var(--border-color)',
              }}
            >
              {threshold}%
            </span>
          </div>
        </div>

        <div
          className="form-group"
          style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}
        >
          <div>
            <label htmlFor="input-autotags">Auto-generar palabras clave</label>
            <p id="desc-autotags" style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
              Asigna palabras clave automáticamente.
            </p>
          </div>
          <label className="switch">
            <input
              id="input-autotags"
              type="checkbox"
              checked={autoTags}
              aria-describedby="desc-autotags"
              onChange={(e) => setAutoTags(e.target.checked)}
            />
            <span className="slider"></span>
          </label>
        </div>

        <div className="form-group">
          <label htmlFor="input-apiurl">Servidor Backend (Spring Boot API Gateway)</label>
          <input
            id="input-apiurl"
            type="text"
            className="form-control"
            value="http://localhost:8080/api"
            disabled
            style={{ opacity: 0.8, marginTop: '0.5rem', marginBottom: 0 }}
          />
        </div>

        <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'flex-end' }}>
          <Button variant="primary" onClick={handleSave}>
            Guardar Cambios
          </Button>
        </div>
      </div>
    </div>
  );
}

export default ConfigModal;
