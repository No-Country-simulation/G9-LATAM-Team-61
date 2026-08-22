package com.g9_latam_team_61.backend.client;

import java.util.List;

public record FastApiClusterInfo(
        Integer cluster_id,
        Integer tamano,
        List<String> palabras_clave,
        String etiqueta_sugerida,
        List<String> documentos,
        List<String> documento_ids
) {
    public FastApiClusterInfo(Integer cluster_id, Integer tamano, List<String> palabras_clave, String etiqueta_sugerida, List<String> documentos) {
        this(cluster_id, tamano, palabras_clave, etiqueta_sugerida, documentos, null);
    }
}
