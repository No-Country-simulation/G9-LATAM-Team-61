/**
 * Analytics, Search & Clustering API Service
 */
import { request, sanitizeInput, inferTitleFromContent, DEFAULT_API_URL, IS_MOCK_MODE, INITIAL_DOCUMENTS } from './apiClient.js';
import { getMockHistory, getMockClusters } from './mockFallback.js';

/**
 * Check Backend & AI Health (GET /api/health)
 */
export async function checkBackendHealth(apiUrl = DEFAULT_API_URL) {
  try {
    const data = await request('/health', { method: 'GET' }, 3000, apiUrl);
    return data && (data.status === 'UP' || data.status === 'OK' || data.fastapiStatus === 'UP');
  } catch (err) {
    return false;
  }
}

/**
 * Fetch Paginated History (GET /api/contenido)
 */
export async function fetchHistory(categoryFilter = '', page = 0, size = 20, apiUrl = DEFAULT_API_URL) {
  if (IS_MOCK_MODE) {
    return getMockHistory(categoryFilter);
  }

  let url = `/contenido?page=${page}&size=${size}`;
  if (categoryFilter) {
    url += `&categoria=${encodeURIComponent(categoryFilter)}`;
  }

  try {
    const data = await request(url, { method: 'GET' }, 5000, apiUrl);
    const content = data.content || data.items || (Array.isArray(data) ? data : []);

    const mapped = content.map((item) => ({
      id: item.id,
      title: sanitizeInput(inferTitleFromContent(item.contenidoOriginal)),
      content: sanitizeInput(item.contenidoOriginal),
      category: item.categoria || 'Otros',
      confidence: item.probabilidad !== undefined ? `${(item.probabilidad * 100).toFixed(1)}%` : '85.0%',
      tags: Array.isArray(item.palabrasClave) ? item.palabrasClave.join(', ') : '',
      date: item.fechaAnalisis ? new Date(item.fechaAnalisis).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Hoy',
      latencyMs: item.tiempoProcesamientoMs || null,
      feedback: item.feedbackUsuario || null,
    }));

    return {
      items: mapped,
      totalElements: data.totalElements !== undefined ? data.totalElements : mapped.length,
      totalPages: data.totalPages !== undefined ? data.totalPages : 1,
    };
  } catch (err) {
    console.warn('Error fetching history:', err);
    return { items: INITIAL_DOCUMENTS, totalElements: INITIAL_DOCUMENTS.length, totalPages: 1 };
  }
}

/**
 * Real-time Semantic Search (GET /api/buscar?q=...)
 */
export async function searchContent(query, apiUrl = DEFAULT_API_URL) {
  if (!query || !query.trim()) return [];

  const cleanQ = query.trim();

  if (IS_MOCK_MODE) {
    return INITIAL_DOCUMENTS.filter(
      (d) =>
        (d.title && d.title.toLowerCase().includes(cleanQ.toLowerCase())) ||
        (d.content && d.content.toLowerCase().includes(cleanQ.toLowerCase())) ||
        (d.tags && d.tags.toLowerCase().includes(cleanQ.toLowerCase()))
    );
  }

  try {
    const data = await request(`/buscar?q=${encodeURIComponent(cleanQ)}`, { method: 'GET' }, 8000, apiUrl);
    if (!Array.isArray(data)) return [];

    return data.map((item) => ({
      id: item.id,
      title: sanitizeInput(inferTitleFromContent(item.contenidoOriginal)),
      content: sanitizeInput(item.contenidoOriginal),
      category: item.categoria || 'Otros',
      confidence: item.probabilidad !== undefined ? `${(item.probabilidad * 100).toFixed(1)}%` : '85.0%',
      tags: Array.isArray(item.palabrasClave) ? item.palabrasClave.join(', ') : '',
      date: item.fechaAnalisis ? new Date(item.fechaAnalisis).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Hoy',
      latencyMs: item.tiempoProcesamientoMs || null,
      feedback: item.feedbackUsuario || null,
    }));
  } catch (err) {
    console.warn('Error en búsqueda semántica:', err);
    return [];
  }
}

/**
 * Trigger K-Means Clustering (POST /api/contenido/agrupar)
 */
export async function triggerReclustering(nClusters = null, apiUrl = DEFAULT_API_URL) {
  if (IS_MOCK_MODE) {
    await new Promise((resolve) => setTimeout(resolve, 800));
    return getMockClusters();
  }

  const endpoint = nClusters ? `/contenido/agrupar?n_clusters=${nClusters}` : '/contenido/agrupar';

  const data = await request(endpoint, { method: 'POST' }, 30000, apiUrl);

  const mappedClusters = (data.clusters || []).map((c) => ({
    id: c.id,
    title: c.nombreSugerido || `Cluster ${c.id}`,
    docsCount: c.totalDocumentos || 0,
    tags: Array.isArray(c.palabrasClaveTop) ? c.palabrasClaveTop.slice(0, 6).join(', ') : '',
    date: c.fechaGeneracion,
  }));

  return {
    n_clusters: data.n_clusters || mappedClusters.length,
    n_documentos: data.n_documentos || 0,
    clusters: mappedClusters,
    tiempo_procesamiento_ms: data.tiempo_procesamiento_ms,
  };
}

/**
 * Fetch Category Counts (GET /api/categorias)
 */
export async function fetchCategories(apiUrl = DEFAULT_API_URL) {
  if (IS_MOCK_MODE) {
    return [
      { categoria: 'DevOps', total: 0 },
      { categoria: 'Backend', total: 0 },
      { categoria: 'Frontend', total: 0 },
      { categoria: 'Data Science', total: 0 },
      { categoria: 'Mobile', total: 0 },
      { categoria: 'Otros', total: 0 },
    ];
  }

  try {
    const data = await request('/categorias', { method: 'GET' }, 5000, apiUrl);
    return Array.isArray(data) ? data : [];
  } catch (err) {
    console.warn('Error obteniendo categorías:', err);
    return [];
  }
}

/**
 * Fetch Aggregated Stats (GET /api/contenido/stats)
 */
export async function fetchStats(apiUrl = DEFAULT_API_URL) {
  if (IS_MOCK_MODE) return null;

  try {
    return await request('/contenido/stats', { method: 'GET' }, 5000, apiUrl);
  } catch (err) {
    console.warn('Error obteniendo estadísticas:', err);
    return null;
  }
}
