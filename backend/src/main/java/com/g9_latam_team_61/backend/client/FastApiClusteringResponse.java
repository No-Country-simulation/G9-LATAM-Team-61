package com.g9_latam_team_61.backend.client;

import java.util.List;

public record FastApiClusteringResponse(
        String cluster_id,
        Integer n_clusters,
        Integer n_documentos,
        List<FastApiClusterInfo> clusters,
        Double tiempo_procesamiento_ms
) {
}
