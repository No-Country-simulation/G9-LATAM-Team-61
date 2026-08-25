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
  const [historyError, setHistoryError] = useState(null);

  // Reload dashboard data without blocking exclusively on /api/health
  const reloadDashboardData = useCallback(async (cat = '') => {
    // 1. Check health in background
    checkBackendHealth().then((alive) => {
      if (alive) setIsApiLive(true);
    });

    // 2. Fetch history directly (independent of /api/health existence)
    try {
      const historyData = await fetchHistory(cat);
      if (historyData && Array.isArray(historyData.items)) {
        setDocuments(historyData.items);
        setHistoryError(null);
        setIsApiLive(true);
      }
    } catch (err) {
      setHistoryError(err.message || 'Error al conectar con el servidor de historial');
    }

    // 3. Fetch stats & categories independently
    try {
      const statsData = await fetchStats();
      if (statsData) setStats(statsData);
    } catch {}

    try {
      const catsData = await fetchCategories();
      if (catsData && Array.isArray(catsData) && catsData.length > 0) {
        setCategories(catsData);
      }
    } catch {}
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

  // 2. Real-time Semantic Search & Filtering
  const handlePerformSearch = useCallback(
    async (query) => {
      const cleanQ = (query || '').trim();
      if (!cleanQ) {
        reloadDashboardData(selectedCategory);
        return;
      }

      setIsSearching(true);
      try {
        const results = await searchContent(cleanQ);
        if (results && results.length > 0) {
          setDocuments(results);
          showToast(`Búsqueda completada: ${results.length} coincidencias`, 'info');
        } else {
          // Fallback a filtrado local sobre documentos cargados
          const localMatches = (documents || INITIAL_DOCUMENTS).filter(
            (d) =>
              (d.content && d.content.toLowerCase().includes(cleanQ.toLowerCase())) ||
              (d.title && d.title.toLowerCase().includes(cleanQ.toLowerCase())) ||
              (d.tags && d.tags.toLowerCase().includes(cleanQ.toLowerCase())) ||
              (d.category && d.category.toLowerCase().includes(cleanQ.toLowerCase()))
          );
          setDocuments(localMatches);
          if (localMatches.length > 0) {
            showToast(`Búsqueda completada: ${localMatches.length} coincidencias`, 'info');
          } else {
            showToast(`No se encontraron notas con el término "${cleanQ}".`, 'info');
          }
        }
      } catch {
        const localMatches = (documents || INITIAL_DOCUMENTS).filter(
          (d) =>
            (d.content && d.content.toLowerCase().includes(cleanQ.toLowerCase())) ||
            (d.title && d.title.toLowerCase().includes(cleanQ.toLowerCase())) ||
            (d.tags && d.tags.toLowerCase().includes(cleanQ.toLowerCase())) ||
            (d.category && d.category.toLowerCase().includes(cleanQ.toLowerCase()))
        );
        setDocuments(localMatches);
        showToast(`Búsqueda local: ${localMatches.length} coincidencias`, 'info');
      } finally {
        setIsSearching(false);
      }
    },
    [selectedCategory, reloadDashboardData, documents, showToast]
  );

  // 3. Category Filter Selection
  const handleSelectCategory = useCallback(
    (cat) => {
      setSelectedCategory(cat);
      reloadDashboardData(cat);
    },
    [reloadDashboardData]
  );

  // 4. Trigger K-Means Reclustering
  const handleRecluster = useCallback(
    async (openClustersModal) => {
      setIsReclustering(true);
      try {
        const result = await triggerReclustering();

        if (result && result.clusters && result.clusters.length > 0) {
          setClusters(result.clusters);
        } else {
          throw new Error('El backend no devolvió clusters válidos');
        }

        showToast('Agrupamiento K-Means ejecutado correctamente', 'success');
        if (typeof openClustersModal === 'function') openClustersModal();
      } catch (err) {
        showToast(err.message || 'Error al ejecutar el agrupamiento K-Means', 'error');
      } finally {
        setIsReclustering(false);
      }
    },
    [showToast]
  );

  // 5. Batch Upload Ingestion
  const handleProcessBatch = useCallback(
    async (textos) => {
      setIsProcessingBatch(true);
      try {
        const response = await uploadBatchLote(textos);

        const count =
          response?.archivos_procesados ??
          response?.archivosProcesados ??
          response?.totalProcesados ??
          textos.length;
        showToast(`Lote completado: ${count} documentos procesados`, 'success');

        reloadDashboardData(selectedCategory);
        return response;
      } catch (err) {
        showToast(err.message || 'Error al procesar el lote', 'error');
        return null;
      } finally {
        setIsProcessingBatch(false);
      }
    },
    [selectedCategory, reloadDashboardData, showToast]
  );

  // 6. Send Feedback
  const handleSendFeedback = useCallback(
    async (id, category, comment) => {
      setIsSendingFeedback(true);
      try {
        await sendFeedback(id, { categoriaSugerida: category, comentario: comment });
        setIsSendingFeedback(false);

        setDocuments((prev) =>
          prev.map((doc) => (doc.id === id ? { ...doc, category, feedback: comment || 'Corregido' } : doc))
        );

        showToast('Feedback registrado para análisis y futuro reentrenamiento', 'success');
        return true;
      } catch (err) {
        setIsSendingFeedback(false);
        showToast(err.message || 'Error al enviar feedback', 'error');
        return false;
      }
    },
    [showToast]
  );

  return {
    documents,
    clusters,
    stats,
    categories,
    selectedCategory,
    setSelectedCategory,
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
  };
}

export default useKmsData;
