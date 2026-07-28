import React, { useState, useEffect } from 'react';
import Header from './components/layout/Header';
import Toast from './components/common/Toast';
import DataInputForm from './components/classification/DataInputForm';
import ResultModal from './components/classification/ResultModal';
import AnalyticsSearch from './components/dashboard/AnalyticsSearch';
import RecentTable from './components/dashboard/RecentTable';
import HistoryModal from './components/dashboard/HistoryModal';
import ClusterWidget from './components/clustering/ClusterWidget';
import ClustersModal from './components/clustering/ClustersModal';
import UploadModal from './components/bulk/UploadModal';
import ConfigModal from './components/modals/ConfigModal';
import ApiDocsModal from './components/modals/ApiDocsModal';

import { classifyContent, INITIAL_DOCUMENTS, INITIAL_CLUSTERS } from './services/kmsApi';
import './App.css';

export function App() {
  const [documents, setDocuments] = useState(INITIAL_DOCUMENTS);
  const [clusters] = useState(INITIAL_CLUSTERS);
  const [totalCount, setTotalCount] = useState(1204);
  const [searchQuery, setSearchQuery] = useState('');

  const [isProcessing, setIsProcessing] = useState(false);
  const [isReclustering, setIsReclustering] = useState(false);

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

  const handleRecluster = () => {
    setIsReclustering(true);
    setTimeout(() => {
      setIsReclustering(false);
      showToast('Algoritmo K-Means re-ejecutado. 8 Clusters actualizados.', 'success');
    }, 1200);
  };

  const handleProcessBatch = (count = 2000) => {
    showToast(`Lote de ${count.toLocaleString()} registros enviado a FastAPI. Procesando en segundo plano...`, 'success');
    setTimeout(() => {
      setTotalCount((prev) => prev + count);
    }, 1000);
  };

  const handleSaveConfig = () => {
    showToast('Configuraciones guardadas correctamente', 'success');
  };

  return (
    <div className="main-content-wrapper" style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
      {/* Toast Notification Banner */}
      <Toast toastState={toastState} />

      <main className="main-content">
        {/* Top Bar Header (Fase 1 + Fase 5 modal triggers) */}
        <Header
          onOpenConfig={() => setActiveModal('config')}
          onOpenApiDocs={() => setActiveModal('api')}
        />

        {/* FILA 1: Top Grid completo (Fases 2 y 3) */}
        <div className="top-grid">
          <DataInputForm
            onClassify={handleClassify}
            onOpenUpload={() => setActiveModal('upload')}
            isProcessing={isProcessing}
          />

          <AnalyticsSearch
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            totalCount={totalCount}
          />
        </div>

        {/* FILA 2: Bottom Grid completo (Fases 4 y 5) */}
        <section id="sec-resultados" className="bottom-grid">
          {/* Columna Izquierda: Tabla de Últimos Procesados (Fase 4) */}
          <RecentTable
            documents={documents}
            searchQuery={searchQuery}
            onOpenHistory={() => setActiveModal('history')}
          />

          {/* Columna Derecha: Explorador de Clusters K-Means (Fase 5) */}
          <ClusterWidget
            clusters={clusters}
            isReclustering={isReclustering}
            onRecluster={handleRecluster}
            onOpenClusters={() => setActiveModal('clusters')}
          />
        </section>
      </main>

      {/* Modals de la Aplicación */}
      <ResultModal
        isOpen={activeModal === 'result'}
        onClose={() => setActiveModal(null)}
        resultData={resultData}
      />

      <HistoryModal
        isOpen={activeModal === 'history'}
        onClose={() => setActiveModal(null)}
        documents={documents}
      />

      <ClustersModal
        isOpen={activeModal === 'clusters'}
        onClose={() => setActiveModal(null)}
        clusters={clusters}
      />

      <UploadModal
        isOpen={activeModal === 'upload'}
        onClose={() => setActiveModal(null)}
        onProcessBatch={handleProcessBatch}
      />

      <ConfigModal
        isOpen={activeModal === 'config'}
        onClose={() => setActiveModal(null)}
        onSaveConfig={handleSaveConfig}
      />

      <ApiDocsModal
        isOpen={activeModal === 'api'}
        onClose={() => setActiveModal(null)}
      />
    </div>
  );
}

export default App;
