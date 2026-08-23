import React from 'react';
import Badge from '../common/Badge';
import Button from '../common/Button';

export function RecommendedModal({ isOpen, onClose, baseDocument, recommendations, isLoading }) {
  if (!isOpen) return null;

  return (
    <div
      className="modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-recommended-title"
      onClick={(e) => e.target.classList.contains('modal-overlay') && onClose()}
    >
      <div className="modal-content" style={{ maxWidth: '750px', padding: '2rem' }}>
        <button className="modal-close" onClick={onClose} aria-label="Cerrar modal">
          <svg className="icon icon-sm" viewBox="0 0 24 24">
            <path d="M18 6L6 18M6 6l12 12"></path>
          </svg>
        </button>

        <h2
          id="modal-recommended-title"
          className="section-title"
          style={{ marginBottom: '0.8rem', border: 'none', padding: 0 }}
        >
          <svg className="icon" viewBox="0 0 24 24" style={{ color: '#0EA5E9' }}>
            <circle cx="12" cy="12" r="10"></circle>
            <polyline points="12 6 12 12 14 14"></polyline>
          </svg>
          Documentos Recomendados y Afines
        </h2>

        {baseDocument && (
          <div
            style={{
              background: 'var(--bg-app)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-sm)',
              padding: '0.8rem 1rem',
              marginBottom: '1.2rem',
            }}
          >
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
              DOCUMENTO BASE:
            </span>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-primary)', marginTop: '2px', fontStyle: 'italic' }}>
              "{baseDocument.content ? (baseDocument.content.length > 120 ? baseDocument.content.slice(0, 120) + '...' : baseDocument.content) : baseDocument.title}"
            </p>
            <div style={{ display: 'flex', gap: '8px', marginTop: '6px', alignItems: 'center' }}>
              <Badge category={baseDocument.category}>{baseDocument.category}</Badge>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                Tags: <strong>{baseDocument.tags}</strong>
              </span>
            </div>
          </div>
        )}

        <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '1rem' }}>
          Basado en coincidencia semántica de palabras clave (Tag Overlap) extraídas por el vectorizador IA:
        </p>

        {isLoading ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
            <svg className="icon icon-lg spin" viewBox="0 0 24 24" style={{ margin: '0 auto 0.5rem', display: 'block', color: 'var(--brand-primary)' }}>
              <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"></path>
            </svg>
            Buscando notas afines en PostgreSQL...
          </div>
        ) : recommendations && recommendations.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
            {recommendations.map((rec, idx) => (
              <div
                key={rec.id || idx}
                style={{
                  background: '#FFFFFF',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '0.9rem',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  gap: '1rem',
                }}
              >
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <Badge category={rec.category}>{rec.category}</Badge>
                    <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#05CD99' }}>
                      Confianza: {rec.confidence || rec.similarity || '85.0%'}
                    </span>
                  </div>
                  <p style={{ fontSize: '0.9rem', color: 'var(--text-primary)', margin: '4px 0', lineHeight: '1.4' }}>
                    {rec.content ? (rec.content.length > 150 ? rec.content.slice(0, 150) + '...' : rec.content) : rec.title}
                  </p>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0 }}>
                    Tags: <strong style={{ color: 'var(--text-primary)' }}>{rec.tags}</strong>
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '2rem', background: 'var(--bg-app)', borderRadius: 'var(--radius-sm)' }}>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
              No se encontraron notas con tags compartidos suficientes en esta categoría.
            </p>
          </div>
        )}

        <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'flex-end' }}>
          <Button variant="primary" onClick={onClose}>
            Cerrar
          </Button>
        </div>
      </div>
    </div>
  );
}

export default RecommendedModal;
