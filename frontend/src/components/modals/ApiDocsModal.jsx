import React from 'react';

/**
 * REST API Documentation Modal Component (Updated Endpoint Paths)
 */
export function ApiDocsModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div
      className="modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-api-title"
      onClick={(e) => e.target.classList.contains('modal-overlay') && onClose()}
    >
      <div className="modal-content">
        <button className="modal-close" onClick={onClose} aria-label="Cerrar">
          <svg className="icon icon-sm" viewBox="0 0 24 24">
            <path d="M18 6L6 18M6 6l12 12"></path>
          </svg>
        </button>
        <h2
          id="modal-api-title"
          className="section-title"
          style={{ marginBottom: '2rem', border: 'none', padding: 0 }}
        >
          <svg className="icon" viewBox="0 0 24 24">
            <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path>
            <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path>
          </svg>
          Documentación API
        </h2>

        <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', color: 'var(--text-primary)' }}>
          Operaciones de Contenido
        </h3>
        <div className="api-endpoint">
          <span className="method-post">POST</span>
          <span className="api-path">/api/contenido</span>
          <span className="api-desc">Clasifica documento síncrono.</span>
        </div>
        <div className="api-endpoint">
          <span className="method-post">POST</span>
          <span className="api-path">/api/contenido/lote</span>
          <span className="api-desc">Carga masiva (CSV array).</span>
        </div>
        <div className="api-endpoint">
          <span className="method-post">POST</span>
          <span className="api-path">/api/contenido/agrupar</span>
          <span className="api-desc">Dispara Clustering (K-Means).</span>
        </div>

        <h3 style={{ fontSize: '1.1rem', marginTop: '2rem', marginBottom: '1rem', color: 'var(--text-primary)' }}>
          Búsquedas y Recomendaciones
        </h3>
        <div className="api-endpoint">
          <span className="method-get">GET</span>
          <span className="api-path">/api/buscar</span>
          <span className="api-desc">Búsqueda semántica inteligente.</span>
        </div>
        <div className="api-endpoint">
          <span className="method-get">GET</span>
          <span className="api-path">/api/contenido/{'{id}'}/recomendados</span>
          <span className="api-desc">Obtiene documentos similares.</span>
        </div>
        <div className="api-endpoint">
          <span className="method-get">GET</span>
          <span className="api-path">/api/categorias</span>
          <span className="api-desc">Lista 5 categorías estáticas.</span>
        </div>
      </div>
    </div>
  );
}

export default ApiDocsModal;
