package com.g9_latam_team_61.backend.client;

import java.util.List;

public record FastApiLoteResponse(
        Integer archivos_procesados,
        Double tiempo_total_ms,
        Double tiempo_promedio_por_texto_ms,
        List<FastApiResponse> resultados
) {
}
