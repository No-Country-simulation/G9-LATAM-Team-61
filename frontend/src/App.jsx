import React, { useState, useEffect, useCallback } from 'react';
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

import {
  classifyContent,
  checkBackendHealth,
  fetchHistory,
  fetchStats,
  fetchCategories,
  searchContent,
  triggerReclustering,
  uploadBatchLote,
  sendFeedback,
  fetchRecommendations,
  INITIAL_DOCUMENTS,
  INITIAL_CLUSTERS,
} from './services/kmsApi';
import './App.css';

export function App() {
  const [documents, setDocuments] = useState(INITIAL_DOCUMENTS);
  const [clusters, setClusters] = useState(INITIAL_CLUSTERS);
  const [stats, setStats] = useState(null);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const [isSearching, setIsSearching] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isReclustering, setIsReclustering] = useState(false);
  const [isProcessingBatch, setIsProcessingBatch] = useState(false);
  const [isSendingFeedback, setIsSendingFeedback] = useState(false);
  const [isApiLive, setIsApiLive] = useState(false);

  const [activeModal, setActiveModal] = useState(null);
  const [resultData, setResultData] = useState(null);

  // Recommendations state
  const [recommendedBaseDoc, setRecommendedBaseDoc] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [isLoadingRecommendations, setIsLoadingRecommendations] = useState(false);

  const toastTimerRef = React.useRef(null);

  const [toastState, setToastState] = useState({
    visible: false,
    message: '',
    type: 'info',
  });

  const showToast = (message, type = 'info') => {
    if (toastTimerRef.current) {
      clearTimeout(toastTimerRef.current);
    }
    setToastState({ visible: true, message, type });
    toastTimerRef.current = setTimeout(() => {
      setToastState((prev) => ({ ...prev, visible: false }));
    }, 4000);
  };

  const handleCloseToast = () => {
    if (toastTimerRef.current) {
      clearTimeout(toastTimerRef.current);
    }
    setToastState((prev) => ({ ...prev, visible: false }));
  };

  const reloadDashboardData = useCallback(async (cat = '') => {
    const isAlive = await checkBackendHealth();
    setIsApiLive(isAlive);

    if (isAlive) {
      const [historyData, statsData, catsData] = await Promise.all([
        fetchHistory(cat),
        fetchStats(),
        fetchCategories(),
      ]);

      if (historyData && historyData.items) {
        setDocuments(historyData.items);
      }
      if (statsData) {
        setStats(statsData);
      }
      if (catsData) {
        setCategories(catsData);
      }
    }
  }, []);

  // Initial load
  useEffect(() => {
    reloadDashboardData();
  }, [reloadDashboardData]);

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

  // 1. Single classification handler
  const handleClassify = async (formData) => {
    if (!formData || !formData.content) {
      showToast('Por favor ingresa el contenido a clasificar', 'error');
      return false;
    }

    setIsProcessing(true);

    try {
      const result = await classifyContent(formData);
      setIsProcessing(false);

      setDocuments((prev) => [result, ...prev]);
      setResultData(result);
      setActiveModal('result');

      // Refresh stats & categories
      reloadDashboardData(selectedCategory);

      if (result.isLiveApi) {
        showToast('¡Documento clasificado e indexado en PostgreSQL!', 'success');
      } else {
        showToast('¡Documento clasificado (Modo Demo Local)!', 'success');
      }
      return true;
    } catch (err) {
      setIsProcessing(false);
      showToast(err.message || 'Error en el servicio de clasificación', 'error');
      return false;
    }
  };

  // 2. Real-time Semantic Search handler
  const handlePerformSearch = async (query) => {
    const cleanQ = (query || '').trim();
    if (!cleanQ) {
      // Reset back to category/full history
      const historyData = await fetchHistory(selectedCategory);
      if (historyData && historyData.items) {
        setDocuments(historyData.items);
      }
      return;
    }

    setIsSearching(true);
    try {
      const searchResults = await searchContent(cleanQ);
      setDocuments(searchResults);
      if (searchResults.length > 0) {
        showToast(`Se encontraron ${searchResults.length} notas por similitud semántica.`, 'info');
      } else {
        showToast(`No se encontraron notas con el término "${cleanQ}".`, 'info');
      }
    } catch (err) {
      showToast('Error ejecutando búsqueda semántica', 'error');
    } finally {
      setIsSearching(false);
    }
  };

  // 3. Category Filter handler
  const handleSelectCategory = async (cat) => {
    setSelectedCategory(cat);
    setSearchQuery('');
    const historyData = await fetchHistory(cat);
    if (historyData && historyData.items) {
      setDocuments(historyData.items);
    }
  };

  // 4. K-Means Clustering handler
  const handleRecluster = async () => {
    setIsReclustering(true);
    try {
      const clusterResult = await triggerReclustering();
      if (clusterResult && clusterResult.clusters && clusterResult.clusters.length > 0) {
        setClusters(clusterResult.clusters);
        showToast(`¡K-Means completado! ${clusterResult.clusters.length} clusters generados (${clusterResult.tiempo_procesamiento_ms || 400} ms).`, 'success');
      } else {
        showToast('K-Means ejecutado correctamente.', 'success');
      }
      reloadDashboardData(selectedCategory);
    } catch (err) {
      showToast(err.message || 'Error al ejecutar agrupamiento K-Means', 'error');
    } finally {
      setIsReclustering(false);
    }
  };

  // 5. Bulk Upload batch handler
  const handleProcessBatch = async (textsArray) => {
    setIsProcessingBatch(true);
    try {
      const result = await uploadBatchLote(textsArray);
      setIsProcessingBatch(false);
      showToast(`¡Lote de ${textsArray.length} notas indexado correctamente en PostgreSQL!`, 'success');
      reloadDashboardData(selectedCategory);
      return result;
    } catch (err) {
      setIsProcessingBatch(false);
      showToast(err.message || 'Error procesando lote de notas', 'error');
      return null;
    }
  };

  // 6. User Feedback handler
  const handleSendFeedback = async (id, categoriaSugerida, comentario) => {
    setIsSendingFeedback(true);
    try {
      await sendFeedback(id, { categoriaSugerida, comentario });
      setIsSendingFeedback(false);
      showToast(`Retroalimentación guardada: Nota #${id} clasificada como ${categoriaSugerida}.`, 'success');
      reloadDashboardData(selectedCategory);
      return true;
    } catch (err) {
      setIsSendingFeedback(false);
      showToast(err.message || 'Error al enviar feedback', 'error');
      return false;
    }
  };

  // 7. Recommendations handler
  const handleViewRecommendations = async (doc) => {
    setRecommendedBaseDoc(doc);
    setIsLoadingRecommendations(true);
    setActiveModal('recommended');

    try {
      const recs = await fetchRecommendations(doc.id);
      setRecommendations(recs);
    } catch (err) {
      showToast('No se pudieron obtener recomendaciones para este documento', 'error');
      setRecommendations([]);
    } finally {
      setIsLoadingRecommendations(false);
    }
  };

  const handleSaveConfig = () => {
    showToast('Configuración actualizada correctamente', 'success');
    reloadDashboardData();
  };

  return (
    <div className="main-content-wrapper" style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
      {/* Toast Notification Banner */}
      <Toast toastState={toastState} onClose={handleCloseToast} />

      <main className="main-content">
        {/* Top Bar Header */}
        <Header
          onOpenConfig={() => setActiveModal('config')}
          onOpenApiDocs={() => setActiveModal('api')}
          isApiLive={isApiLive}
        />

        {/* FILA 1: Top Grid completo */}
        <div className="top-grid">
          <DataInputForm
            onClassify={handleClassify}
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

        {/* FILA 2: Bottom Grid completo */}
        <section id="sec-resultados" className="bottom-grid">
          <RecentTable
            documents={documents}
            searchQuery={searchQuery}
            onOpenHistory={() => setActiveModal('history')}
            onViewRecommendations={handleViewRecommendations}
          />

          <ClusterWidget
            clusters={clusters}
            isReclustering={isReclustering}
            onRecluster={handleRecluster}
            onOpenClusters={() => setActiveModal('clusters')}
            isApiLive={isApiLive}
          />
        </section>
      </main>

      {/* Modales de la Aplicación */}
      <ResultModal
        isOpen={activeModal === 'result'}
        onClose={() => setActiveModal(null)}
        resultData={resultData}
        onSendFeedback={handleSendFeedback}
        isSendingFeedback={isSendingFeedback}
      />

      <HistoryModal
        isOpen={activeModal === 'history'}
        onClose={() => setActiveModal(null)}
        documents={documents}
        onViewRecommendations={handleViewRecommendations}
      />

      <RecommendedModal
        isOpen={activeModal === 'recommended'}
        onClose={() => setActiveModal(null)}
        baseDocument={recommendedBaseDoc}
        recommendations={recommendations}
        isLoading={isLoadingRecommendations}
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
        isProcessingBatch={isProcessingBatch}
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
