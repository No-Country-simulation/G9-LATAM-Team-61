import React, { useState, useEffect } from 'react';
import Header from './components/layout/Header';
import Toast from './components/common/Toast';
import DataInputForm from './components/classification/DataInputForm';
import ResultModal from './components/classification/ResultModal';
import AnalyticsSearch from './components/dashboard/AnalyticsSearch';
import RecentTable from './components/dashboard/RecentTable';
import HistoryModal from './components/dashboard/HistoryModal';

import { classifyContent, INITIAL_DOCUMENTS } from './services/kmsApi';
import './App.css';

export function App() {
  const [documents, setDocuments] = useState(INITIAL_DOCUMENTS);
  const [totalCount, setTotalCount] = useState(1204);
  const [searchQuery, setSearchQuery] = useState('');
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
      
      // Add new document to top of list & increment total count
      setDocuments((prev) => [result, ...prev]);
      setTotalCount((prev) => prev + 1);
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
        {/* Top Bar Header (Fase 1) */}
        <Header
          onOpenConfig={() => showToast('Modal de Configuración (Disponible en Fase 5)')}
          onOpenApiDocs={() => showToast('Modal de Docs API (Disponible en Fase 5)')}
        />

        {/* FILA 1: Top Grid completo (Fases 2 y 3) */}
        <div className="top-grid">
          <DataInputForm
            onClassify={handleClassify}
            onOpenUpload={() => showToast('Modal Carga CSV (Disponible en Fase 5)')}
            isProcessing={isProcessing}
          />

          <AnalyticsSearch
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            totalCount={totalCount}
          />
        </div>

        {/* FILA 2: Bottom Grid */}
        <section id="sec-resultados" className="bottom-grid">
          {/* Columna Izquierda: Tabla de Últimos Procesados (Fase 4) */}
          <RecentTable
            documents={documents}
            searchQuery={searchQuery}
            onOpenHistory={() => setActiveModal('history')}
          />

          {/* Columna Derecha: Ranura para Explorador de Clusters (Fase 5) */}
          <div className="card" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '220px', opacity: 0.7, borderStyle: 'dashed' }}>
            <p style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>[Fase 5: Explorador de Clusters K-Means & Modales]</p>
          </div>
        </section>
      </main>

      {/* Modal de Resultado de Clasificación (Fase 2) */}
      <ResultModal
        isOpen={activeModal === 'result'}
        onClose={() => setActiveModal(null)}
        resultData={resultData}
      />

      {/* Modal de Historial Completo Paginado (Fase 4) */}
      <HistoryModal
        isOpen={activeModal === 'history'}
        onClose={() => setActiveModal(null)}
        documents={documents}
      />
    </div>
  );
}

export default App;
