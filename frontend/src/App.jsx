import React from 'react';
import Header from './components/layout/Header';
import Toast from './components/common/Toast';
import DataInputForm from './components/classification/DataInputForm';
import ResultModal from './components/classification/ResultModal';
import AnalyticsSearch from './components/dashboard/AnalyticsSearch';
import RecentTable from './components/dashboard/RecentTable';
import HistoryModal from './components/dashboard/HistoryModal';
import RecommendedModal from './components/dashboard/RecommendedModal';
import ClusterWidget from './components/clustering/ClusterWidget';
import ClustersModal from './components/clustering/ClustersModal';
import UploadModal from './components/bulk/UploadModal';
import ConfigModal from './components/modals/ConfigModal';
import ApiDocsModal from './components/modals/ApiDocsModal';

import { useToast } from './hooks/useToast';
import { useModals } from './hooks/useModals';
import { useKmsData } from './hooks/useKmsData';
import './App.css';

export function App() {
  const { toastState, showToast, closeToast } = useToast();

  const {
    activeModal,
    setActiveModal,
    closeModal,
    resultData,
    openResultModal,
    recommendedBaseDoc,
    recommendations,
    isLoadingRecommendations,
    openRecommendationsModal,
  } = useModals(showToast);

  const {
    documents,
    clusters,
    stats,
    categories,
    selectedCategory,
    searchQuery,
    setSearchQuery,
    isSearching,
    isProcessing,
    isReclustering,
    isProcessingBatch,
    isSendingFeedback,
    isApiLive,
    historyError,
    reloadDashboardData,
    handleClassify,
    handlePerformSearch,
    handleSelectCategory,
    handleRecluster,
    handleProcessBatch,
    handleSendFeedback,
  } = useKmsData(showToast);

  const onSaveConfig = () => {
    showToast('Configuración actualizada correctamente', 'success');
    reloadDashboardData();
  };

  return (
    <div className="main-content-wrapper" style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
      <Toast toastState={toastState} onClose={closeToast} />

      <main className="main-content">
        <Header
          onOpenConfig={() => setActiveModal('config')}
          onOpenApiDocs={() => setActiveModal('api')}
          isApiLive={isApiLive}
        />

        {/* Fila 1: Formulario & Búsqueda Semántica */}
        <div className="top-grid">
          <DataInputForm
            onClassify={(formData) => handleClassify(formData, openResultModal)}
            onOpenUpload={() => setActiveModal('upload')}
            isProcessing={isProcessing}
          />

          <AnalyticsSearch
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            onPerformSearch={handlePerformSearch}
            isSearching={isSearching}
            totalCount={documents.length}
            stats={stats}
            clustersCount={clusters.length}
            categories={categories}
            selectedCategory={selectedCategory}
            onSelectCategory={handleSelectCategory}
          />
        </div>

        {/* Fila 2: Tabla de Historial & Tendencias K-Means */}
        <section id="sec-resultados" className="bottom-grid">
          <RecentTable
            documents={documents}
            historyError={historyError}
            searchQuery={searchQuery}
            onOpenHistory={() => setActiveModal('history')}
            onViewDetail={openResultModal}
            onViewRecommendations={openRecommendationsModal}
          />

          <ClusterWidget
            clusters={clusters}
            isReclustering={isReclustering}
            onRecluster={handleRecluster}
            onOpenClusters={() => setActiveModal('clusters')}
          />
        </section>
      </main>

      {/* Modales de la Aplicación */}
      <ResultModal
        isOpen={activeModal === 'result'}
        onClose={closeModal}
        resultData={resultData}
        onSendFeedback={handleSendFeedback}
        isSendingFeedback={isSendingFeedback}
      />

      <HistoryModal
        isOpen={activeModal === 'history'}
        onClose={closeModal}
        documents={documents}
        historyError={historyError}
        onViewDetail={openResultModal}
        onViewRecommendations={openRecommendationsModal}
      />

      <RecommendedModal
        isOpen={activeModal === 'recommended'}
        onClose={closeModal}
        baseDocument={recommendedBaseDoc}
        recommendations={recommendations}
        isLoading={isLoadingRecommendations}
      />

      <ClustersModal
        isOpen={activeModal === 'clusters'}
        onClose={closeModal}
        clusters={clusters}
      />

      <UploadModal
        isOpen={activeModal === 'upload'}
        onClose={closeModal}
        onProcessBatch={handleProcessBatch}
        isProcessingBatch={isProcessingBatch}
      />

      <ConfigModal
        isOpen={activeModal === 'config'}
        onClose={closeModal}
        onSaveConfig={onSaveConfig}
      />

      <ApiDocsModal
        isOpen={activeModal === 'api'}
        onClose={closeModal}
      />
    </div>
  );
}

export default App;
