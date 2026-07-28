import React, { useState } from 'react';
import Button from '../common/Button';

/**
 * Upload Modal Component for CSV Bulk Upload (Phase 5)
 */
export function UploadModal({ isOpen, onClose, onProcessBatch }) {
  const [isFileUploaded, setIsFileUploaded] = useState(false);

  if (!isOpen) return null;

  const handleFileClick = () => {
    setIsFileUploaded(true);
  };

  const handleProcess = () => {
    onProcessBatch(2000);
    setIsFileUploaded(false);
    onClose();
  };

  return (
    <div
      className="modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-upload-title"
      onClick={(e) => e.target.classList.contains('modal-overlay') && onClose()}
    >
      <div className="modal-content">
        <button
          className="modal-close"
          onClick={() => {
            setIsFileUploaded(false);
            onClose();
          }}
          aria-label="Cerrar"
        >
          <svg className="icon icon-sm" viewBox="0 0 24 24">
            <path d="M18 6L6 18M6 6l12 12"></path>
          </svg>
        </button>
        <h2
          id="modal-upload-title"
          className="section-title"
          style={{ marginBottom: '1rem', border: 'none', padding: 0 }}
        >
          <svg className="icon" viewBox="0 0 24 24">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
            <polyline points="14 2 14 8 20 8"></polyline>
            <line x1="12" y1="18" x2="12" y2="12"></line>
            <polyline points="9 15 12 12 15 15"></polyline>
          </svg>
          Importar Conocimiento (CSV)
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', marginBottom: '1rem' }}>
          Sube un archivo `.csv` con múltiples textos para clasificarlos por lotes. El modelo procesará cada fila de manera asíncrona.
        </p>

        <div
          className="upload-zone"
          tabIndex={0}
          role="button"
          aria-label="Zona de carga masiva de archivos CSV"
          onClick={handleFileClick}
        >
          <svg className="icon icon-lg" viewBox="0 0 24 24">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
            <polyline points="14 2 14 8 20 8"></polyline>
            <line x1="12" y1="18" x2="12" y2="12"></line>
            <polyline points="9 15 12 12 15 15"></polyline>
          </svg>
          <h3
            id="upload-text-main"
            style={{ color: '#0EA5E9', marginBottom: '0.5rem', fontSize: '1.1rem' }}
          >
            {isFileUploaded ? '📄 dataset_stackpulse_2000.csv cargado' : 'Arrastra tu archivo CSV aquí'}
          </h3>
          <p id="upload-text-sub" style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
            {isFileUploaded
              ? '2,000 filas listas para procesar por lotes asíncronos.'
              : 'o haz clic para seleccionar (ej: dataset_stackpulse.csv)'}
          </p>
        </div>

        <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'flex-end' }}>
          <Button
            variant="primary"
            onClick={handleProcess}
            disabled={!isFileUploaded}
            style={{ opacity: isFileUploaded ? 1 : 0.5 }}
          >
            Procesar Lote
          </Button>
        </div>
      </div>
    </div>
  );
}

export default UploadModal;
