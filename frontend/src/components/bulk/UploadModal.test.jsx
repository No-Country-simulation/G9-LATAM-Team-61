import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { UploadModal } from './UploadModal.jsx';
import {
  formatMetric,
  normalizeBatchSummary,
  toFiniteMetric,
} from './batchMetrics.js';

describe('UploadModal batch metrics', () => {
  it('mantiene el modal visible y muestra las métricas snake_case de la respuesta real', async () => {
    const onClose = vi.fn();
    const onProcessBatch = vi.fn().mockResolvedValue({
      mensaje: 'Lote procesado exitosamente',
      archivos_procesados: 6,
      tiempo_total_ms: 120,
      tiempo_promedio_por_texto_ms: 20,
      resultados: [],
    });

    render(
      <UploadModal
        isOpen
        onClose={onClose}
        onProcessBatch={onProcessBatch}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /cargar dataset de ejemplo/i }));
    fireEvent.click(screen.getByRole('button', { name: /procesar 6 notas/i }));

    await waitFor(() => expect(screen.getByText('Lote procesado e indexado con éxito')).toBeTruthy());
    expect(screen.getByRole('dialog')).toBeTruthy();
    expect(onClose).not.toHaveBeenCalled();
    expect(screen.getByText('120.0 ms')).toBeTruthy();
    expect(screen.getByText('20.0 ms')).toBeTruthy();
  });

  it('normaliza métricas camelCase y strings numéricos válidos', () => {
    expect(
      normalizeBatchSummary(
        {
          archivosProcesados: 1,
          tiempoTotalMs: '15.5',
          tiempoPromedioPorTextoMs: '15.5',
        },
        1,
        99
      )
    ).toMatchObject({
      archivos_procesados: 1,
      tiempo_total_ms: 15.5,
      tiempo_promedio_por_texto_ms: 15.5,
    });
  });

  it('usa el tiempo cliente como fallback y calcula el promedio para uno o varios elementos', () => {
    expect(normalizeBatchSummary({}, 4, 80)).toMatchObject({
      archivos_procesados: 4,
      tiempo_total_ms: 80,
      tiempo_promedio_por_texto_ms: 20,
    });
    expect(normalizeBatchSummary({}, 1, 12)).toMatchObject({
      archivos_procesados: 1,
      tiempo_total_ms: 12,
      tiempo_promedio_por_texto_ms: 12,
    });
  });

  it('preserva métricas y conteo explícitos con valor 0', () => {
    expect(
      normalizeBatchSummary(
        {
          archivos_procesados: 0,
          tiempo_total_ms: 0,
          tiempo_promedio_por_texto_ms: 0,
        },
        3,
        50
      )
    ).toMatchObject({
      archivos_procesados: 0,
      tiempo_total_ms: 0,
      tiempo_promedio_por_texto_ms: 0,
    });
    expect(formatMetric(0)).toBe('0.0 ms');
  });

  it.each([NaN, Infinity, -Infinity, 'NaN', 'sin métrica', '', null, undefined])(
    'rechaza el valor no finito o inválido %s sin mostrar NaN/Infinity',
    (invalidValue) => {
      expect(toFiniteMetric(invalidValue)).toBeNull();
      expect(formatMetric(invalidValue)).toBe('\u2014');
    }
  );

  it('usa fallback finito ante métricas backend inválidas', () => {
    expect(
      normalizeBatchSummary(
        {
          tiempo_total_ms: Infinity,
          tiempo_promedio_por_texto_ms: 'inválido',
        },
        2,
        40
      )
    ).toMatchObject({
      tiempo_total_ms: 40,
      tiempo_promedio_por_texto_ms: 20,
    });
  });

  it('maneja un lote vacío sin producir NaN ni Infinity', () => {
    const summary = normalizeBatchSummary({}, 0, 0);

    expect(summary.archivos_procesados).toBe(0);
    expect(summary.tiempo_total_ms).toBe(0);
    expect(summary.tiempo_promedio_por_texto_ms).toBeNull();
    expect(formatMetric(summary.tiempo_promedio_por_texto_ms)).toBe('\u2014');
  });
});
