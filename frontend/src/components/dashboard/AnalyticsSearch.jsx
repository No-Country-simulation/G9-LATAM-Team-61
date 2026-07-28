import React from 'react';
import Card from '../common/Card';

export function AnalyticsSearch({ searchQuery, setSearchQuery, totalCount }) {
  return (
    <section id="sec-analisis">
      <h2 className="section-title">
        <svg className="icon" viewBox="0 0 24 24">
          <line x1="18" y1="20" x2="18" y2="10"></line>
          <line x1="12" y1="20" x2="12" y2="4"></line>
          <line x1="6" y1="20" x2="6" y2="14"></line>
        </svg>
        Analítica y Búsqueda
      </h2>

      {/* Global Search Container */}
      <div className="search-container">
        <svg className="icon icon-sm search-icon" viewBox="0 0 24 24">
          <circle cx="11" cy="11" r="8"></circle>
          <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
        </svg>
        <input
          id="global-search"
          type="text"
          placeholder="Buscar en historial por similitud semántica..."
          className="form-control search-input"
          aria-label="Búsqueda global"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Stats Grid */}
      <div className="stats-grid">
        <Card className="stat-card">
          <h3>Total Indexados</h3>
          <div id="stat-total" className="value">
            {totalCount.toLocaleString()}
          </div>
        </Card>
        <Card className="stat-card">
          <h3>Precisión IA</h3>
          <div className="value" style={{ color: '#05CD99' }}>
            94.2%
          </div>
        </Card>
        <Card className="stat-card">
          <h3>Tiempo Medio</h3>
          <div className="value" style={{ color: '#0EA5E9' }}>
            124 ms
          </div>
        </Card>
        <Card className="stat-card">
          <h3>Clusters</h3>
          <div className="value" style={{ color: 'var(--brand-primary)' }}>
            8 Grupos
          </div>
        </Card>
      </div>
    </section>
  );
}

export default AnalyticsSearch;
