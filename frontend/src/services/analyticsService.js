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
  } catch {
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

  const data = await request(url, { method: 'GET' }, 8000, apiUrl);
  const content = data.content || data.items || (Array.isArray(data) ? data : []);

  const mapped = content.map((item) => {
    const rawText = item.contenidoOriginal || item.descripcion || '';
    return {
      id: item.id,
      title: sanitizeInput(inferTitleFromContent(rawText)),
      content: sanitizeInput(rawText),
      category: item.categoria || 'Otros',
      confidence: item.probabilidad !== undefined ? `${(item.probabilidad * 100).toFixed(1)}%` : '85.0%',
      tags: Array.isArray(item.palabrasClave) ? item.palabrasClave.join(', ') : '',
      date: item.fechaAnalisis ? new Date(item.fechaAnalisis).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Hoy',
      latencyMs: item.tiempoProcesamientoMs || null,
      feedback: item.feedbackUsuario || null,
    };
  });

  return {
    items: mapped,
    totalElements: data.totalElements !== undefined ? data.totalElements : mapped.length,
    totalPages: data.totalPages !== undefined ? data.totalPages : 1,
  };
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

  const data = await request(`/buscar?q=${encodeURIComponent(cleanQ)}`, { method: 'GET' }, 8000, apiUrl);
  if (!Array.isArray(data)) return [];

  return data.map((item) => {
    const rawText = item.contenidoOriginal || item.descripcion || '';
    return {
      id: item.id,
      title: sanitizeInput(inferTitleFromContent(rawText)),
      content: sanitizeInput(rawText),
      category: item.categoria || 'Otros',
      confidence: item.probabilidad !== undefined ? `${(item.probabilidad * 100).toFixed(1)}%` : '85.0%',
      tags: Array.isArray(item.palabrasClave) ? item.palabrasClave.join(', ') : '',
      date: item.fechaAnalisis ? new Date(item.fechaAnalisis).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Hoy',
      latencyMs: item.tiempoProcesamientoMs || null,
      feedback: item.feedbackUsuario || null,
    };
  });
}

/**
 * Trigger K-Means Clustering (POST /api/contenido/agrupar)
 */
export async function triggerReclustering(nClusters = null, apiUrl = DEFAULT_API_URL) {
  if (IS_MOCK_MODE) {
    return getMockClusters();
  }

  const payload = nClusters ? { n_clusters: nClusters } : {};
  const data = await request(
    '/contenido/agrupar',
    {
      method: 'POST',
      body: JSON.stringify(payload),
    },
    30000,
    apiUrl
  );

  const rawClusters = data.clusters || (Array.isArray(data) ? data : []);
  const mappedClusters = rawClusters.map((c, idx) => ({
    id: c.id !== undefined ? c.id : idx,
    title: c.nombreSugerido || c.etiqueta_sugerida || c.title || `Cluster #${idx + 1}`,
    tags: Array.isArray(c.palabrasClaveTop || c.palabras_clave)
      ? (c.palabrasClaveTop || c.palabras_clave).join(', ')
      : c.tags || '',
    docsCount: c.totalDocumentos || c.tamano || c.docsCount || 0,
    updated: 'Recién generado',
    docs: Array.isArray(c.documentos) ? c.documentos : [],
  }));

  return {
    n_clusters: data.n_clusters || mappedClusters.length,
    n_documentos: data.n_documentos || 0,
    tiempo_procesamiento_ms: data.tiempo_procesamiento_ms || null,
    clusters: mappedClusters,
  };
}

/**
 * Fetch Cluster Statistics and Top Categories (GET /api/contenido/stats)
 */
export async function fetchStats(apiUrl = DEFAULT_API_URL) {
  if (IS_MOCK_MODE) {
    return {
      totalDocumentos: INITIAL_DOCUMENTS.length,
      promedioConfianza: 92.4,
      tiempoPromedioMs: 42.1,
      distribucionCategorias: { DevOps: 2, Backend: 2, Frontend: 1, 'Data Science': 1 },
    };
  }

  return request('/contenido/stats', { method: 'GET' }, 5000, apiUrl);
}

/**
 * Fetch Dynamic Categories List (GET /api/categorias)
 */
export async function fetchCategories(apiUrl = DEFAULT_API_URL) {
  if (IS_MOCK_MODE) {
    return ['DevOps', 'Backend', 'Frontend', 'Data Science', 'Mobile', 'Otros'];
  }

  return request('/categorias', { method: 'GET' }, 5000, apiUrl);
}
