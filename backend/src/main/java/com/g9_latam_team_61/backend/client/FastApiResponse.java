package com.g9_latam_team_61.backend.client;

import java.util.List;

public record FastApiResponse(
        String categoria,
        Double probabilidad,
        List<String> palabras_clave,
        Double tiempo_procesamiento_ms
){}
