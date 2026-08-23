import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useKmsData } from './useKmsData.js';
import * as kmsApi from '../services/kmsApi.js';

describe('useKmsData Hook Real Lifecycle & State Transitions (DevOps B1 Verification Suite)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    // Default mocks para servicios auxiliares
    vi.spyOn(kmsApi, 'fetchStats').mockResolvedValue({ total: 10, categories: {} });
    vi.spyOn(kmsApi, 'fetchCategories').mockResolvedValue(['Backend', 'Frontend', 'DevOps']);
    vi.spyOn(kmsApi, 'checkBackendHealth').mockResolvedValue(true);
  });

  it('1. Comprueba transición: registros existentes -> respuesta válida [] que limpia documents en la misma instancia', async () => {
    // 1. Carga inicial con 1 registro
    const initialItems = [
      { id: 1, content: 'Nota técnica inicial en PostgreSQL.', category: 'Backend' },
    ];
    vi.spyOn(kmsApi, 'fetchHistory').mockResolvedValueOnce({ items: initialItems });

    const { result } = renderHook(() => useKmsData(vi.fn()));

    // Esperar a que useEffect ejecute la carga inicial en el ciclo de vida del hook
    await waitFor(() => {
      expect(result.current.documents).toHaveLength(1);
      expect(result.current.documents[0].content).toBe('Nota técnica inicial en PostgreSQL.');
      expect(result.current.historyError).toBeNull();
    });

    // 2. Transición hacia respuesta vacía [] en la MISMA instancia
    vi.spyOn(kmsApi, 'fetchHistory').mockResolvedValueOnce({ items: [] });

    await act(async () => {
      await result.current.reloadDashboardData();
    });

    // Comprobar que documents quedó completamente limpio ([])
    await waitFor(() => {
      expect(result.current.documents).toEqual([]);
      expect(result.current.historyError).toBeNull();
    });
  });

  it('2. Comprueba rechazo / error -> historyError informado correctamente en el estado del hook', async () => {
    const errorMsg = 'HTTP 500: Fallo en el servidor de base de datos';
    vi.spyOn(kmsApi, 'fetchHistory').mockRejectedValue(new Error(errorMsg));

    const { result } = renderHook(() => useKmsData(vi.fn()));

    // Esperar a que useEffect capture el rechazo en el ciclo de vida
    await waitFor(() => {
      expect(result.current.historyError).toBe(errorMsg);
    });
  });

  it('3. Comprueba que una siguiente respuesta exitosa limpia el error anterior y actualiza documentos', async () => {
    // 1. Estado inicial con error
    const errorMsg = 'Error de conexión inicial';
    vi.spyOn(kmsApi, 'fetchHistory').mockRejectedValueOnce(new Error(errorMsg));

    const { result } = renderHook(() => useKmsData(vi.fn()));

    await waitFor(() => {
      expect(result.current.historyError).toBe(errorMsg);
    });

    // 2. Siguiente carga exitosa en la MISMA instancia
    const recoveredDocs = [
      { id: 100, content: 'Documento recuperado tras reconexión.', category: 'DevOps' },
    ];
    vi.spyOn(kmsApi, 'fetchHistory').mockResolvedValueOnce({ items: recoveredDocs });

    await act(async () => {
      await result.current.reloadDashboardData();
    });

    // Comprobar que el error anterior fue limpiado y los nuevos documentos se cargaron
    await waitFor(() => {
      expect(result.current.historyError).toBeNull();
      expect(result.current.documents).toHaveLength(1);
      expect(result.current.documents[0].content).toBe('Documento recuperado tras reconexión.');
    });
  });

  it('4. Comprueba health falso o rechazado con historial exitoso -> documentos cargados igualmente (desacoplamiento total)', async () => {
    // Healthcheck fallido (false o rechazo)
    vi.spyOn(kmsApi, 'checkBackendHealth').mockResolvedValue(false);

    // Historial exitoso con documentos
    const historyDocs = [
      { id: 50, content: 'Documento cargado independientemente del health.', category: 'Frontend' },
    ];
    vi.spyOn(kmsApi, 'fetchHistory').mockResolvedValueOnce({ items: historyDocs });

    const { result } = renderHook(() => useKmsData(vi.fn()));

    // Comprobar que a pesar de que health retorna false, fetchHistory procesó y cargó los documentos
    await waitFor(() => {
      expect(result.current.documents).toHaveLength(1);
      expect(result.current.documents[0].content).toBe('Documento cargado independientemente del health.');
      expect(result.current.historyError).toBeNull();
    });
  });
});
