import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  classifyContent,
  checkBackendHealth,
  fetchHistory,
  searchContent,
  triggerReclustering,
  uploadBatchLote,
  sendFeedback,
  fetchRecommendations,
} from './kmsApi.js';

describe('KMS API Service Unit & Integration Tests (DevOps Contract Verification Suite)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('1. Debe enviar estrictamente { descripcion } al backend sin campo titulo y manejar 201 Created', async () => {
    const mockResponseData = {
      id: 101,
      contenidoOriginal: 'Configuración Docker en OCI para la infraestructura de balanceadores.',
      categoria: 'DevOps',
      probabilidad: 0.952,
      palabrasClave: ['oci', 'docker', 'ci-cd'],
      tiempoProcesamientoMs: 24.5,
    };

    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 201,
      json: async () => mockResponseData,
    });

    global.fetch = mockFetch;

    const result = await classifyContent(
      { content: 'Configuración Docker en OCI para la infraestructura de balanceadores.' },
      'http://localhost:8080/api',
      false
    );

    // Aserción estricta sobre el contrato DTO enviado en el cuerpo de la petición HTTP
    expect(mockFetch).toHaveBeenCalledTimes(1);
    const fetchCallArgs = mockFetch.mock.calls[0];
    const sentBody = JSON.parse(fetchCallArgs[1].body);

    expect(sentBody).toHaveProperty('descripcion', 'Configuración Docker en OCI para la infraestructura de balanceadores.');
    expect(sentBody.titulo).toBeUndefined(); // Garantiza que NO se envía el campo 'titulo'
    expect(sentBody.texto).toBeUndefined(); // Garantiza que NO se envía el campo 'texto'

    expect(result.category).toBe('DevOps');
    expect(result.confidence).toBe('95.2%');
    expect(result.tags).toBe('oci, docker, ci-cd');
    expect(result.latencyMs).toBe(24.5);
    expect(result.isLiveApi).toBe(true);
  });

  it('2. Debe validar los límites estrictos de frontera individual: 29, 30, 5000 y 5001 caracteres', async () => {
    // 29 caracteres -> Rechazado
    const text29 = 'A'.repeat(29);
    await expect(classifyContent({ content: text29 }, 'http://localhost:8080/api', false))
      .rejects
      .toThrow('El contenido debe tener al menos 30 caracteres.');

    // 5001 caracteres -> Rechazado
    const text5001 = 'A'.repeat(5001);
    await expect(classifyContent({ content: text5001 }, 'http://localhost:8080/api', false))
      .rejects
      .toThrow('El contenido excede el límite máximo permitido de 5,000 caracteres.');

    // 30 y 5000 caracteres -> Aceptados
    const mockResponse = {
      id: 102,
      contenidoOriginal: 'Texto válido',
      categoria: 'Backend',
      probabilidad: 0.9,
    };
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => mockResponse,
    });

    const text30 = 'Texto valido de prueba 30 car!';
    expect(text30.length).toBe(30);
    const res30 = await classifyContent({ content: text30 }, 'http://localhost:8080/api', false);
    expect(res30.id).toBe(102);

    const text5000 = 'A'.repeat(5000);
    const res5000 = await classifyContent({ content: text5000 }, 'http://localhost:8080/api', false);
    expect(res5000.id).toBe(102);
  });

  it('3. uploadBatchLote debe validar que los textos cumplan el rango de 30 a 5000 caracteres', async () => {
    // Caso con elementos inválidos (<30 o >5000)
    const invalidBatch = ['muy corto', 'A'.repeat(5001)];
    await expect(uploadBatchLote(invalidBatch, 'http://localhost:8080/api'))
      .rejects
      .toThrow('Ningún texto cumple con el rango válido requerido (30 a 5000 caracteres).');

    // Caso con elementos válidos
    const validBatch = [
      'Texto técnico número uno para clasificar por lote masivo en backend.',
      'Texto técnico número dos para clasificar por lote masivo en backend.'
    ];

    const mockBatchResponse = {
      archivos_procesados: 2,
      tiempo_total_ms: 200.0,
      tiempo_promedio_por_texto_ms: 100.0,
      resultados: []
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => mockBatchResponse,
    });

    const result = await uploadBatchLote(validBatch, 'http://localhost:8080/api');
    expect(result.archivos_procesados).toBe(2);
  });

  it('4. fetchHistory debe consultar /api/contenido de forma autónoma e independiente de /api/health', async () => {
    const mockHistoryData = [
      {
        id: 1,
        contenidoOriginal: 'Configuración Docker en OCI para la infraestructura de balanceadores.',
        categoria: 'DevOps',
        probabilidad: 0.94,
        palabrasClave: ['oci', 'docker'],
        fechaAnalisis: '2026-08-12T10:00:00',
        tiempoProcesamientoMs: 30.0,
      }
    ];

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => mockHistoryData,
    });

    const history = await fetchHistory('', 0, 20, 'http://localhost:8080/api');
    expect(global.fetch).toHaveBeenCalledWith(
      'http://localhost:8080/api/contenido?page=0&size=20',
      expect.objectContaining({ method: 'GET' })
    );
    expect(history.items).toHaveLength(1);
    expect(history.items[0].content).toBe('Configuración Docker en OCI para la infraestructura de balanceadores.');
    expect(history.items[0].category).toBe('DevOps');
  });

  it('5. fetchHistory debe manejar correctamente una respuesta válida vacía ([]) sin errores', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => [],
    });

    const history = await fetchHistory('', 0, 20, 'http://localhost:8080/api');
    expect(history.items).toEqual([]);
    expect(history.totalElements).toBe(0);
    expect(history.totalPages).toBe(1);
  });

  it('6. fetchHistory debe propagar el error ante fallo de red o HTTP sin enmascararlo como lista vacía', async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error('Network timeout failure'));

    await expect(fetchHistory('', 0, 20, 'http://localhost:8080/api'))
      .rejects
      .toThrow();
  });

  it('7. Debe manejar y lanzar error explícito ante una respuesta HTTP 400 de error de validación', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 400,
    });

    await expect(classifyContent({ content: 'Contenido técnico válido mayor a 30 caracteres para prueba.' }, 'http://localhost:8080/api', false))
      .rejects
      .toThrow('HTTP 400: Error de validación según el servidor backend.');
  });

  it('8. Debe lanzar error 5xx / fallo de red SIN realizar fallback silencioso en Modo Real', async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error('Network Error'));

    await expect(classifyContent({ content: 'Texto de prueba de fallo de conexión de red mayor a 30 caracteres.' }, 'http://localhost:8080/api', false))
      .rejects
      .toThrow('Error de conexión: No se pudo establecer comunicación con el servidor de Spring Boot (http://localhost:8080).');
  });

  it('9. Debe ejecutar el modo demostrativo local cuando se habilita explícitamente (forceDemoMode=true)', async () => {
    const result = await classifyContent({ content: 'Código React hooks useState useEffect para el frontend de la aplicación web.' }, 'http://localhost:8080/api', true);

    expect(result.category).toBe('Frontend');
    expect(result.isLiveApi).toBe(false);
  });

  it('10. Debe retornar false en checkBackendHealth si el servidor no responde', async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error('Network offline'));
    const isAlive = await checkBackendHealth('http://localhost:8080/api');
    expect(isAlive).toBe(false);
  });

  it('11. searchContent debe invocar GET /api/buscar?q=... y mapear los resultados', async () => {
    const mockSearchResults = [
      {
        id: 7,
        contenidoOriginal: 'Implementación de arquitectura con Docker y Kubernetes.',
        categoria: 'DevOps',
        probabilidad: 0.88,
        palabrasClave: ['docker', 'kubernetes'],
        fechaAnalisis: '2026-08-12T14:00:00',
        tiempoProcesamientoMs: 35.0,
      }
    ];

    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockSearchResults,
    });
    global.fetch = mockFetch;

    const results = await searchContent('docker', 'http://localhost:8080/api');
    expect(mockFetch).toHaveBeenCalledWith(
      'http://localhost:8080/api/buscar?q=docker',
      expect.objectContaining({ method: 'GET' })
    );
    expect(results).toHaveLength(1);
    expect(results[0].category).toBe('DevOps');
    expect(results[0].tags).toBe('docker, kubernetes');
  });

  it('12. triggerReclustering debe invocar POST /api/contenido/agrupar y estructurar clusters', async () => {
    const mockAgruparResponse = {
      n_clusters: 2,
      n_documentos: 10,
      tiempo_procesamiento_ms: 120.5,
      clusters: [
        {
          id: 0,
          nombreSugerido: 'Balanceadores OCI',
          palabrasClaveTop: ['oci', 'docker', 'loadbalancer'],
          totalDocumentos: 6,
          fechaGeneracion: '2026-08-12T14:30:00'
        }
      ]
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockAgruparResponse,
    });

    const result = await triggerReclustering(null, 'http://localhost:8080/api');
    expect(global.fetch).toHaveBeenCalledWith('http://localhost:8080/api/contenido/agrupar', expect.objectContaining({ method: 'POST' }));
    expect(result.n_clusters).toBe(2);
    expect(result.clusters[0].title).toBe('Balanceadores OCI');
    expect(result.clusters[0].docsCount).toBe(6);
  });

  it('13. sendFeedback debe invocar POST /api/contenido/{id}/feedback', async () => {
    const mockFeedbackResponse = {
      id: 5,
      categoria: 'Backend',
      feedbackUsuario: 'Categoría corregida a Backend'
    };

    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockFeedbackResponse,
    });
    global.fetch = mockFetch;

    const result = await sendFeedback(5, { categoriaSugerida: 'Backend', comentario: 'Corregido' }, 'http://localhost:8080/api');
    expect(mockFetch).toHaveBeenCalledWith(
      'http://localhost:8080/api/contenido/5/feedback',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ categoriaSugerida: 'Backend', comentario: 'Corregido' })
      })
    );
    expect(result.categoria).toBe('Backend');
  });

  it('14. fetchRecommendations debe invocar GET /api/contenido/{id}/recomendados', async () => {
    const mockRecs = [
      {
        id: 2,
        contenidoOriginal: 'Guía de hooks y useState en React.',
        categoria: 'Frontend',
        probabilidad: 0.90,
        palabrasClave: ['react', 'hooks'],
      }
    ];

    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockRecs,
    });
    global.fetch = mockFetch;

    const recs = await fetchRecommendations(1, 5, 'http://localhost:8080/api');
    expect(mockFetch).toHaveBeenCalledWith(
      'http://localhost:8080/api/contenido/1/recomendados?limit=5',
      expect.objectContaining({ method: 'GET' })
    );
    expect(recs).toHaveLength(1);
    expect(recs[0].category).toBe('Frontend');
  });
});
