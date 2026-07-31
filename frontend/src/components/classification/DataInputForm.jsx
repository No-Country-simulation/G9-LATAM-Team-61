import React, { useState } from 'react';
import Card from '../common/Card';
import Button from '../common/Button';

export function DataInputForm({ onClassify, onOpenUpload, isProcessing }) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [charError, setCharError] = useState('');

  const MAX_CHARS = 10000;

  const handleContentChange = (e) => {
    const val = e.target.value;
    setContent(val);
    if (val.length > MAX_CHARS) {
      setCharError(`Excede el límite máximo de ${MAX_CHARS.toLocaleString()} caracteres (${val.length.toLocaleString()})`);
    } else {
      setCharError('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!content.trim()) {
      onClassify(null);
      return;
    }

    if (content.length > MAX_CHARS) {
      setCharError(`No se puede enviar: Excede los ${MAX_CHARS.toLocaleString()} caracteres.`);
      return;
    }

    // Call onClassify and only clear text inputs if classification succeeds!
    const success = await onClassify({ title, content });
    if (success) {
      setTitle('');
      setContent('');
      setCharError('');
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
            <label htmlFor="doc-title">Título (Opcional)</label>
            <input
              id="doc-title"
              type="text"
              className="form-control"
              placeholder="Ej: Configuración Nginx"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div className="form-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label htmlFor="doc-content">Contenido Crudo *</label>
              <span style={{ fontSize: '0.75rem', color: content.length > MAX_CHARS ? '#E11D48' : 'var(--text-secondary)' }}>
                {content.length.toLocaleString()} / {MAX_CHARS.toLocaleString()}
              </span>
            </div>
            <textarea
              id="doc-content"
              className="form-control"
              rows="4"
              placeholder="Pega la documentación o logs aquí..."
              value={content}
              onChange={handleContentChange}
              style={{
                borderColor: charError ? '#E11D48' : undefined,
              }}
            ></textarea>
            {charError && (
              <span style={{ fontSize: '0.8rem', color: '#E11D48', marginTop: '0.3rem', display: 'block' }}>
                ⚠️ {charError}
              </span>
            )}
          </div>

          <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
            <Button
              type="submit"
              variant="primary"
              style={{ flex: 2 }}
              isLoading={isProcessing}
              disabled={Boolean(charError)}
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
              CSV Lotes (Demo)
            </Button>
          </div>
        </form>
      </Card>
    </section>
  );
}

export default DataInputForm;
