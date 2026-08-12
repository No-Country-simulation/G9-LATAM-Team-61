package com.g9_latam_team_61.backend.dto;

import java.util.Map;

public record HealthResponse(
        String status,
        Map<String, Object> componentes
) {
}
