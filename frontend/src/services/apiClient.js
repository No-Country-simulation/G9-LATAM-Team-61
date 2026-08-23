/**
 * Base API Client with Timeout and Error Handling
 */

export const DEFAULT_API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api';

export const IS_MOCK_MODE =
  import.meta.env.VITE_ENABLE_DEMO === 'true' || import.meta.env.VITE_USE_MOCK === 'true';

export const INITIAL_DOCUMENTS = [];
export const INITIAL_CLUSTERS = [];

export function sanitizeInput(str) {
  if (typeof str !== 'string') return '';
  return str;
}

export function inferTitleFromContent(text) {
  if (!text) return 'Sin Título';
  const cleanText = text.trim();
  const firstLine = cleanText.split('\n')[0].substring(0, 35);
  return firstLine.charAt(0).toUpperCase() + firstLine.slice(1) + (cleanText.length > 35 ? '...' : '');
}

/**
 * Fetch wrapper with AbortController timeout and explicit error handling
 */
export async function request(endpoint, options = {}, timeoutMs = 10000, apiUrl = DEFAULT_API_URL) {
  const url = endpoint.startsWith('http') ? endpoint : `${apiUrl}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {}),
      },
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (response.ok) {
      return await response.json();
    }

    // Handle 4xx / 5xx error responses explicitly
    let errData = {};
    if (typeof response.json === 'function') {
      errData = await response.json().catch(() => ({}));
    }
    if (response.status === 400) {
      throw new Error(errData.error || errData.message || 'HTTP 400: Error de validación según el servidor backend.');
    }
    if (response.status === 502) {
      throw new Error('HTTP 502 Bad Gateway: El servidor de inferencia ML no está disponible.');
    }
    if (response.status === 504) {
      throw new Error('HTTP 504 Gateway Timeout: El análisis de inferencia excedió el tiempo límite.');
    }

    throw new Error(errData.error || errData.message || `HTTP ${response.status}: Error en el servidor de Spring Boot.`);
  } catch (err) {
    clearTimeout(timeoutId);
    if (err.name === 'AbortError') {
      throw new Error(`HTTP Timeout (${timeoutMs / 1000}s): La solicitud excedió el tiempo límite.`);
    }
    if (err.message && err.message.startsWith('HTTP')) {
      throw err;
    }
    throw new Error(`Error de conexión: No se pudo establecer comunicación con el servidor de Spring Boot (${apiUrl.replace('/api', '')}).`);
  }
}
