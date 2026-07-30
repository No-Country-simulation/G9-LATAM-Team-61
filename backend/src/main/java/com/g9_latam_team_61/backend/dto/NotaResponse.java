package com.g9_latam_team_61.backend.dto;

import java.time.LocalDateTime;
import java.util.List;

public record NotaResponse(
        Long id,
        String titulo,
        String categoria,
        Double probabilidad,
        List<String> palabrasClave,
        LocalDateTime fechaAnalisis

//        Long tiempo_procesamiento_ms,
//        List<Long> textos_similares,
//        String version_modelo,
//        String feedback_usuario
) {
}
