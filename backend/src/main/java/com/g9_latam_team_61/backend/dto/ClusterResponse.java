package com.g9_latam_team_61.backend.dto;

import java.time.LocalDateTime;
import java.util.List;

public record ClusterResponse(
        Integer id,
        String nombreSugerido,
        List<String> palabrasClaveTop,
        Integer totalDocumentos,
        LocalDateTime fechaGeneracion
) {
}
