import { describe, it, expect, vi, beforeEach } from 'vitest';
import { classifyContent, checkBackendHealth } from './kmsApi.js';

describe('KMS API Service Unit Tests', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('debe rechazar solicitudes donde el contenido exceda los 10,000 caracteres', async () => {
    const longContent = 'a'.repeat(10001);
    await expect(classifyContent({ title: 'Test', content: longContent }))
      .rejects
      .toThrow('El contenido excede el límite máximo permitido de 10,000 caracteres.');
  });

  it('debe procesar exitosamente la inferencia cuando la API responde OK 200', async () => {
    const mockResponseData = {
      id_registro: 101,
      categoria: 'DevOps',
      probabilidad: 0.94,
      informacion_adicional: ['oci', 'docker'],
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => mockResponseData,
    });

    const result = await classifyContent({ title: 'Servidores OCI', content: 'Configuración Docker en OCI' });

    expect(result.title).toBe('Servidores OCI');
    expect(result.category).toBe('DevOps');
    expect(result.confidence).toBe('94.0%');
    expect(result.isLiveApi).toBe(true);
  });

  it('debe lanzar error de HTTP 502 cuando el servicio de inferencia no responde', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 502,
    });

    await expect(classifyContent({ title: 'Test 502', content: 'Prueba de fallo 502' }))
      .rejects
      .toThrow('HTTP 502 Bad Gateway: El servidor de inferencia ML no está disponible.');
  });

  it('debe retornar false en checkBackendHealth si la respuesta falla o expira', async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error('Network offline'));
    const isAlive = await checkBackendHealth('http://localhost:8080/api');
    expect(isAlive).toBe(false);
  });
});
