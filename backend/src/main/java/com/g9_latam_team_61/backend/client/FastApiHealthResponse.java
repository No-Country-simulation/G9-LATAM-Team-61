package com.g9_latam_team_61.backend.client;

public record FastApiHealthResponse(
        String status,
        Boolean model_loaded
) {
}
