import React from 'react';
import Badge from '../common/Badge';
import Card from '../common/Card';

/**
 * Recent Processed Documents Table Component (Últimos Procesados - Phase 4)
 */
export function RecentTable({ documents, searchQuery, onOpenHistory }) {
  const filteredDocs = documents.filter((doc) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      doc.title.toLowerCase().includes(q) ||
      doc.category.toLowerCase().includes(q) ||
      doc.tags.toLowerCase().includes(q)
    );
  });

  // Show top 3 recent documents in the dashboard card
  const recentDocs = filteredDocs.slice(0, 3);

  return (
    <div>
      <h2
        className="section-title"
        style={{ justifyContent: 'space-between', border: 'none', paddingBottom: '0.5rem' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <svg className="icon" viewBox="0 0 24 24">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
            <polyline points="14 2 14 8 20 8"></polyline>
            <line x1="16" y1="13" x2="8" y2="13"></line>
            <line x1="16" y1="17" x2="8" y2="17"></line>
            <polyline points="10 9 9 9 8 9"></polyline>
          </svg>
          Últimos Procesados
        </div>
        <button
          className="btn-secondary"
          style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', background: 'transparent', border: '1px solid var(--border-color)' }}
          onClick={onOpenHistory}
        >
          Ver todos
        </button>
      </h2>
      <Card style={{ padding: 0, overflow: 'hidden' }}>
        <table>
          <thead style={{ background: 'var(--bg-app)' }}>
            <tr>
              <th>TÍTULO</th>
              <th>CATEGORÍA</th>
              <th>TAGS (TF-IDF)</th>
            </tr>
          </thead>
          <tbody id="recent-tbody">
            {recentDocs.length > 0 ? (
              recentDocs.map((doc) => (
                <tr key={doc.id} className="fade-in">
                  <td style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{doc.title}</td>
                  <td>
                    <Badge category={doc.category}>{doc.category}</Badge>
                  </td>
                  <td style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{doc.tags}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="3" style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '2rem' }}>
                  No se encontraron documentos coincidentes
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Card>
    </div>
  );
}

export default RecentTable;
