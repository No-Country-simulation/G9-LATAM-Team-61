import React, { useState } from 'react';
import Badge from '../common/Badge';

/**
 * Full History Modal Component with Client-side Pagination (Phase 4)
 */
export function HistoryModal({ isOpen, onClose, documents, onViewRecommendations }) {
  const [currentPage, setCurrentPage] = useState(1);
  const [filterCategory, setFilterCategory] = useState('');
  const itemsPerPage = 6;

  if (!isOpen) return null;

  const filteredDocs = filterCategory
    ? (documents || []).filter((d) => d.category && d.category.toLowerCase() === filterCategory.toLowerCase())
    : (documents || []);

  const totalPages = Math.ceil(filteredDocs.length / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentDocs = filteredDocs.slice(startIndex, startIndex + itemsPerPage);

  const categories = ['DevOps', 'Backend', 'Frontend', 'Data Science', 'Mobile', 'Otros'];

  return (
    <div
      className="modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-history-title"
      onClick={(e) => e.target.classList.contains('modal-overlay') && onClose()}
    >
      <div className="modal-content" style={{ maxWidth: '920px', padding: '2rem' }}>
        <button className="modal-close" onClick={onClose} aria-label="Cerrar historial">
          <svg className="icon icon-sm" viewBox="0 0 24 24">
            <path d="M18 6L6 18M6 6l12 12"></path>
          </svg>
        </button>
        <h2
          id="modal-history-title"
          className="section-title"
          style={{ marginBottom: '1rem', border: 'none', padding: 0 }}
        >
          <svg className="icon" viewBox="0 0 24 24">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
            <polyline points="14 2 14 8 20 8"></polyline>
            <line x1="16" y1="13" x2="8" y2="13"></line>
            <line x1="16" y1="17" x2="8" y2="17"></line>
            <polyline points="10 9 9 9 8 9"></polyline>
          </svg>
          Historial Completo de Documentos ({filteredDocs.length})
        </h2>

        {/* Filter Badges in Modal */}
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '1rem' }}>
          <button
            type="button"
            onClick={() => { setFilterCategory(''); setCurrentPage(1); }}
            style={{
              fontSize: '0.75rem',
              padding: '3px 10px',
              borderRadius: '12px',
              border: '1px solid var(--border-color)',
              background: filterCategory === '' ? 'var(--brand-primary)' : 'var(--bg-app)',
              color: filterCategory === '' ? '#FFFFFF' : 'var(--text-secondary)',
              cursor: 'pointer',
              fontWeight: 600,
            }}
          >
            Todas ({documents.length})
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => { setFilterCategory(filterCategory === cat ? '' : cat); setCurrentPage(1); }}
              style={{
                fontSize: '0.75rem',
                padding: '3px 10px',
                borderRadius: '12px',
                border: '1px solid var(--border-color)',
                background: filterCategory === cat ? 'var(--brand-primary)' : 'var(--bg-app)',
                color: filterCategory === cat ? '#FFFFFF' : 'var(--text-secondary)',
                cursor: 'pointer',
                fontWeight: 600,
              }}
            >
              {cat}
            </button>
          ))}
        </div>

        <div style={{ border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', overflow: 'hidden' }}>
          <table>
            <thead style={{ background: 'var(--bg-app)' }}>
              <tr>
                <th>EXTRACTO / CONTENIDO</th>
                <th>CATEGORÍA</th>
                <th>FECHA</th>
                <th>TAGS</th>
                <th style={{ textAlign: 'right', paddingRight: '1rem' }}>ACCIÓN</th>
              </tr>
            </thead>
            <tbody id="modal-history-tbody">
              {currentDocs.length > 0 ? (
                currentDocs.map((doc) => (
                  <tr key={doc.id}>
                    <td style={{ color: 'var(--text-primary)', fontWeight: 500, maxWidth: '280px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={doc.content || doc.title}>
                      {doc.content ? (doc.content.length > 60 ? doc.content.slice(0, 60) + '...' : doc.content) : doc.title}
                    </td>
                    <td>
                      <Badge category={doc.category}>{doc.category}</Badge>
                    </td>
                    <td style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{doc.date}</td>
                    <td style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{doc.tags}</td>
                    <td style={{ textAlign: 'right', paddingRight: '1rem' }}>
                      <button
                        type="button"
                        className="btn-secondary"
                        style={{ fontSize: '0.75rem', padding: '3px 8px', border: '1px solid var(--border-color)', background: 'var(--bg-card)' }}
                        onClick={() => {
                          onClose();
                          if (onViewRecommendations) onViewRecommendations(doc);
                        }}
                        title="Ver documentos recomendados afines"
                      >
                        Similares
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '2rem' }}>
                    No hay documentos en esta categoría.
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
