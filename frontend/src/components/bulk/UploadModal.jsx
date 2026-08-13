import React, { useState, useRef } from 'react';
import Button from '../common/Button';
import { parseBatchFileContent } from '../../utils/fileParser';

/**
 * Upload Modal Component for CSV & JSON Bulk Upload (Sprint 3)
 */
export function UploadModal({ isOpen, onClose, onProcessBatch, isProcessingBatch = false }) {
  const [parsedTexts, setParsedTexts] = useState([]);
  const [fileName, setFileName] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [batchSummary, setBatchSummary] = useState(null);
  const fileInputRef = useRef(null);

  if (!isOpen) return null;

  const handleReset = () => {
    setParsedTexts([]);
    setFileName('');
    setErrorMessage('');
    setBatchSummary(null);
  };

  const handleClose = () => {
    handleReset();
    onClose();
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const { texts, error } = parseBatchFileContent(event.target.result, file.name);
      if (error) {
        setErrorMessage(error);
        setParsedTexts([]);
      } else {
        setParsedTexts(texts);
        setFileName(file.name);
        setErrorMessage('');
      }
    };
    reader.readAsText(file);
  };

  const handleLoadDemoDataset = () => {
    const demoTexts = [
      'Configuración de balanceadores de carga en Oracle Cloud Infrastructure (OCI) con SSL y balanceo por round-robin.',
      'Implementación de componentes funcionales en React 19 con hooks personalizados y optimización con useMemo.',
      'Diseño de arquitectura de microservicios con Spring Boot, Spring Data JPA y PostgreSQL en contenedores Docker.',
      'Automatización de pipelines CI/CD en GitHub Actions para despliegue continuo de contenedores en Kubernetes.',
      'Desarrollo de modelos de Machine Learning no supervisado con K-Means y vectorización TF-IDF en scikit-learn.',
      'Configuración de reverse proxy Nginx con balanceo de carga upstream y terminación segura TLS/SSL.'
    ];
    setParsedTexts(demoTexts);
    setFileName('dataset_tecnico_demo.json');
    setErrorMessage('');
  };

  const handleSubmitBatch = async () => {
    if (parsedTexts.length === 0) return;
    const summary = await onProcessBatch(parsedTexts);
    if (summary) {
      setBatchSummary(summary);
    }
  };

  return (
    <div
      className="modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-upload-title"
      onClick={(e) => e.target.classList.contains('modal-overlay') && handleClose()}
    >
      <div className="modal-content" style={{ maxWidth: '650px' }}>
        <button className="modal-close" onClick={handleClose} aria-label="Cerrar">
          <svg className="icon icon-sm" viewBox="0 0 24 24">
            <path d="M18 6L6 18M6 6l12 12"></path>
          </svg>
        </button>

        <h2 id="modal-upload-title" className="section-title" style={{ marginBottom: '0.8rem', border: 'none', padding: 0 }}>
          <svg className="icon" viewBox="0 0 24 24" style={{ color: 'var(--brand-primary)' }}>
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
            <polyline points="14 2 14 8 20 8"></polyline>
            <line x1="12" y1="18" x2="12" y2="12"></line>
            <polyline points="9 15 12 12 15 15"></polyline>
          </svg>
          Carga Masiva por Lotes (CSV / JSON)
        </h2>

        {!batchSummary ? (
          <>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1rem' }}>
              Sube un archivo <code>.csv</code> o <code>.json</code> con notas técnicas (mínimo 30 caracteres por nota). Se procesarán e indexarán en bloque en FastAPI y PostgreSQL.
            </p>

            <input
              type="file"
              ref={fileInputRef}
              style={{ display: 'none' }}
              accept=".csv,.json,.txt"
              onChange={handleFileChange}
            />

            <div
              className="upload-zone"
              tabIndex={0}
              role="button"
              aria-label="Zona de carga masiva de archivos"
              onClick={() => fileInputRef.current && fileInputRef.current.click()}
              style={{
                borderColor: parsedTexts.length > 0 ? 'var(--brand-primary)' : 'var(--border-color)',
                background: parsedTexts.length > 0 ? 'rgba(67, 24, 255, 0.04)' : undefined,
              }}
            >
              <svg className="icon icon-lg" viewBox="0 0 24 24" style={{ color: parsedTexts.length > 0 ? 'var(--brand-primary)' : 'var(--text-secondary)' }}>
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                <polyline points="14 2 14 8 20 8"></polyline>
                <line x1="12" y1="18" x2="12" y2="12"></line>
                <polyline points="9 15 12 12 15 15"></polyline>
              </svg>
              <h3 id="upload-text-main" style={{ color: 'var(--brand-primary)', marginBottom: '0.3rem', fontSize: '1.05rem' }}>
                {fileName ? fileName : 'Haz clic para seleccionar archivo CSV o JSON'}
              </h3>
              <p id="upload-text-sub" style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                {parsedTexts.length > 0
                  ? `${parsedTexts.length} notas tecnicas validas listas para clasificar.`
                  : 'Soporta archivos .csv, .json y .txt con codificacion UTF-8'}
              </p>
            </div>

            {errorMessage && (
              <p style={{ color: '#E11D48', fontSize: '0.85rem', marginTop: '0.5rem' }}>
                {errorMessage}
              </p>
            )}

            {parsedTexts.length > 0 && (
              <div style={{ marginTop: '1rem', background: 'var(--bg-app)', padding: '0.8rem', borderRadius: 'var(--radius-sm)' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                  VISTA PREVIA (Primeras {Math.min(parsedTexts.length, 3)} notas):
                </span>
                <ul style={{ margin: '0.4rem 0 0', paddingLeft: '1.2rem', fontSize: '0.8rem', color: 'var(--text-primary)' }}>
                  {parsedTexts.slice(0, 3).map((txt, i) => (
                    <li key={i} style={{ marginBottom: '4px' }}>
                      {txt.length > 80 ? txt.slice(0, 80) + '...' : txt}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <button
                type="button"
                className="btn-secondary"
                style={{ fontSize: '0.8rem', padding: '0.4rem 0.8rem' }}
                onClick={handleLoadDemoDataset}
              >
                Cargar dataset de ejemplo (6 notas)
              </button>

              <div style={{ display: 'flex', gap: '8px' }}>
                <Button variant="secondary" onClick={handleClose}>
                  Cancelar
                </Button>
                <Button
                  variant="primary"
                  onClick={handleSubmitBatch}
                  disabled={parsedTexts.length === 0 || isProcessingBatch}
                  isLoading={isProcessingBatch}
                >
                  {isProcessingBatch ? 'Procesando IA...' : `Procesar ${parsedTexts.length} notas`}
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div style={{ textAlign: 'center', padding: '1rem 0' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: '#E1FAEC', color: '#05CD99', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
              <svg className="icon icon-md" viewBox="0 0 24 24">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
            </div>
            <h3 style={{ fontSize: '1.2rem', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
              Lote procesado e indexado con éxito
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
              El microservicio de inferencia clasificó y guardó todas las notas en PostgreSQL.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
              <div style={{ background: 'var(--bg-app)', padding: '0.8rem', borderRadius: 'var(--radius-sm)' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>TOTAL PROCESADOS</span>
                <p style={{ fontSize: '1.2rem', fontWeight: 'bold', color: 'var(--brand-primary)', margin: '4px 0 0' }}>
                  {batchSummary.archivos_procesados || parsedTexts.length}
                </p>
              </div>
              <div style={{ background: 'var(--bg-app)', padding: '0.8rem', borderRadius: 'var(--radius-sm)' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>TIEMPO TOTAL</span>
                <p style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#0EA5E9', margin: '4px 0 0' }}>
                  {batchSummary.tiempo_total_ms ? `${batchSummary.tiempo_total_ms} ms` : '—'}
                </p>
              </div>
              <div style={{ background: 'var(--bg-app)', padding: '0.8rem', borderRadius: 'var(--radius-sm)' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>PROMEDIO POR NOTA</span>
                <p style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#05CD99', margin: '4px 0 0' }}>
                  {batchSummary.tiempo_promedio_por_texto_ms ? `${batchSummary.tiempo_promedio_por_texto_ms} ms` : '—'}
                </p>
              </div>
            </div>

            <Button variant="primary" onClick={handleClose}>
              Aceptar y Ver Dashboard
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

export default UploadModal;
