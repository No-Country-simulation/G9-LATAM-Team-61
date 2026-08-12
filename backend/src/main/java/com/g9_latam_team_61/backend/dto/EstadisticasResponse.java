package com.g9_latam_team_61.backend.dto;

import java.util.List;

public record EstadisticasResponse(
        long totalIndexados,
        Double confianzaPromedio,
        Double latenciaPromedioMs,
        long totalFeedback,
        List<CategoriaConteoResponse> categorias
) {
}
