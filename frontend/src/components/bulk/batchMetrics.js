export function toFiniteMetric(value) {
  if (value == null || (typeof value === 'string' && value.trim() === '')) return null;

  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? numericValue : null;
}

function firstFiniteMetric(...values) {
  for (const value of values) {
    const numericValue = toFiniteMetric(value);
    if (numericValue !== null) return numericValue;
  }
  return null;
}

export function normalizeBatchSummary(summary, batchSize, clientElapsed) {
  const response = summary && typeof summary === 'object' ? summary : {};
  const processedCount =
    response.archivos_procesados ??
    response.archivosProcesados ??
    response.totalProcesados ??
    batchSize;
  const totalTime = firstFiniteMetric(
    response.tiempo_total_ms,
    response.tiempoTotalMs,
    clientElapsed
  );
  const averageTime =
    firstFiniteMetric(
      response.tiempo_promedio_por_texto_ms,
      response.tiempoPromedioPorTextoMs
    ) ??
    (batchSize > 0 && totalTime !== null ? totalTime / batchSize : null);

  return {
    ...response,
    archivos_procesados: processedCount,
    tiempo_total_ms: totalTime,
    tiempo_promedio_por_texto_ms: averageTime,
  };
}

export function formatMetric(value) {
  const numericValue = toFiniteMetric(value);
  return numericValue === null ? '\u2014' : `${numericValue.toFixed(1)} ms`;
}
