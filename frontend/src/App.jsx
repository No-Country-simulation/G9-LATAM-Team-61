import React, { useState, useEffect } from 'react';
import Header from './components/layout/Header';
import Toast from './components/common/Toast';
import DataInputForm from './components/classification/DataInputForm';
import ResultModal from './components/classification/ResultModal';

import { classifyContent } from './services/kmsApi';
import './App.css';

export function App() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeModal, setActiveModal] = useState(null);
  const [resultData, setResultData] = useState(null);

  const [toastState, setToastState] = useState({
    visible: false,
    message: '',
    type: 'info',
  });

  // ESC key listener to close modals
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && activeModal) {
        setActiveModal(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeModal]);

  const showToast = (message, type = 'info') => {
    setToastState({ visible: true, message, type });
    setTimeout(() => {
      setToastState((prev) => ({ ...prev, visible: false }));
    }, 3000);
  };

  const handleClassify = async (formData) => {
    if (!formData || !formData.content) {
      showToast('Por favor ingresa al menos el contenido crudo a clasificar');
      return;
    }

    setIsProcessing(true);

    try {
      const result = await classifyContent(formData);
      setIsProcessing(false);
      setResultData(result);
      setActiveModal('result');
      showToast('¡Documento clasificado e indexado exitosamente!', 'success');
    } catch (error) {
      setIsProcessing(false);
      showToast('Error en la clasificación del contenido', 'error');
    }
  };

  return (
    <div className="main-content-wrapper" style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
      {/* Toast Notification Banner */}
      <Toast toastState={toastState} />

      <main className="main-content">
        {/* Top Bar Header (Phase 1) */}
        <Header
          onOpenConfig={() => showToast('Modal de Configuración (Disponible en Fase 5)')}
          onOpenApiDocs={() => showToast('Modal de Docs API (Disponible en Fase 5)')}
        />

        {/* FILA 1: Top Grid */}
        <div className="top-grid">
          {/* Columna Izquierda: Formulario de Clasificación (Fase 2) */}
          <DataInputForm
            onClassify={handleClassify}
            onOpenUpload={() => showToast('Modal Carga CSV (Disponible en Fase 5)')}
            isProcessing={isProcessing}
          />

          {/* Columna Derecha: Ranura para Analítica y Búsqueda (Fase 3) */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', minHeight: '260px', opacity: 0.7, borderStyle: 'dashed' }}>
            <p style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>[Fase 3: Módulo de Analítica y Búsqueda Semántica]</p>
          </div>
        </div>

        {/* FILA 2: Bottom Grid (Fases 4 y 5) */}
        <section id="sec-resultados" className="bottom-grid">
          <div className="card" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '220px', opacity: 0.7, borderStyle: 'dashed' }}>
            <p style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>[Fase 4: Tabla de Últimos Procesados e Historial Paginado]</p>
          </div>
          <div className="card" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '220px', opacity: 0.7, borderStyle: 'dashed' }}>
            <p style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>[Fase 5: Explorador de Clusters K-Means]</p>
          </div>
        </section>
      </main>

      {/* Modal de Resultado de Clasificación (Fase 2) */}
      <ResultModal
        isOpen={activeModal === 'result'}
        onClose={() => setActiveModal(null)}
        resultData={resultData}
      />
    </div>
  );
}

export default App;
