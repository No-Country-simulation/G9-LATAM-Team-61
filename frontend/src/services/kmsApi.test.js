import { describe, it, expect, vi, beforeEach } from 'vitest';
import { classifyContent, checkBackendHealth } from './kmsApi.js';

describe('KMS API Service Unit & Integration Tests (DevOps Verification Suite)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('1. Debe transformar correctamente palabrasClave, categoria y probabilidad cuando la API responde OK 200', async () => {
    const mockResponseData = {
      id_registro: 101,
      categoria: 'DevOps',
      probabilidad: 0.952,
      palabrasClave: ['oci', 'docker', 'ci-cd'],
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => mockResponseData,
    });

    const result = await classifyContent({ title: 'Servidores OCI', content: 'Configuración Docker en OCI para la infraestructura.' }, 'http://localhost:8080/api', false);

    expect(result.title).toBe('Servidores OCI');
    expect(result.category).toBe('DevOps');
    expect(result.confidence).toBe('95.2%');
    expect(result.tags).toBe('oci, docker, ci-cd');
    expect(result.isLiveApi).toBe(true);
  });

  it('2. Debe manejar y lanzar error explícito ante una respuesta HTTP 400 de error de validación', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 400,
    });

    await expect(classifyContent({ title: 'Test 400', content: 'Contenido corto valido' }, 'http://localhost:8080/api', false))
      .rejects
      .toThrow('HTTP 400: Error de validación según el servidor backend.');
  });

  it('3. Debe lanzar error 5xx / fallo de red SIN realizar fallback silencioso en Modo Real', async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error('Network Error'));

    await expect(classifyContent({ title: 'Test Fallo', content: 'Texto de prueba de fallo de conexión de red' }, 'http://localhost:8080/api', false))
      .rejects
      .toThrow('Error de conexión: No se pudo establecer comunicación con el servidor de Spring Boot (http://localhost:8080).');
  });

  it('4. Debe ejecutar el modo demostrativo local cuando se habilita explícitamente (forceDemoMode=true)', async () => {
    const result = await classifyContent({ title: 'Test Demo', content: 'Código React hooks useState useEffect' }, 'http://localhost:8080/api', true);

    expect(result.category).toBe('Frontend');
    expect(result.isLiveApi).toBe(false);
  });

  it('5. Debe validar los límites mínimos (10 chars) y máximos (10,000 chars) del formulario', async () => {
    // Menos de 10 caracteres
    await expect(classifyContent({ title: 'Corto', content: '123456789' }, 'http://localhost:8080/api', false))
      .rejects
      .toThrow('El contenido debe tener al menos 10 caracteres.');

    // Más de 10,000 caracteres
    const longContent = 'a'.repeat(10001);
    await expect(classifyContent({ title: 'Largo', content: longContent }, 'http://localhost:8080/api', false))
      .rejects
      .toThrow('El contenido excede el límite máximo permitido de 10,000 caracteres.');
  });

  it('6. Debe retornar false en checkBackendHealth si el servidor no responde', async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error('Network offline'));
    const isAlive = await checkBackendHealth('http://localhost:8080/api');
    expect(isAlive).toBe(false);
  });
});
