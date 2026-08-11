package com.g9_latam_team_61.backend.dto;

import java.time.LocalDateTime;
import java.util.List;

public record NotaResponse(
        Long id,
        String contenidoOriginal,
        String categoria,
        Double probabilidad,
        List<String> palabrasClave,
        LocalDateTime fechaAnalisis,
        Double tiempoProcesamientoMs
) {
}
