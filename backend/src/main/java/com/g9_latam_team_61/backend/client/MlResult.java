package com.g9_latam_team_61.backend.client;

import java.util.List;

public record MlResult(
        String categoria,
        Double probabilidad,
        List<String> palabrasClave,
        Double tiempoProcesamientoMs
) {
}
