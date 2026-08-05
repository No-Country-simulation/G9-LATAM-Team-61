import React, { useState } from 'react';
import Badge from '../common/Badge';

/**
 * Full History Modal Component with Client-side Pagination (Phase 4)
 */
export function HistoryModal({ isOpen, onClose, documents }) {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  if (!isOpen) return null;

  const totalPages = Math.ceil(documents.length / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentDocs = documents.slice(startIndex, startIndex + itemsPerPage);

  return (
    <div
      className="modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-history-title"
      onClick={(e) => e.target.classList.contains('modal-overlay') && onClose()}
    >
      <div className="modal-content" style={{ maxWidth: '900px', padding: '2rem' }}>
        <button className="modal-close" onClick={onClose} aria-label="Cerrar historial">
          <svg className="icon icon-sm" viewBox="0 0 24 24">
            <path d="M18 6L6 18M6 6l12 12"></path>
          </svg>
        </button>
        <h2
          id="modal-history-title"
          className="section-title"
          style={{ marginBottom: '1.5rem', border: 'none', padding: 0 }}
        >
          <svg className="icon" viewBox="0 0 24 24">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
            <polyline points="14 2 14 8 20 8"></polyline>
            <line x1="16" y1="13" x2="8" y2="13"></line>
            <line x1="16" y1="17" x2="8" y2="17"></line>
            <polyline points="10 9 9 9 8 9"></polyline>
          </svg>
          Historial Completo de Documentos
        </h2>

        <div style={{ border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', overflow: 'hidden' }}>
          <table>
            <thead style={{ background: 'var(--bg-app)' }}>
              <tr>
                <th>TÍTULO</th>
                <th>CATEGORÍA</th>
                <th>FECHA</th>
                <th>TAGS</th>
              </tr>
            </thead>
            <tbody id="modal-history-tbody">
              {currentDocs.map((doc) => (
                <tr key={doc.id}>
                  <td style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{doc.title}</td>
                  <td>
                    <Badge category={doc.category}>{doc.category}</Badge>
                  </td>
                  <td style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{doc.date}</td>
                  <td style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{doc.tags}</td>
                </tr>
              ))}
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
