package com.g9_latam_team_61.backend.client;

import java.util.List;

public record FastApiClusteringRequest(
        List<FastApiDocumentoCluster> documentos,
        Integer n_clusters,
        String algoritmo,
        String idioma
) {
}
