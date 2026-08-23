import React from 'react';

/**
 * REST API Documentation Modal Component (Clean, spacious vertical card layout)
 */
export function ApiDocsModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  const endpoints = [
    {
      method: 'POST',
      path: '/api/contenido',
      desc: 'Clasifica e indexa una nota técnica (30 a 5,000 caracteres) persistiendo en PostgreSQL y generando tags TF-IDF.',
      status: 'En Línea',
      category: 'Clasificación e Ingesta',
    },
    {
      method: 'POST',
      path: '/api/contenido/lote',
      desc: 'Procesamiento masivo por lotes desde archivos CSV, JSON o arreglos de texto hacia el microservicio FastAPI.',
      status: 'En Línea',
      category: 'Clasificación e Ingesta',
    },
    {
      method: 'POST',
      path: '/api/contenido/{id}/feedback',
      desc: 'Retroalimentación del usuario y corrección de categoría para reentrenamiento continuo del clasificador.',
      status: 'En Línea',
      category: 'Clasificación e Ingesta',
    },
    {
      method: 'GET',
      path: '/api/buscar?q={termino}',
      desc: 'Búsqueda semántica ponderada en tiempo real por similitud de contenido, títulos y palabras clave.',
      status: 'En Línea',
      category: 'Búsqueda, IA y Analítica',
    },
    {
      method: 'POST',
      path: '/api/contenido/agrupar',
      desc: 'Ejecuta agrupamiento no supervisado K-Means sobre todo el corpus para descubrir tendencias técnicas.',
      status: 'En Línea',
      category: 'Búsqueda, IA y Analítica',
    },
    {
      method: 'GET',
      path: '/api/contenido/{id}/recomendados',
      desc: 'Recomienda notas técnicas afines calculadas mediante superposición de etiquetas (Tag Overlap).',
      status: 'En Línea',
      category: 'Búsqueda, IA y Analítica',
    },
    {
      method: 'GET',
      path: '/api/categorias',
      desc: 'Retorna el catálogo dinámico de categorías disponibles con el conteo de notas en cada una.',
      status: 'En Línea',
      category: 'Búsqueda, IA y Analítica',
    },
    {
      method: 'GET',
      path: '/api/contenido/stats',
      desc: 'Calcula métricas agregadas del sistema: total indexados, precisión promedio y tiempos de latencia.',
      status: 'En Línea',
      category: 'Búsqueda, IA y Analítica',
    },
    {
      method: 'GET',
      path: '/api/health',
      desc: 'Chequeo de salud del sistema, conectividad a la base de datos PostgreSQL y servicio FastAPI.',
      status: 'En Línea',
      category: 'Monitoreo e Infraestructura',
    },
  ];

  return (
    <div
      className="modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-api-title"
      onClick={(e) => e.target.classList.contains('modal-overlay') && onClose()}
    >
      <div
        className="modal-content"
        style={{
          maxWidth: '780px',
          width: '92%',
          maxHeight: '88vh',
          overflowY: 'auto',
          padding: '2.5rem',
          boxSizing: 'border-box',
        }}
      >
        <button className="modal-close" onClick={onClose} aria-label="Cerrar">
          <svg className="icon icon-sm" viewBox="0 0 24 24">
            <path d="M18 6L6 18M6 6l12 12"></path>
          </svg>
        </button>

        <h2
          id="modal-api-title"
          className="section-title"
          style={{ marginBottom: '0.6rem', border: 'none', padding: 0 }}
        >
          <svg className="icon" viewBox="0 0 24 24" style={{ color: 'var(--brand-primary)' }}>
            <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path>
            <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path>
          </svg>
          Documentación de la API REST
        </h2>

        <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem', marginBottom: '1.8rem', lineHeight: '1.5' }}>
          Endpoints activos comunicando el Frontend con el Backend Spring Boot, el microservicio de inferencia FastAPI y PostgreSQL.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem', marginBottom: '2rem' }}>
          {endpoints.map((ep, idx) => (
            <div
              key={idx}
              style={{
                background: '#F8FAFC',
                border: '1px solid var(--border-color)',
                borderLeft: '4px solid #05CD99',
                borderRadius: '8px',
                padding: '1rem 1.25rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.4rem',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '8px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span
                    className={ep.method === 'POST' ? 'method-post' : 'method-get'}
                    style={{ padding: '0.25rem 0.65rem', borderRadius: '4px', fontSize: '0.8rem' }}
                  >
                    {ep.method}
                  </span>
                  <span
                    style={{
                      fontFamily: 'Consolas, Monaco, "Courier New", monospace',
                      fontSize: '0.95rem',
                      fontWeight: 600,
                      color: 'var(--text-primary)',
                    }}
                  >
                    {ep.path}
                  </span>
                </div>
                <span
                  style={{
                    color: '#05CD99',
                    fontWeight: 600,
                    fontSize: '0.75rem',
                    background: '#E1FAEC',
                    padding: '3px 10px',
                    borderRadius: '12px',
                  }}
                >
                  {ep.status}
                </span>
              </div>
              <p
                style={{
                  margin: 0,
                  fontSize: '0.88rem',
                  color: 'var(--text-secondary)',
                  lineHeight: '1.45',
                  paddingLeft: '2px',
                }}
              >
                {ep.desc}
              </p>
            </div>
          ))}
        </div>

        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            paddingTop: '1rem',
            borderTop: '1px solid var(--border-color)',
          }}
        >
          <button
            className="btn-primary"
            onClick={onClose}
            style={{ padding: '0.6rem 1.6rem', fontSize: '0.9rem' }}
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}

export default ApiDocsModal;
