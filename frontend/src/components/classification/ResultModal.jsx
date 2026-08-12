import React, { useState } from 'react';
import Badge from '../common/Badge';
import Button from '../common/Button';

export function ResultModal({ isOpen, onClose, resultData, onSendFeedback, isSendingFeedback = false }) {
  const [feedbackSent, setFeedbackSent] = useState(false);
  const [selectedCorrection, setSelectedCorrection] = useState('');
  const [showCorrectionSelect, setShowCorrectionSelect] = useState(false);

  if (!isOpen || !resultData) return null;

  const { id, title, category, confidence, tags } = resultData;

  const handleConfirmCorrect = async () => {
    if (onSendFeedback && id) {
      await onSendFeedback(id, category, 'Categoría confirmada por el usuario como correcta.');
      setFeedbackSent(true);
    }
  };

  const handleCorrectionSubmit = async () => {
    if (!selectedCorrection) return;
    if (onSendFeedback && id) {
      await onSendFeedback(id, selectedCorrection, `Categoría corregida manualmente de ${category} a ${selectedCorrection}`);
      setFeedbackSent(true);
    }
  };

  return (
    <div
      className="modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-result-title"
      onClick={(e) => e.target.classList.contains('modal-overlay') && onClose()}
    >
      <div className="modal-content" style={{ maxWidth: '520px' }}>
        <button className="modal-close" onClick={onClose} aria-label="Cerrar modal">
          <svg className="icon icon-sm" viewBox="0 0 24 24">
            <path d="M18 6L6 18M6 6l12 12"></path>
          </svg>
        </button>

        <h2
          id="modal-result-title"
          className="section-title"
          style={{ marginBottom: '1.2rem', border: 'none', padding: 0, color: 'var(--brand-secondary)' }}
        >
          <svg className="icon" viewBox="0 0 24 24">
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
          Documento Clasificado
        </h2>

        <div
          style={{
            background: '#F8FAFC',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-sm)',
            padding: '1.2rem',
            marginBottom: '1.2rem',
          }}
        >
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.3rem' }}>
            CONTENIDO ANALIZADO
          </p>
          <p id="res-content-text" style={{ fontSize: '0.95rem', color: 'var(--text-primary)', marginBottom: '1rem', lineHeight: '1.4', background: 'var(--bg-app)', padding: '0.6rem', borderRadius: '4px' }}>
            {resultData.content ? (resultData.content.length > 180 ? resultData.content.slice(0, 180) + '...' : resultData.content) : title}
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
            <div>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.3rem' }}>
                CATEGORÍA PREDICHA
              </p>
              <div id="res-badge-container">
                <Badge category={category}>{category}</Badge>
              </div>
            </div>
            <div>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.3rem' }}>
                CONFIANZA (CONFIDENCE)
              </p>
              <p id="res-confidence" style={{ fontSize: '1.2rem', fontWeight: 'bold', color: 'var(--brand-primary)' }}>
                {confidence}
              </p>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: resultData.latencyMs ? '2fr 1fr' : '1fr', gap: '1rem' }}>
            <div>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.3rem' }}>
                PALABRAS CLAVE (TAGS TF-IDF)
              </p>
              <p id="res-tags" style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                {tags}
              </p>
            </div>
            {resultData.latencyMs && (
              <div>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.3rem' }}>
                  LATENCIA IA
                </p>
                <p style={{ fontSize: '0.95rem', fontWeight: 600, color: '#0EA5E9' }}>
                  {typeof resultData.latencyMs === 'number' ? `${resultData.latencyMs.toFixed(1)} ms` : resultData.latencyMs}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Feedback Section */}
        <div
          style={{
            background: 'var(--bg-app)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-sm)',
            padding: '0.9rem 1.1rem',
            marginBottom: '1.2rem',
          }}
        >
          <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '0.5rem' }}>
            FEEDBACK DEL MODELO: ¿La clasificación fue correcta?
          </span>

          {feedbackSent ? (
            <p style={{ color: '#05CD99', fontSize: '0.85rem', fontWeight: 600, margin: 0 }}>
              Gracias: Tu retroalimentación fue registrada en la base de datos para reentrenamiento.
            </p>
          ) : !showCorrectionSelect ? (
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                type="button"
                className="btn-secondary"
                style={{ fontSize: '0.8rem', padding: '0.4rem 0.8rem', background: '#E1FAEC', color: '#05CD99', border: '1px solid #A7F3D0' }}
                onClick={handleConfirmCorrect}
                disabled={isSendingFeedback}
              >
                Si, es correcta
              </button>
              <button
                type="button"
                className="btn-secondary"
                style={{ fontSize: '0.8rem', padding: '0.4rem 0.8rem', border: '1px solid var(--border-color)' }}
                onClick={() => setShowCorrectionSelect(true)}
              >
                Cambiar categoría
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginTop: '4px' }}>
              <select
                className="form-control"
                style={{ fontSize: '0.85rem', padding: '0.4rem' }}
                value={selectedCorrection}
                onChange={(e) => setSelectedCorrection(e.target.value)}
              >
                <option value="">Selecciona categoría correcta...</option>
                <option value="DevOps">DevOps</option>
                <option value="Backend">Backend</option>
                <option value="Frontend">Frontend</option>
                <option value="Data Science">Data Science</option>
                <option value="Mobile">Mobile</option>
                <option value="Otros">Otros</option>
              </select>
              <button
                type="button"
                className="btn-primary"
                style={{ fontSize: '0.8rem', padding: '0.4rem 0.8rem', whiteSpace: 'nowrap' }}
                onClick={handleCorrectionSubmit}
                disabled={!selectedCorrection || isSendingFeedback}
              >
                {isSendingFeedback ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          )}
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Button variant="primary" onClick={onClose}>
            Aceptar y Ver en Historial
          </Button>
        </div>
      </div>
    </div>
  );
}

export default ResultModal;
