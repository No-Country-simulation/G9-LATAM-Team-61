// KMS API Client Service (Separación estricta Modo Real vs Modo Demo + Manejo Transparente de Errores)

export const DEFAULT_API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api';

// El modo demo solo se activa si se especifica explícitamente en desarrollo (VITE_ENABLE_DEMO=true)
export const IS_MOCK_MODE =
  import.meta.env.VITE_ENABLE_DEMO === 'true' || import.meta.env.VITE_USE_MOCK === 'true';

export const INITIAL_DOCUMENTS = [];

export const INITIAL_CLUSTERS = [];

export function sanitizeInput(str) {
  if (typeof str !== 'string') return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}

export function inferTitleFromContent(text) {
  if (!text) return 'Sin Título';
  const cleanText = text.trim();
  const firstLine = cleanText.split('\n')[0].substring(0, 35);
  return firstLine.charAt(0).toUpperCase() + firstLine.slice(1) + (cleanText.length > 35 ? '...' : '');
}

/**
 * Health Check Probe for Spring Boot backend
 */
export async function checkBackendHealth(apiUrl = DEFAULT_API_URL) {
  if (IS_MOCK_MODE) return false;
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);
    const baseUrl = apiUrl.replace(/\/api\/?$/, '');

    // Intentar /api/health primero, y si no responde, verificar /v3/api-docs (Swagger UI de Spring Boot)
    let response = await fetch(`${apiUrl}/health`, { signal: controller.signal }).catch(() => null);
    if (!response || !response.ok) {
      response = await fetch(`${baseUrl}/v3/api-docs`, { signal: controller.signal }).catch(() => null);
    }

    clearTimeout(timeoutId);
    return Boolean(response && response.ok);
  } catch {
    return false;
  }
}

/**
 * Fetch Persisted History from Spring Boot (GET /api/contenido)
 */
export async function fetchHistory(categoria = '', page = 0, size = 10, apiUrl = DEFAULT_API_URL) {
  if (IS_MOCK_MODE) return null;
  try {
    const url = new URL(`${apiUrl}/contenido`);
    if (categoria) url.searchParams.append('categoria', categoria);
    url.searchParams.append('page', page);
    url.searchParams.append('size', size);

    const response = await fetch(url.toString());
    if (response.ok) {
      const data = await response.json();
      const items = (data.content || []).map((item) => {
        const category = item.categoria || 'Otros';
        const badgeClass = category.toLowerCase().replace(/\s+/g, '');
        const rawProb = item.probabilidad !== undefined ? item.probabilidad : 0.0;
        const confidence = `${(rawProb * 100).toFixed(1)}%`;
        const rawTags = item.palabrasClave || item.palabras_clave || [];
        const tags = Array.isArray(rawTags) ? rawTags.join(', ') : String(rawTags);

        let formattedDate = 'Reciente';
        if (item.fechaAnalisis) {
          try {
            const d = new Date(item.fechaAnalisis);
            formattedDate = d.toLocaleString('es-ES', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
          } catch {
            formattedDate = 'Reciente';
          }
        }

        return {
          id: item.id,
          content: item.contenidoOriginal || '',
          title: inferTitleFromContent(item.contenidoOriginal || ''),
          category,
          badgeClass,
          confidence,
          tags,
          latencyMs: item.tiempoProcesamientoMs || null,
          date: formattedDate,
          isLiveApi: true,
        };
      });

      return {
        items,
        totalElements: data.totalElements || items.length,
        totalPages: data.totalPages || 1,
      };
    }
  } catch (err) {
    console.warn('Error obteniendo historial real de Spring Boot:', err);
  }
  return null;
}

/**
 * Fetch Real Statistics from Spring Boot (GET /api/contenido/stats)
 */
export async function fetchStats(apiUrl = DEFAULT_API_URL) {
  if (IS_MOCK_MODE) return null;
  try {
    const response = await fetch(`${apiUrl}/contenido/stats`);
    if (response.ok) {
      const data = await response.json();
      return {
        ...data,
        totalDocumentos: data.totalIndexados !== undefined ? data.totalIndexados : data.totalDocumentos,
      };
    }
  } catch (err) {
    console.warn('Error obteniendo estadísticas reales:', err);
  }
  return null;
}

/**
 * Single Text Classification (POST /api/contenido)
 * Contrato estricto DTO Backend: Envía únicamente { descripcion } con validación de 30 a 5000 caracteres
 */
export async function classifyContent({ title, content }, apiUrl = DEFAULT_API_URL, forceDemoMode = IS_MOCK_MODE) {
  const contentText = (content || '').trim();
  
  if (contentText.length < 30) {
    throw new Error('El contenido debe tener al menos 30 caracteres.');
  }

  if (contentText.length > 5000) {
    throw new Error('El contenido excede el límite máximo permitido de 5,000 caracteres.');
  }

  const docTitle = (title || '').trim().slice(0, 500) || inferTitleFromContent(contentText);

  // Si se habilita explícitamente el Modo Demo
  if (forceDemoMode) {
    return executeLocalMockClassification(docTitle, contentText);
  }

  // MODO REAL: Petición HTTP a Spring Boot con Timeout de 10 segundos
  const sanitizedContent = contentText.slice(0, 5000);
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);

  let response;
  try {
    response = await fetch(`${apiUrl}/contenido`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        descripcion: sanitizedContent,
      }),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
  } catch (err) {
    clearTimeout(timeoutId);
    if (err.name === 'AbortError') {
      throw new Error('HTTP Timeout (10s): La solicitud de inferencia excedió el tiempo límite.');
    }
    throw new Error('Error de conexión: No se pudo establecer comunicación con el servidor de Spring Boot (http://localhost:8080).');
  }

  // Acepta 200 OK y 201 Created
  if (response.ok || response.status === 201 || response.status === 200) {
    const data = await response.json();
    const category = data.categoria || 'Backend';
    const badgeClass = category.toLowerCase().replace(/\s+/g, '');
    const rawProb = data.probabilidad !== undefined ? data.probabilidad : 0.945;
    const confidence = `${(rawProb * 100).toFixed(1)}%`;
    
    const rawTags = data.palabrasClave || data.palabras_clave || data.informacion_adicional || ['java', 'spring', 'rest'];
    const tags = Array.isArray(rawTags) ? rawTags.join(', ') : String(rawTags);

    return {
      id: data.id_registro || data.id || Date.now(),
      title: inferTitleFromContent(data.contenidoOriginal || sanitizedContent),
      content: data.contenidoOriginal || sanitizedContent,
      category,
      badgeClass,
      confidence,
      tags,
      latencyMs: data.tiempoProcesamientoMs || null,
      date: 'Hace un momento',
      isLiveApi: true,
    };
  }

  // Manejo explícito de respuestas de error HTTP 4xx / 5xx sin ocultar fallos
  if (response.status === 400) {
    throw new Error('HTTP 400: Error de validación según el servidor backend.');
  } else if (response.status === 502) {
    throw new Error('HTTP 502 Bad Gateway: El servidor de inferencia ML no está disponible.');
  } else if (response.status === 504) {
    throw new Error('HTTP 504 Gateway Timeout: El análisis de inferencia excedió el tiempo límite.');
  } else {
    throw new Error(`HTTP ${response.status}: Error en el servidor backend de Spring Boot.`);
  }
}

/**
 * Ejecución del Modo Demo Local (Simulación aislada)
 */
async function executeLocalMockClassification(docTitle, contentText) {
  const lower = contentText.toLowerCase();
  let category = 'Backend';
  let badgeClass = 'backend';
  let tags = 'java, spring, rest';
  let confidence = (89 + Math.random() * 9).toFixed(1) + '%';

  if (lower.includes('react') || lower.includes('css') || lower.includes('html') || lower.includes('frontend') || lower.includes('vite')) {
    category = 'Frontend';
    badgeClass = 'frontend';
    tags = 'react, ui, javascript';
  } else if (lower.includes('docker') || lower.includes('oci') || lower.includes('deploy') || lower.includes('devops') || lower.includes('nginx')) {
    category = 'DevOps';
    badgeClass = 'devops';
    tags = 'devops, cloud, container';
  } else if (lower.includes('python') || lower.includes('data') || lower.includes('model') || lower.includes('ml')) {
    category = 'Data Science';
    badgeClass = 'datascience';
    tags = 'python, kmeans, tfidf';
  } else if (lower.includes('android') || lower.includes('ios') || lower.includes('flutter') || lower.includes('app')) {
    category = 'Mobile';
    badgeClass = 'mobile';
    tags = 'android, ios, app';
  }

  await new Promise((resolve) => setTimeout(resolve, 700));

  return {
    id: Date.now(),
    title: docTitle,
    category,
    badgeClass,
    confidence,
    tags,
    date: 'Hace un momento',
    isLiveApi: false,
  };
}

/**
 * Search in Persisted Knowledge (GET /api/buscar?q=...)
 */
export async function searchContent(query, apiUrl = DEFAULT_API_URL) {
  const cleanQuery = (query || '').trim();
  if (!cleanQuery) return null;

  if (IS_MOCK_MODE) {
    const q = cleanQuery.toLowerCase();
    return INITIAL_DOCUMENTS.filter(
      (d) =>
        d.title.toLowerCase().includes(q) ||
        d.category.toLowerCase().includes(q) ||
        d.tags.toLowerCase().includes(q)
    );
  }

  try {
    const response = await fetch(`${apiUrl}/buscar?q=${encodeURIComponent(cleanQuery)}`);
    if (response.ok) {
      const data = await response.json();
      return (data || []).map((item) => {
        const category = item.categoria || 'Otros';
        const badgeClass = category.toLowerCase().replace(/\s+/g, '');
        const rawProb = item.probabilidad !== undefined ? item.probabilidad : 0.0;
        const confidence = `${(rawProb * 100).toFixed(1)}%`;
        const rawTags = item.palabrasClave || item.palabras_clave || [];
        const tags = Array.isArray(rawTags) ? rawTags.join(', ') : String(rawTags);

        let formattedDate = 'Reciente';
        if (item.fechaAnalisis) {
          try {
            const d = new Date(item.fechaAnalisis);
            formattedDate = d.toLocaleString('es-ES', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
          } catch {
            formattedDate = 'Reciente';
          }
        }

        return {
          id: item.id,
          content: item.contenidoOriginal || '',
          title: inferTitleFromContent(item.contenidoOriginal || ''),
          category,
          badgeClass,
          confidence,
          tags,
          latencyMs: item.tiempoProcesamientoMs || null,
          date: formattedDate,
          isLiveApi: true,
        };
      });
    }
  } catch (err) {
    console.warn('Error en búsqueda semántica de Spring Boot:', err);
  }
  return [];
}

/**
 * Fetch Similar Recommendations for a Note (GET /api/contenido/{id}/recomendados)
 */
export async function fetchRecommendations(id, apiUrl = DEFAULT_API_URL) {
  if (!id) return [];
  if (IS_MOCK_MODE) {
    return INITIAL_DOCUMENTS.filter((d) => d.id !== id).slice(0, 3);
  }

  try {
    const response = await fetch(`${apiUrl}/contenido/${id}/recomendados`);
    if (response.ok) {
      const data = await response.json();
      return (data || []).map((item) => {
        const category = item.categoria || 'Otros';
        const badgeClass = category.toLowerCase().replace(/\s+/g, '');
        const rawProb = item.probabilidad !== undefined ? item.probabilidad : 0.0;
        const confidence = `${(rawProb * 100).toFixed(1)}%`;
        const rawTags = item.palabrasClave || item.palabras_clave || [];
        const tags = Array.isArray(rawTags) ? rawTags.join(', ') : String(rawTags);

        return {
          id: item.id,
          content: item.contenidoOriginal || '',
          title: inferTitleFromContent(item.contenidoOriginal || ''),
          category,
          badgeClass,
          confidence,
          tags,
          latencyMs: item.tiempoProcesamientoMs || null,
          date: 'Relacionado',
          isLiveApi: true,
        };
      });
    }
  } catch (err) {
    console.warn('Error obteniendo recomendaciones:', err);
  }
  return [];
}

/**
 * Fetch Categories dynamic count (GET /api/categorias)
 */
export async function fetchCategories(apiUrl = DEFAULT_API_URL) {
  if (IS_MOCK_MODE) {
    return [
      { categoria: 'DevOps', total: 3 },
      { categoria: 'Backend', total: 3 },
      { categoria: 'Frontend', total: 2 },
      { categoria: 'Otros', total: 1 },
    ];
  }

  try {
    const response = await fetch(`${apiUrl}/categorias`);
    if (response.ok) {
      return await response.json();
    }
  } catch (err) {
    console.warn('Error obteniendo conteo de categorías:', err);
  }
  return [];
}

/**
 * Send User Feedback / Correction (POST /api/contenido/{id}/feedback)
 */
export async function sendFeedback(id, { categoriaSugerida, comentario = '' }, apiUrl = DEFAULT_API_URL) {
  if (!id || !categoriaSugerida) {
    throw new Error('ID y categoría sugerida son obligatorios para enviar feedback');
  }

  if (IS_MOCK_MODE) {
    return { id, categoria: categoriaSugerida, feedbackUsuario: comentario || 'Categoría corregida' };
  }

  const response = await fetch(`${apiUrl}/contenido/${id}/feedback`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      categoriaSugerida,
      comentario: comentario || `Categoría corregida a ${categoriaSugerida}`,
    }),
  });

  if (response.ok) {
    return await response.json();
  }

  throw new Error(`HTTP ${response.status}: No se pudo registrar el feedback.`);
}

/**
 * Bulk Batch Classification (POST /api/contenido/lote)
 */
export async function uploadBatchLote(textList, apiUrl = DEFAULT_API_URL) {
  if (!textList || textList.length === 0) {
    throw new Error('Debe proporcionar una lista de textos para procesar por lotes.');
  }

  if (IS_MOCK_MODE) {
    await new Promise((r) => setTimeout(r, 1200));
    return {
      archivos_procesados: textList.length,
      tiempo_total_ms: 1250.0,
      tiempo_promedio_por_texto_ms: 1250.0 / textList.length,
      resultados: textList.map((t, idx) => ({
        id: Date.now() + idx,
        contenidoOriginal: t,
        categoria: 'Backend',
        probabilidad: 0.92,
        palabrasClave: ['batch', 'demo'],
        tiempoProcesamientoMs: 50.0,
      })),
    };
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 60000); // 60s timeout for batch

  try {
    const response = await fetch(`${apiUrl}/contenido/lote`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ textos: textList }),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (response.ok) {
      return await response.json();
    }

    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.error || `HTTP ${response.status}: Error procesando el lote en Spring Boot.`);
  } catch (err) {
    clearTimeout(timeoutId);
    if (err.name === 'AbortError') {
      throw new Error('Timeout: El procesamiento del lote superó los 60 segundos.');
    }
    throw err;
  }
}

/**
 * Trigger K-Means Re-Clustering (POST /api/contenido/agrupar)
 */
export async function triggerReclustering(nClusters = null, apiUrl = DEFAULT_API_URL) {
  if (IS_MOCK_MODE) {
    await new Promise((resolve) => setTimeout(resolve, 1000));
    return {
      n_clusters: 8,
      n_documentos: 1204,
      clusters: INITIAL_CLUSTERS,
      tiempo_procesamiento_ms: 420.5,
    };
  }

  const url = nClusters ? `${apiUrl}/contenido/agrupar?n_clusters=${nClusters}` : `${apiUrl}/contenido/agrupar`;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000);

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (response.ok) {
      const data = await response.json();
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

    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.error || `HTTP ${response.status}: No se pudo ejecutar el clustering.`);
  } catch (err) {
    clearTimeout(timeoutId);
    if (err.name === 'AbortError') {
      throw new Error('Timeout: El análisis de clustering excedió el tiempo límite.');
    }
    throw err;
  }
}
