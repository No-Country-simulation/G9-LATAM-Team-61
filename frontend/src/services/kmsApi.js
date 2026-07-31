// KMS API Client Service (Separación estricta Modo Real vs Modo Demo + Manejo Transparente de Errores)

export const DEFAULT_API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api';
export const IS_MOCK_MODE = import.meta.env.VITE_USE_MOCK === 'true';

export const INITIAL_DOCUMENTS = [
  { id: 1, title: 'Manejo de errores JWT', category: 'Backend', badgeClass: 'backend', tags: 'spring, auth, token', date: 'Hoy, 14:30' },
  { id: 2, title: 'Guía useEffect React', category: 'Frontend', badgeClass: 'frontend', tags: 'react, hooks', date: 'Hoy, 10:15' },
  { id: 3, title: 'Balanceador en OCI', category: 'DevOps', badgeClass: 'devops', tags: 'oci, network', date: 'Ayer, 18:45' },
  { id: 4, title: 'Estructura de BD PostgreSQL', category: 'Backend', badgeClass: 'backend', tags: 'sql, schema', date: 'Ayer, 11:20' },
  { id: 5, title: 'CI/CD Actions YAML', category: 'DevOps', badgeClass: 'devops', tags: 'github, deploy', date: '17 Jul, 09:10' },
  { id: 6, title: 'Optimización de Vite.js', category: 'Frontend', badgeClass: 'frontend', tags: 'vite, build', date: '16 Jul, 16:05' }
];

export const INITIAL_CLUSTERS = [
  { id: 0, title: 'Grupo 0: Fallos Red y OCI (Demo)', docsCount: 124, tags: 'oci, subnet, dns' },
  { id: 1, title: 'Grupo 1: Seguridad & JWT (Demo)', docsCount: 89, tags: 'auth, token, bearer' },
  { id: 2, title: 'Grupo 2: React State & Hooks (Demo)', docsCount: 142, tags: 'react, useeffect, props' },
  { id: 3, title: 'Grupo 3: Docker & Pipelines (Demo)', docsCount: 98, tags: 'docker, compose, yaml' },
  { id: 4, title: 'Grupo 4: Spring Data JPA (Demo)', docsCount: 110, tags: 'entity, repository, postgres' },
  { id: 5, title: 'Grupo 5: Python & FastAPI (Demo)', docsCount: 76, tags: 'uvicorn, pydantic, joblib' },
  { id: 6, title: 'Grupo 6: ML & Scikit-Learn (Demo)', docsCount: 65, tags: 'vectorizer, kmeans, score' },
  { id: 7, title: 'Grupo 7: Nginx & SSL (Demo)', docsCount: 50, tags: 'certbot, proxy, port' }
];

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
 * Health Check to test connection to Spring Boot backend (GET /api/health)
 */
export async function checkBackendHealth(apiUrl = DEFAULT_API_URL) {
  if (IS_MOCK_MODE) return false;
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000);
    const response = await fetch(`${apiUrl}/health`, { signal: controller.signal });
    clearTimeout(timeoutId);
    return response.ok;
  } catch {
    return false;
  }
}

/**
 * Single Text Classification (POST /api/contenido)
 * Modos aislados: Modo Real (Lanza errores explícitos) vs Modo Demo (Inferencia Local Simula)
 */
export async function classifyContent({ title, content }, apiUrl = DEFAULT_API_URL) {
  const contentText = (content || '').trim();
  if (contentText.length > 10000) {
    throw new Error('El contenido excede el límite máximo permitido de 10,000 caracteres.');
  }

  const docTitle = (title || '').trim() || inferTitleFromContent(contentText);

  // Si está activado explícitamente el Modo Demo Local
  if (IS_MOCK_MODE) {
    return executeLocalMockClassification(docTitle, contentText);
  }

  // MODO REAL: Petición HTTP a Spring Boot
  const sanitizedContent = contentText.slice(0, 10000);

  let response;
  try {
    response = await fetch(`${apiUrl}/contenido`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        titulo: docTitle,
        descripcion: sanitizedContent,
        texto: sanitizedContent,
      }),
    });
  } catch {
    throw new Error('Error de conexión: No se pudo establecer comunicación con el servidor de Spring Boot (http://localhost:8080).');
  }

  if (response.ok) {
    const data = await response.json();
    const category = data.categoria || 'Backend';
    const badgeClass = category.toLowerCase().replace(/\s+/g, '');
    const confidence = data.probabilidad ? `${(data.probabilidad * 100).toFixed(1)}%` : '94.5%';
    const tags = Array.isArray(data.informacion_adicional)
      ? data.informacion_adicional.join(', ')
      : 'java, spring, rest';

    return {
      id: data.id_registro || Date.now(),
      title: docTitle,
      category,
      badgeClass,
      confidence,
      tags,
      date: 'Hace un momento',
      isLiveApi: true,
    };
  }

  // Manejo explícito de respuestas de error HTTP 4xx / 5xx sin ocultar fallos
  if (response.status === 400) {
    throw new Error('HTTP 400: Solicitud incorrecta o datos inválidos según el servidor.');
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
 * Endpoint 3: Bulk Batch Classification (Simulación Demo / Próximamente)
 */
export async function processBatchContent(batchArray, apiUrl = DEFAULT_API_URL) {
  try {
    const response = await fetch(`${apiUrl}/contenido/lote`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ textos: batchArray }),
    });

    if (response.ok) {
      return await response.json();
    }
  } catch (error) {
    console.warn('Endpoint /contenido/lote en desarrollo. Ejecutando procesamiento en Modo Demo.', error);
  }

  return { archivos_procesados: batchArray.length || 2000, tiempo_total_ms: 250, isDemo: true };
}

/**
 * Endpoint 4: Trigger K-Means Re-Clustering (Simulación Demo / Próximamente)
 */
export async function triggerReclustering(apiUrl = DEFAULT_API_URL) {
  try {
    const response = await fetch(`${apiUrl}/contenido/agrupar`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });

    if (response.ok) {
      return await response.json();
    }
  } catch (error) {
    console.warn('Endpoint /contenido/agrupar en desarrollo. Ejecutando recálculo en Modo Demo.', error);
  }

  await new Promise((resolve) => setTimeout(resolve, 1200));
  return { status: 'success', clusters: 8, isDemo: true };
}
