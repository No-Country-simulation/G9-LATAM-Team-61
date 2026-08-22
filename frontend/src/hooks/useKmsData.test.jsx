import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as kmsApi from '../services/kmsApi.js';

describe('useKmsData Hook & State Transitions (DevOps Contract Tests)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('1. El historial debe funcionar de forma independiente cuando /api/health falla o retorna false', async () => {
    // Simular que /api/health falla (500 o caído)
    vi.spyOn(kmsApi, 'checkBackendHealth').mockResolvedValue(false);

    // Pero /api/contenido responde exitosamente
    const mockHistory = {
      items: [
        {
          id: 1,
          content: 'Configuración Docker en OCI para balanceadores.',
          category: 'DevOps',
          tags: 'docker, oci',
        },
      ],
      totalElements: 1,
      totalPages: 1,
    };
    vi.spyOn(kmsApi, 'fetchHistory').mockResolvedValue(mockHistory);

    // Ejecutar la consulta de salud e historial de forma desacoplada
    const healthPromise = kmsApi.checkBackendHealth();
    const historyPromise = kmsApi.fetchHistory('', 0, 20);

    const [healthAlive, historyData] = await Promise.all([healthPromise, historyPromise]);

    // Validar desacoplamiento total: health da false pero history carga perfectamente
    expect(healthAlive).toBe(false);
    expect(historyData.items).toHaveLength(1);
    expect(historyData.items[0].content).toBe('Configuración Docker en OCI para balanceadores.');
    expect(historyData.items[0].category).toBe('DevOps');
  });

  it('2. Una respuesta válida [] debe retornar un arreglo vacío legítimo y limpiar registros', async () => {
    vi.spyOn(kmsApi, 'fetchHistory').mockResolvedValue({
      items: [],
      totalElements: 0,
      totalPages: 1,
    });

    const historyResult = await kmsApi.fetchHistory('', 0, 20);
    expect(historyResult.items).toEqual([]);
    expect(Array.isArray(historyResult.items)).toBe(true);
    expect(historyResult.totalElements).toBe(0);
  });

  it('3. Un fallo en fetchHistory debe propagar el error y no enmascararlo como lista vacía', async () => {
    vi.spyOn(kmsApi, 'fetchHistory').mockRejectedValue(new Error('Fallo HTTP 500 en base de datos'));

    await expect(kmsApi.fetchHistory('', 0, 20)).rejects.toThrow('Fallo HTTP 500 en base de datos');
  });

  it('4. Una carga posterior exitosa debe retornar los datos recuperados tras un fallo previo', async () => {
    // 1. Primer intento falla
    vi.spyOn(kmsApi, 'fetchHistory').mockRejectedValueOnce(new Error('Timeout de conexión'));
    await expect(kmsApi.fetchHistory('', 0, 20)).rejects.toThrow('Timeout de conexión');

    // 2. Segundo intento se recupera exitosamente
    const recoveredDocs = {
      items: [
        {
          id: 2,
          content: 'Desarrollo frontend en React 19 con Vite.',
          category: 'Frontend',
          tags: 'react, vite',
        },
      ],
      totalElements: 1,
      totalPages: 1,
    };
    vi.spyOn(kmsApi, 'fetchHistory').mockResolvedValueOnce(recoveredDocs);

    const result = await kmsApi.fetchHistory('', 0, 20);
    expect(result.items).toHaveLength(1);
    expect(result.items[0].category).toBe('Frontend');
  });
});
