import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  classifyContent,
  checkBackendHealth,
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

  it('1. Debe enviar estrictamente { descripcion } al backend y manejar respuestas 201 Created', async () => {
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
      status: 201, // Acepta 201 Created de Spring Boot
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

  it('2. Debe manejar y lanzar error explícito ante una respuesta HTTP 400 de error de validación', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 400,
    });

    await expect(classifyContent({ content: 'Contenido técnico válido mayor a 30 caracteres para prueba.' }, 'http://localhost:8080/api', false))
      .rejects
      .toThrow('HTTP 400: Error de validación según el servidor backend.');
  });

  it('3. Debe lanzar error 5xx / fallo de red SIN realizar fallback silencioso en Modo Real', async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error('Network Error'));

    await expect(classifyContent({ content: 'Texto de prueba de fallo de conexión de red mayor a 30 caracteres.' }, 'http://localhost:8080/api', false))
      .rejects
      .toThrow('Error de conexión: No se pudo establecer comunicación con el servidor de Spring Boot (http://localhost:8080).');
  });

  it('4. Debe ejecutar el modo demostrativo local cuando se habilita explícitamente (forceDemoMode=true)', async () => {
    const result = await classifyContent({ content: 'Código React hooks useState useEffect para el frontend de la aplicación web.' }, 'http://localhost:8080/api', true);

    expect(result.category).toBe('Frontend');
    expect(result.isLiveApi).toBe(false);
  });

  it('5. Debe validar los límites mínimos (30 chars) y máximos (5,000 chars) del formulario', async () => {
    await expect(classifyContent({ content: 'Texto corto menor a 30' }, 'http://localhost:8080/api', false))
      .rejects
      .toThrow('El contenido debe tener al menos 30 caracteres.');

    const longContent = 'a'.repeat(5001);
    await expect(classifyContent({ content: longContent }, 'http://localhost:8080/api', false))
      .rejects
      .toThrow('El contenido excede el límite máximo permitido de 5,000 caracteres.');
  });

  it('6. Debe retornar false en checkBackendHealth si el servidor no responde', async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error('Network offline'));
    const isAlive = await checkBackendHealth('http://localhost:8080/api');
    expect(isAlive).toBe(false);
  });

  it('7. searchContent debe invocar GET /api/buscar?q=... y mapear los resultados', async () => {
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

  it('8. triggerReclustering debe invocar POST /api/contenido/agrupar y estructurar clusters', async () => {
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

  it('9. uploadBatchLote debe invocar POST /api/contenido/lote enviando { textos }', async () => {
    const mockBatchResponse = {
      archivos_procesados: 2,
      tiempo_total_ms: 200.0,
      tiempo_promedio_por_texto_ms: 100.0,
      resultados: []
    };

    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockBatchResponse,
    });
    global.fetch = mockFetch;

    const textos = [
      'Texto técnico número uno para clasificar por lote masivo en backend.',
      'Texto técnico número dos para clasificar por lote masivo en backend.'
    ];

    const result = await uploadBatchLote(textos, 'http://localhost:8080/api');
    expect(mockFetch).toHaveBeenCalledTimes(1);
    const sentBody = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(sentBody).toHaveProperty('textos');
    expect(sentBody.textos).toHaveLength(2);
    expect(result.archivos_procesados).toBe(2);
  });

  it('10. sendFeedback debe invocar POST /api/contenido/{id}/feedback', async () => {
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

  it('11. fetchRecommendations debe invocar GET /api/contenido/{id}/recomendados', async () => {
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

    const recs = await fetchRecommendations(1, 'http://localhost:8080/api');
    expect(mockFetch).toHaveBeenCalledWith(
      'http://localhost:8080/api/contenido/1/recomendados',
      expect.objectContaining({ method: 'GET' })
    );
    expect(recs).toHaveLength(1);
    expect(recs[0].category).toBe('Frontend');
  });
});
