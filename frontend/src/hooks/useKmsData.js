import { useState, useEffect, useCallback } from 'react';
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
  INITIAL_DOCUMENTS,
  INITIAL_CLUSTERS,
} from '../services/kmsApi';

/**
 * Custom Hook for KMS Domain Data, Reactive Ingestion & State Handlers
 */
export function useKmsData(showToast) {
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

  // Initial load on mount
  useEffect(() => {
    reloadDashboardData();
  }, [reloadDashboardData]);

  // 1. Single classification
  const handleClassify = useCallback(
    async (formData, openResultModal) => {
      if (!formData || !formData.content) {
        showToast('Por favor ingresa el contenido a clasificar', 'error');
        return false;
      }

      setIsProcessing(true);

      try {
        const result = await classifyContent(formData);
        setIsProcessing(false);

        setDocuments((prev) => [result, ...prev]);
        if (openResultModal) openResultModal(result);

        reloadDashboardData(selectedCategory);

        if (result.isLiveApi) {
          showToast('Documento clasificado e indexado en PostgreSQL', 'success');
        } else {
          showToast('Documento clasificado (Modo Demo Local)', 'success');
        }
        return true;
      } catch (err) {
        setIsProcessing(false);
        showToast(err.message || 'Error en el servicio de clasificación', 'error');
        return false;
      }
    },
    [selectedCategory, reloadDashboardData, showToast]
  );

  // 2. Real-time Semantic Search
  const handlePerformSearch = useCallback(
    async (query) => {
      const cleanQ = (query || '').trim();
      if (!cleanQ) {
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
    },
    [selectedCategory, showToast]
  );

  // 3. Category Filter
  const handleSelectCategory = useCallback(
    async (cat) => {
      setSelectedCategory(cat);
      setSearchQuery('');
      const historyData = await fetchHistory(cat);
      if (historyData && historyData.items) {
        setDocuments(historyData.items);
      }
    },
    []
  );

  // 4. K-Means Clustering
  const handleRecluster = useCallback(async () => {
    setIsReclustering(true);
    try {
      const clusterResult = await triggerReclustering();
      if (clusterResult && clusterResult.clusters && clusterResult.clusters.length > 0) {
        setClusters(clusterResult.clusters);
        showToast(`K-Means completado: ${clusterResult.clusters.length} clusters generados.`, 'success');
      } else {
        showToast('K-Means ejecutado correctamente.', 'success');
      }
      reloadDashboardData(selectedCategory);
    } catch (err) {
      showToast(err.message || 'Error al ejecutar agrupamiento K-Means', 'error');
    } finally {
      setIsReclustering(false);
    }
  }, [selectedCategory, reloadDashboardData, showToast]);

  // 5. Bulk Upload
  const handleProcessBatch = useCallback(
    async (textsArray) => {
      setIsProcessingBatch(true);
      try {
        const result = await uploadBatchLote(textsArray);
        setIsProcessingBatch(false);
        showToast(`Lote de ${textsArray.length} notas indexado correctamente en PostgreSQL`, 'success');
        reloadDashboardData(selectedCategory);
        return result;
      } catch (err) {
        setIsProcessingBatch(false);
        showToast(err.message || 'Error procesando lote de notas', 'error');
        return null;
      }
    },
    [selectedCategory, reloadDashboardData, showToast]
  );

  // 6. User Feedback
  const handleSendFeedback = useCallback(
    async (id, categoriaSugerida, comentario) => {
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
    },
    [selectedCategory, reloadDashboardData, showToast]
  );

  return {
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
    reloadDashboardData,
    handleClassify,
    handlePerformSearch,
    handleSelectCategory,
    handleRecluster,
    handleProcessBatch,
    handleSendFeedback,
  };
}

export default useKmsData;
