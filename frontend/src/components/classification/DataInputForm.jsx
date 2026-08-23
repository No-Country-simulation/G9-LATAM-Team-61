import React, { useState } from 'react';
import Card from '../common/Card';
import Button from '../common/Button';

export function DataInputForm({ onClassify, onOpenUpload, isProcessing }) {
  const [content, setContent] = useState('');
  const [validationError, setValidationError] = useState('');

  const MIN_CHARS = 30;
  const MAX_CHARS = 5000;

  const handleContentChange = (e) => {
    const val = e.target.value;
    setContent(val);
    
    if (val.length > 0 && val.length < MIN_CHARS) {
      setValidationError(`El contenido debe tener al menos ${MIN_CHARS} caracteres (actual: ${val.length}).`);
    } else if (val.length > MAX_CHARS) {
      setValidationError(`Excede el límite máximo de ${MAX_CHARS.toLocaleString()} caracteres (${val.length.toLocaleString()}).`);
    } else {
      setValidationError('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const trimmedContent = content.trim();

    if (!trimmedContent) {
      setValidationError('Por favor ingresa el contenido técnico a clasificar.');
      return;
    }

    if (trimmedContent.length < MIN_CHARS) {
      setValidationError(`El contenido debe tener al menos ${MIN_CHARS} caracteres (actual: ${trimmedContent.length}).`);
      return;
    }

    if (trimmedContent.length > MAX_CHARS) {
      setValidationError(`No se puede enviar: Excede los ${MAX_CHARS.toLocaleString()} caracteres.`);
      return;
    }

    setValidationError('');

    // Call onClassify and ONLY clear inputs if classification succeeds!
    const success = await onClassify({ content: trimmedContent });
    if (success) {
      setContent('');
      setValidationError('');
    }
  };

  return (
    <section id="sec-inicio">
      <h2 className="section-title">
        <svg className="icon" viewBox="0 0 24 24">
          <polyline points="22 12 16 12 14 15 10 15 8 12 2 12"></polyline>
          <path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"></path>
        </svg>
        Ingreso de Datos
      </h2>
      <Card>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label htmlFor="doc-content">Contenido Técnico (30 a 5,000 caracteres) *</label>
              <span
                style={{
                  fontSize: '0.75rem',
                  color: content.length > 0 && (content.length < MIN_CHARS || content.length > MAX_CHARS)
                    ? '#E11D48'
                    : 'var(--text-secondary)',
                }}
              >
                {content.length.toLocaleString()} / {MAX_CHARS.toLocaleString()}
              </span>
            </div>
            <textarea
              id="doc-content"
              className="form-control"
              rows="5"
              placeholder="Pega la documentación técnica, logs o consultas aquí (mínimo 30 y máximo 5,000 caracteres)..."
              value={content}
              onChange={handleContentChange}
              style={{
                borderColor: validationError ? '#E11D48' : undefined,
              }}
            ></textarea>
            {validationError && (
              <span style={{ fontSize: '0.8rem', color: '#E11D48', marginTop: '0.3rem', display: 'block' }}>
                {validationError}
              </span>
            )}
          </div>

          <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
            <Button
              type="submit"
              variant="primary"
              style={{ flex: 2 }}
              isLoading={isProcessing}
              disabled={Boolean(validationError) || content.trim().length < MIN_CHARS}
            >
              <svg className="icon icon-sm" viewBox="0 0 24 24">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
              <span>{isProcessing ? 'Procesando IA...' : 'Clasificar'}</span>
            </Button>
            <Button
              type="button"
              variant="secondary"
              style={{ flex: 1, border: '1px solid var(--border-color)', background: 'var(--bg-surface)' }}
              onClick={onOpenUpload}
              aria-label="Carga Masiva CSV"
            >
              <svg className="icon icon-sm" viewBox="0 0 24 24">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                <polyline points="14 2 14 8 20 8"></polyline>
                <line x1="12" y1="18" x2="12" y2="12"></line>
                <polyline points="9 15 12 12 15 15"></polyline>
              </svg>
              CSV / Lotes
            </Button>
          </div>
        </form>
      </Card>
    </section>
  );
}

export default DataInputForm;
