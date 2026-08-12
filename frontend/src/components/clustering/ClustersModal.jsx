import React from 'react';

/**
 * Clusters Modal Component (8 K-Means Clusters Grid - Phase 5)
 */
export function ClustersModal({ isOpen, onClose, clusters }) {
  if (!isOpen) return null;

  return (
    <div
      className="modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-clusters-title"
      onClick={(e) => e.target.classList.contains('modal-overlay') && onClose()}
    >
      <div className="modal-content" style={{ maxWidth: '750px' }}>
        <button className="modal-close" onClick={onClose} aria-label="Cerrar grupos">
          <svg className="icon icon-sm" viewBox="0 0 24 24">
            <path d="M18 6L6 18M6 6l12 12"></path>
          </svg>
        </button>
        <h2
          id="modal-clusters-title"
          className="section-title"
          style={{ marginBottom: '1.2rem', border: 'none', padding: 0 }}
        >
          <svg className="icon" viewBox="0 0 24 24" style={{ color: 'var(--brand-primary)' }}>
            <circle cx="18" cy="5" r="3"></circle>
            <circle cx="6" cy="12" r="3"></circle>
            <circle cx="18" cy="19" r="3"></circle>
            <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line>
            <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line>
          </svg>
          Grupos de Tendencias ({clusters.length} Clusters K-Means)
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
          El algoritmo no supervisado K-Means en FastAPI agrupa el conocimiento por similitud semántica en vectores TF-IDF y etiqueta cada cluster con sus palabras clave principales.
        </p>

        {clusters && clusters.length > 0 ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
            {clusters.map((cluster) => (
              <div
                key={cluster.id}
                className="cluster-folder"
                style={{
                  marginBottom: 0,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                }}
              >
                <div>
                  <h4 style={{ color: 'var(--text-primary)', fontSize: '0.95rem', marginBottom: '4px' }}>
                    {cluster.title}
                  </h4>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', margin: '2px 0' }}>
                    <strong>{cluster.docsCount}</strong> {cluster.docsCount === 1 ? 'documento asignado' : 'documentos asignados'}
                  </p>
                  {cluster.tags && (
                    <p style={{ color: 'var(--brand-primary)', fontSize: '0.75rem', margin: 0, fontWeight: 500 }}>
                      Tags: {cluster.tags}
                    </p>
                  )}
                </div>
                <svg className="icon" viewBox="0 0 24 24" style={{ flexShrink: 0, color: 'var(--text-secondary)' }}>
                  <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
                </svg>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '2rem', background: 'var(--bg-app)', borderRadius: 'var(--radius-sm)' }}>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
              No hay clusters generados todavía. Haz clic en "Regenerar Grupos" en la pantalla principal.
            </p>
          </div>
        )}

        <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'flex-end' }}>
          <button className="btn-primary" onClick={onClose}>
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}

export default ClustersModal;
