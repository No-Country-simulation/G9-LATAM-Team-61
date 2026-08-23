import React, { useEffect, useState, useRef } from 'react';
import Card from '../common/Card';

export function AnalyticsSearch({
  searchQuery,
  setSearchQuery,
  onPerformSearch,
  isSearching = false,
  totalCount = 0,
  stats = null,
  clustersCount = 0,
  categories = [],
  selectedCategory = '',
  onSelectCategory = () => {},
}) {
  const [localQuery, setLocalQuery] = useState(searchQuery || '');
  const debounceTimerRef = useRef(null);

  // Sync external search query changes
  useEffect(() => {
    setLocalQuery(searchQuery || '');
  }, [searchQuery]);

  const handleInputChange = (e) => {
    const val = e.target.value;
    setLocalQuery(val);
    setSearchQuery(val);

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      if (onPerformSearch) {
        onPerformSearch(val);
      }
    }, 300);
  };

  const handleClear = () => {
    setLocalQuery('');
    setSearchQuery('');
    if (onPerformSearch) {
      onPerformSearch('');
    }
  };

  const precisionText = stats && typeof stats.confianzaPromedio === 'number' && stats.confianzaPromedio > 0
    ? `${(stats.confianzaPromedio * 100).toFixed(1)}%`
    : '—';

  const latenciaText = stats && typeof stats.latenciaPromedioMs === 'number' && stats.latenciaPromedioMs > 0
    ? `${Math.round(stats.latenciaPromedioMs)} ms`
    : '—';

  const totalIndexados = stats && stats.totalIndexados !== undefined
    ? stats.totalIndexados
    : (totalCount || 0);

  return (
    <section id="sec-analisis">
      <h2 className="section-title">
        <svg className="icon" viewBox="0 0 24 24">
          <line x1="18" y1="20" x2="18" y2="10"></line>
          <line x1="12" y1="20" x2="12" y2="4"></line>
          <line x1="6" y1="20" x2="6" y2="14"></line>
        </svg>
        Analítica y Búsqueda Semántica
      </h2>

      {/* Global Search Container */}
      <div className="search-container" style={{ position: 'relative' }}>
        <svg className={`icon icon-sm search-icon ${isSearching ? 'spin' : ''}`} viewBox="0 0 24 24">
          {isSearching ? (
            <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"></path>
          ) : (
            <>
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </>
          )}
        </svg>
        <input
          id="global-search"
          type="text"
          placeholder="Buscar en conocimiento por similitud semántica (ej: docker, spring, react)..."
          className="form-control search-input"
          aria-label="Búsqueda global"
          value={localQuery}
          onChange={handleInputChange}
          style={{ paddingRight: localQuery ? '2.5rem' : '1rem' }}
        />
        {localQuery && (
          <button
            type="button"
            onClick={handleClear}
            style={{
              position: 'absolute',
              right: '12px',
              top: '50%',
              transform: 'translateY(-50%)',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--text-secondary)',
              fontSize: '1rem',
              fontWeight: 'bold',
            }}
            aria-label="Limpiar búsqueda"
          >
            ✕
          </button>
        )}
      </div>

      {/* Category Filter Chips */}
      {categories && categories.length > 0 && (
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '0.6rem', marginBottom: '0.8rem' }}>
          <button
            type="button"
            onClick={() => onSelectCategory('')}
            style={{
              fontSize: '0.75rem',
              padding: '3px 10px',
              borderRadius: '12px',
              border: '1px solid var(--border-color)',
              background: selectedCategory === '' ? 'var(--brand-primary)' : 'var(--bg-card)',
              color: selectedCategory === '' ? '#FFFFFF' : 'var(--text-secondary)',
              cursor: 'pointer',
              fontWeight: 600,
            }}
          >
            Todas ({totalIndexados})
          </button>
          {categories.map((cat) => (
            <button
              key={cat.categoria}
              type="button"
              onClick={() => onSelectCategory(selectedCategory === cat.categoria ? '' : cat.categoria)}
              style={{
                fontSize: '0.75rem',
                padding: '3px 10px',
                borderRadius: '12px',
                border: '1px solid var(--border-color)',
                background: selectedCategory === cat.categoria ? 'var(--brand-primary)' : 'var(--bg-card)',
                color: selectedCategory === cat.categoria ? '#FFFFFF' : 'var(--text-secondary)',
                cursor: 'pointer',
                fontWeight: 600,
              }}
            >
              {cat.categoria} ({cat.total})
            </button>
          ))}
        </div>
      )}

      {/* Stats Grid */}
      <div className="stats-grid">
        <Card className="stat-card">
          <h3>Total Indexados</h3>
          <div id="stat-total" className="value">
            {totalIndexados.toLocaleString()}
          </div>
        </Card>
        <Card className="stat-card">
          <h3>Precisión Media</h3>
          <div className="value" style={{ color: '#05CD99' }}>
            {precisionText}
          </div>
        </Card>
        <Card className="stat-card">
          <h3>Latencia Media</h3>
          <div className="value" style={{ color: '#0EA5E9' }}>
            {latenciaText}
          </div>
        </Card>
        <Card className="stat-card">
          <h3>Clusters IA</h3>
          <div className="value" style={{ color: 'var(--brand-primary)' }}>
            {clustersCount} {clustersCount === 1 ? 'Grupo' : 'Grupos'}
          </div>
        </Card>
      </div>
    </section>
  );
}

export default AnalyticsSearch;
