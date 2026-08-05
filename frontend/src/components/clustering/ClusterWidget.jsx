import React from 'react';
import Card from '../common/Card';

/**
 * Cluster Widget Component (Tendencias K-Means - Phase 5)
 */
export function ClusterWidget({ clusters, isReclustering, onRecluster, onOpenClusters }) {
  const previewClusters = clusters.slice(0, 2);

  return (
    <div>
      <h2 className="section-title" style={{ justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <svg className="icon" viewBox="0 0 24 24">
            <circle cx="18" cy="5" r="3"></circle>
            <circle cx="6" cy="12" r="3"></circle>
            <circle cx="18" cy="19" r="3"></circle>
            <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line>
            <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line>
          </svg>
          Tendencias (K-Means) <span style={{ fontSize: '0.75rem', opacity: 0.7, color: 'var(--brand-primary)', marginLeft: '4px' }}>(Demo)</span>
        </div>
        <button
          id="btn-recluster"
          className="btn-secondary"
          style={{
            padding: '0.4rem 0.8rem',
            fontSize: '0.8rem',
            background: 'rgba(67, 24, 255, 0.1)',
            color: 'var(--brand-primary)',
          }}
          aria-label="Regenerar clusters"
          disabled={isReclustering}
          onClick={onRecluster}
        >
          <svg
            id="icon-recluster"
            className={`icon icon-sm ${isReclustering ? 'spin' : ''}`}
            viewBox="0 0 24 24"
          >
            <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"></path>
          </svg>
          <span id="txt-recluster">{isReclustering ? 'Calculando...' : 'Regenerar (Demo)'}</span>
        </button>
      </h2>
      <Card>
        {previewClusters.map((cluster) => (
          <div
            key={cluster.id}
            className="cluster-folder"
            tabIndex={0}
            role="button"
            onClick={onOpenClusters}
          >
            <div>
              <h4 style={{ color: 'var(--text-primary)', fontSize: '0.95rem' }}>{cluster.title}</h4>
              <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                {cluster.docsCount} documentos
              </span>
            </div>
            <svg className="icon" viewBox="0 0 24 24">
              <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
            </svg>
          </div>
        ))}

        <div
          className="cluster-folder"
          style={{
            background: 'transparent',
            border: '1px dashed var(--border-color)',
            justifyContent: 'center',
            marginBottom: 0,
          }}
          tabIndex={0}
          role="button"
          onClick={onOpenClusters}
        >
          <span style={{ color: 'var(--brand-primary)', fontSize: '0.9rem', fontWeight: 600 }}>
            Ver los grupos completos (Demo)
          </span>
        </div>
      </Card>
    </div>
  );
}

export default ClusterWidget;
