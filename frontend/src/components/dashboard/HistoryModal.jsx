import React, { useState } from 'react';
import Badge from '../common/Badge';

/**
 * Full History Modal Component with Client-side Pagination (Phase 4)
 */
export function HistoryModal({
  isOpen,
  onClose,
  documents = [],
  historyError = null,
  onViewDetail,
  onViewRecommendations,
}) {
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const itemsPerPage = 8;

  if (!isOpen) return null;

  // Static Categories from SRS
  const CATEGORIES = [
    { id: 'ALL', label: 'Todas' },
    { id: 'DevOps', label: 'DevOps' },
    { id: 'Backend', label: 'Backend' },
    { id: 'Frontend', label: 'Frontend' },
    { id: 'Data Science', label: 'Data Science' },
    { id: 'Mobile', label: 'Mobile' },
    { id: 'Otros', label: 'Otros' },
  ];

  const filteredDocs = (documents || []).filter((doc) => {
    if (selectedCategory === 'ALL') return true;
    return doc.category && doc.category.toLowerCase() === selectedCategory.toLowerCase();
  });

  const totalPages = Math.ceil(filteredDocs.length / itemsPerPage) || 1;
  const currentDocs = filteredDocs.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handleCategoryChange = (catId) => {
    setSelectedCategory(catId);
    setCurrentPage(1);
  };

  return (
    <div
      className="modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-history-title"
      onClick={(e) => e.target.classList.contains('modal-overlay') && onClose()}
    >
      <div
        className="modal-content"
        style={{
          maxWidth: '1100px',
          width: '95%',
          maxHeight: '90vh',
          padding: '2.2rem',
          boxSizing: 'border-box',
        }}
      >
        <button className="modal-close" onClick={onClose} aria-label="Cerrar">
          <svg className="icon icon-sm" viewBox="0 0 24 24">
            <path d="M18 6L6 18M6 6l12 12"></path>
          </svg>
        </button>

        <h2
          id="modal-history-title"
          className="section-title"
          style={{ marginBottom: '1.2rem', border: 'none', padding: 0 }}
        >
          <svg className="icon" viewBox="0 0 24 24">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
            <polyline points="14 2 14 8 20 8"></polyline>
            <line x1="16" y1="13" x2="8" y2="13"></line>
            <line x1="16" y1="17" x2="8" y2="17"></line>
            <polyline points="10 9 9 9 8 9"></polyline>
          </svg>
          Historial de Documentos Procesados ({filteredDocs.length})
        </h2>

        {/* Filter categories pill bar */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '1.2rem' }}>
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              className={`page-btn ${selectedCategory === cat.id ? 'active' : ''}`}
              style={{ fontSize: '0.8rem', padding: '0.35rem 0.85rem' }}
              onClick={() => handleCategoryChange(cat.id)}
            >
              {cat.label}
            </button>
          ))}
        </div>

        <div
          style={{
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-sm)',
            overflowX: 'auto',
            background: 'var(--bg-card)',
          }}
        >
          <table style={{ width: '100%', minWidth: '850px', borderCollapse: 'collapse' }}>
            <thead style={{ background: 'var(--bg-app)' }}>
              <tr>
                <th style={{ textAlign: 'left', padding: '0.8rem 1rem' }}>EXTRACTO / CONTENIDO</th>
                <th style={{ textAlign: 'left', padding: '0.8rem 1rem', width: '130px' }}>CATEGORÍA</th>
                <th style={{ textAlign: 'left', padding: '0.8rem 1rem', width: '90px' }}>FECHA</th>
                <th style={{ textAlign: 'left', padding: '0.8rem 1rem', width: '160px' }}>PALABRAS CLAVE EXTRAÍDAS</th>
                <th style={{ textAlign: 'right', padding: '0.8rem 1.2rem', width: '160px' }}>ACCIÓN</th>
              </tr>
            </thead>
            <tbody id="modal-history-tbody">
              {historyError ? (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', color: 'var(--accent-red)', padding: '2rem' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                      <svg className="icon" viewBox="0 0 24 24" style={{ color: 'var(--accent-red)' }}>
                        <circle cx="12" cy="12" r="10"></circle>
                        <line x1="12" y1="8" x2="12" y2="12"></line>
                        <line x1="12" y1="16" x2="12.01" y2="16"></line>
                      </svg>
                      <span style={{ fontWeight: 600 }}>Error al cargar el historial:</span>
                      <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{historyError}</span>
                    </div>
                  </td>
                </tr>
              ) : currentDocs.length > 0 ? (
                currentDocs.map((doc) => (
                  <tr key={doc.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td
                      style={{
                        padding: '0.85rem 1rem',
                        color: 'var(--text-primary)',
                        fontWeight: 500,
                        maxWidth: '320px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                      title={doc.content || doc.title}
                    >
                      {doc.content
                        ? doc.content.length > 65
                          ? doc.content.slice(0, 65) + '...'
                          : doc.content
                        : doc.title}
                    </td>
                    <td style={{ padding: '0.85rem 1rem', whiteSpace: 'nowrap' }}>
                      <Badge category={doc.category}>{doc.category}</Badge>
                    </td>
                    <td
                      style={{
                        padding: '0.85rem 1rem',
                        color: 'var(--text-secondary)',
                        fontSize: '0.85rem',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {doc.date}
                    </td>
                    <td
                      style={{
                        padding: '0.85rem 1rem',
                        color: 'var(--text-secondary)',
                        fontSize: '0.85rem',
                        maxWidth: '220px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                      title={doc.tags}
                    >
                      {doc.tags || '—'}
                    </td>
                    <td style={{ padding: '0.85rem 1.2rem', textAlign: 'right', whiteSpace: 'nowrap' }}>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                        <button
                          type="button"
                          className="btn-secondary"
                          style={{
                            fontSize: '0.78rem',
                            padding: '4px 10px',
                            border: '1px solid var(--border-color)',
                            background: 'var(--bg-card)',
                          }}
                          onClick={() => {
                            onClose();
                            if (onViewDetail) onViewDetail(doc);
                          }}
                          title="Ver detalle completo de la nota"
                        >
                          Ver
                        </button>
                        <button
                          type="button"
                          className="btn-secondary"
                          style={{
                            fontSize: '0.78rem',
                            padding: '4px 10px',
                            border: '1px solid var(--border-color)',
                            background: 'var(--bg-card)',
                          }}
                          onClick={() => {
                            onClose();
                            if (onViewRecommendations) onViewRecommendations(doc);
                          }}
                          title="Ver documentos recomendados afines"
                        >
                          Similares
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan="5"
                    style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '2rem' }}
                  >
                    No hay documentos registrados aún en esta categoría.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="pagination">
          <button
            className="page-btn"
            disabled={currentPage === 1}
            onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
          >
            Anterior
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
            <button
              key={pageNum}
              className={`page-btn ${currentPage === pageNum ? 'active' : ''}`}
              onClick={() => setCurrentPage(pageNum)}
            >
              {pageNum}
            </button>
          ))}
          <button
            className="page-btn"
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
          >
            Siguiente
          </button>
        </div>
      </div>
    </div>
  );
}

export default HistoryModal;
