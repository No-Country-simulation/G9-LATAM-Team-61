package com.g9_latam_team_61.backend.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import java.util.List;

public record AgruparResponse(
        @JsonProperty("n_clusters")
        int nClusters,

        @JsonProperty("n_documentos")
        int nDocumentos,

        List<ClusterResponse> clusters,

        @JsonProperty("tiempo_procesamiento_ms")
        Double tiempoProcesamientoMs
) {
}
