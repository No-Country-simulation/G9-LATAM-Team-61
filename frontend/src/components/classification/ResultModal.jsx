import React from 'react';
import Badge from '../common/Badge';
import Button from '../common/Button';

export function ResultModal({ isOpen, onClose, resultData }) {
  if (!isOpen || !resultData) return null;

  const { title, category, confidence, tags } = resultData;

  return (
    <div
      className="modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-result-title"
      onClick={(e) => e.target.classList.contains('modal-overlay') && onClose()}
    >
      <div className="modal-content" style={{ maxWidth: '500px' }}>
        <button className="modal-close" onClick={onClose} aria-label="Cerrar modal">
          <svg className="icon icon-sm" viewBox="0 0 24 24">
            <path d="M18 6L6 18M6 6l12 12"></path>
          </svg>
        </button>

        <h2
          id="modal-result-title"
          className="section-title"
          style={{ marginBottom: '1.5rem', border: 'none', padding: 0, color: 'var(--brand-secondary)' }}
        >
          <svg className="icon" viewBox="0 0 24 24">
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
          Documento Clasificado
        </h2>

        <div
          style={{
            background: '#F8FAFC',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-sm)',
            padding: '1.2rem',
            marginBottom: '1.5rem',
          }}
        >
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.3rem' }}>
            TÍTULO INFERIDO
          </p>
          <h3 id="res-title-text" style={{ fontSize: '1.1rem', color: 'var(--text-primary)', marginBottom: '1rem' }}>
            {title}
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
            <div>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.3rem' }}>
                CATEGORÍA PREDICHA
              </p>
              <div id="res-badge-container">
                <Badge category={category}>{category}</Badge>
              </div>
            </div>
            <div>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.3rem' }}>
                CONFIANZA (CONFIDENCE)
              </p>
              <p id="res-confidence" style={{ fontSize: '1.2rem', fontWeight: 'bold', color: 'var(--brand-primary)' }}>
                {confidence}
              </p>
            </div>
          </div>

          <div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.3rem' }}>
              PALABRAS CLAVE (TAGS TF-IDF)
            </p>
            <p id="res-tags" style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)' }}>
              {tags}
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Button variant="primary" onClick={onClose}>
            Aceptar y Ver en Historial
          </Button>
        </div>
      </div>
    </div>
  );
}

export default ResultModal;
