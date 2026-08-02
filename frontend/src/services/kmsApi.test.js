import { describe, it, expect, vi, beforeEach } from 'vitest';
import { classifyContent, checkBackendHealth } from './kmsApi.js';

describe('KMS API Service Unit & Integration Tests (DevOps Contract Verification Suite)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('1. Debe enviar estrictamente { titulo, descripcion } sin incluir el campo deprecado texto, y manejar respuestas 201 Created', async () => {
    const mockResponseData = {
      id_registro: 101,
      categoria: 'DevOps',
      probabilidad: 0.952,
      palabrasClave: ['oci', 'docker', 'ci-cd'],
    };

    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 201, // Acepta 201 Created de Spring Boot
      json: async () => mockResponseData,
    });

    global.fetch = mockFetch;

    const result = await classifyContent(
      { title: 'Servidores OCI', content: 'Configuración Docker en OCI para la infraestructura.' },
      'http://localhost:8080/api',
      false
    );

    // Aserción estricta sobre el contrato DTO enviado en el cuerpo de la petición HTTP
    expect(mockFetch).toHaveBeenCalledTimes(1);
    const fetchCallArgs = mockFetch.mock.calls[0];
    const sentBody = JSON.parse(fetchCallArgs[1].body);

    expect(sentBody).toHaveProperty('titulo', 'Servidores OCI');
    expect(sentBody).toHaveProperty('descripcion', 'Configuración Docker en OCI para la infraestructura.');
    expect(sentBody.texto).toBeUndefined(); // Garantiza que NO se envía el campo 'texto'

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
    await expect(classifyContent({ title: 'Corto', content: '123456789' }, 'http://localhost:8080/api', false))
      .rejects
      .toThrow('El contenido debe tener al menos 10 caracteres.');

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
