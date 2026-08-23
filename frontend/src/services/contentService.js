/**
 * Content Management API Service (Classification, Batch Upload, Feedback, Recommendations)
 */
import { request, sanitizeInput, inferTitleFromContent, DEFAULT_API_URL, IS_MOCK_MODE } from './apiClient.js';
import { runLocalClassificationSimulation, getMockRecommendations } from './mockFallback.js';

export const MIN_CONTENT_LENGTH = 30;
export const MAX_CONTENT_LENGTH = 5000;

/**
 * Single Content Classification (POST /api/contenido)
 */
export async function classifyContent(formData, apiUrl = DEFAULT_API_URL, forceDemoMode = false) {
  const content = (formData && formData.content ? formData.content : '').trim();

  if (content.length < MIN_CONTENT_LENGTH) {
    throw new Error(`El contenido debe tener al menos ${MIN_CONTENT_LENGTH} caracteres.`);
  }

  if (content.length > MAX_CONTENT_LENGTH) {
    throw new Error('El contenido excede el límite máximo permitido de 5,000 caracteres.');
  }

  if (forceDemoMode || IS_MOCK_MODE) {
    return runLocalClassificationSimulation(formData);
  }

  const data = await request(
    '/contenido',
    {
      method: 'POST',
      body: JSON.stringify({ descripcion: content }),
    },
    10000,
    apiUrl
  );

  const rawBody = data.contenidoOriginal || data.descripcion || content;

  return {
    id: data.id,
    title: sanitizeInput(inferTitleFromContent(rawBody)),
    content: sanitizeInput(rawBody),
    category: data.categoria || 'Otros',
    confidence: data.probabilidad !== undefined ? `${(data.probabilidad * 100).toFixed(1)}%` : '85.0%',
    probability: data.probabilidad || 0.85,
    tags: Array.isArray(data.palabrasClave) ? data.palabrasClave.join(', ') : '',
    date: 'Ahora',
    latencyMs: data.tiempoProcesamientoMs || null,
    isLiveApi: true,
  };
}

/**
 * Bulk Content Batch Upload (POST /api/contenido/lote)
 */
export async function uploadBatchLote(textos = [], apiUrl = DEFAULT_API_URL) {
  if (!Array.isArray(textos) || textos.length === 0) {
    throw new Error('Debe proporcionar al menos un texto válido para procesar por lotes.');
  }

  const validTextos = textos
    .map((t) => (typeof t === 'string' ? t.trim() : ''))
    .filter((t) => t.length >= MIN_CONTENT_LENGTH && t.length <= MAX_CONTENT_LENGTH);

  if (validTextos.length === 0) {
    throw new Error(
      `Ningún texto cumple con el rango válido requerido (${MIN_CONTENT_LENGTH} a ${MAX_CONTENT_LENGTH} caracteres).`
    );
  }

  if (IS_MOCK_MODE) {
    await new Promise((resolve) => setTimeout(resolve, 1500));
    return {
      archivos_procesados: validTextos.length,
      tiempo_total_ms: 220.0,
      tiempo_promedio_por_texto_ms: Math.round(220.0 / validTextos.length),
      resultados: [],
    };
  }

  return request(
    '/contenido/lote',
    {
      method: 'POST',
      body: JSON.stringify({ textos: validTextos }),
    },
    60000,
    apiUrl
  );
}

/**
 * Send User Feedback / Category Correction (POST /api/contenido/{id}/feedback)
 */
export async function sendFeedback(id, { categoriaSugerida, comentario }, apiUrl = DEFAULT_API_URL) {
  if (!id || !categoriaSugerida) {
    throw new Error('ID y categoría sugerida son obligatorios para enviar feedback');
  }

  if (IS_MOCK_MODE) {
    return { id, categoria: categoriaSugerida, feedbackUsuario: comentario || 'Categoría corregida' };
  }

  return request(
    `/contenido/${id}/feedback`,
    {
      method: 'POST',
      body: JSON.stringify({
        categoriaSugerida,
        comentario: comentario || `Categoría corregida a ${categoriaSugerida} por el usuario`,
      }),
    },
    8000,
    apiUrl
  );
}

/**
 * Fetch Recommended Similar Notes (GET /api/contenido/{id}/recomendados)
 */
export async function fetchRecommendations(id, limit = 5, apiUrl = DEFAULT_API_URL) {
  if (!id) {
    throw new Error('Se requiere un ID de documento para obtener recomendaciones');
  }

  if (IS_MOCK_MODE) {
    return getMockRecommendations(id);
  }

  try {
    const data = await request(`/contenido/${id}/recomendados?limit=${limit}`, { method: 'GET' }, 8000, apiUrl);
    const list = Array.isArray(data) ? data : data.recomendaciones || data.items || [];
    return list.map((item) => {
      const rawText = item.contenidoOriginal || item.descripcion || '';
      return {
        id: item.id,
        title: sanitizeInput(inferTitleFromContent(rawText)),
        content: sanitizeInput(rawText),
        category: item.categoria || 'General',
        tags: Array.isArray(item.palabrasClave) ? item.palabrasClave.join(', ') : item.tags || '',
        confidence: item.probabilidad !== undefined
          ? `${(item.probabilidad * 100).toFixed(1)}%`
          : item.similitud !== undefined
            ? `${(item.similitud * 100).toFixed(1)}%`
            : '85.0%',
        similarity: item.similitud ? `${Math.round(item.similitud * 100)}%` : '80%',
      };
    });
  } catch (err) {
    throw new Error(`Error obteniendo recomendaciones: ${err.message || 'Servicio no disponible'}`);
  }
}
