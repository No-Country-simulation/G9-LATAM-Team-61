package com.g9_latam_team_61.backend.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import java.util.List;

public record LoteResponse(
        @JsonProperty("archivos_procesados")
        int archivosProcesados,

        @JsonProperty("tiempo_total_ms")
        Double tiempoTotalMs,

        @JsonProperty("tiempo_promedio_por_texto_ms")
        Double tiempoPromedioPorTextoMs,

        List<NotaResponse> resultados
) {
}
