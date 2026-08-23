package com.g9_latam_team_61.backend.service;

import com.g9_latam_team_61.backend.client.FastApiClusterInfo;
import com.g9_latam_team_61.backend.client.FastApiClusteringResponse;
import com.g9_latam_team_61.backend.dto.AgruparResponse;
import com.g9_latam_team_61.backend.dto.ClusterResponse;
import com.g9_latam_team_61.backend.model.Cluster;
import com.g9_latam_team_61.backend.model.Nota;
import com.g9_latam_team_61.backend.repository.ClusterRepository;
import com.g9_latam_team_61.backend.repository.NotaRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ClusterPersistenceService {

    private final NotaRepository notaRepository;
    private final ClusterRepository clusterRepository;

    @Transactional
    public AgruparResponse aplicarClustering(List<Nota> todasLasNotas, FastApiClusteringResponse mlResponse) {
        // 1. Limpiar asignaciones en notas y clusters existentes
        todasLasNotas.forEach(nota -> nota.setClusterId(null));
        notaRepository.saveAll(todasLasNotas);
        clusterRepository.deleteAll();

        // 2. Guardar nuevos clusters y vincular notas
        List<ClusterResponse> clusterResponses = new ArrayList<>();
        if (mlResponse.clusters() != null) {
            for (FastApiClusterInfo info : mlResponse.clusters()) {
                Cluster cluster = new Cluster();
                cluster.setId(info.cluster_id());
                cluster.setNombreSugerido(info.etiqueta_sugerida() != null && !info.etiqueta_sugerida().isBlank()
                        ? info.etiqueta_sugerida()
                        : "Cluster " + info.cluster_id());
                cluster.setPalabrasClaveTop(info.palabras_clave() != null ? info.palabras_clave() : List.of());
                cluster.setTotalDocumentos(info.tamano() != null ? info.tamano() : 0);

                Cluster clusterGuardado = clusterRepository.save(cluster);

                // Asignar cluster_id a las notas del cluster (prioriza documento_ids para membresía completa y no ambigua)
                if (info.documento_ids() != null && !info.documento_ids().isEmpty()) {
                    for (Nota nota : todasLasNotas) {
                        if (nota.getId() != null && info.documento_ids().contains(String.valueOf(nota.getId()))) {
                            nota.setClusterId(clusterGuardado.getId());
                        }
                    }
                } else if (info.documentos() != null) {
                    for (Nota nota : todasLasNotas) {
                        if (info.documentos().contains(nota.getContenidoOriginal())) {
                            nota.setClusterId(clusterGuardado.getId());
                        }
                    }
                }

                clusterResponses.add(new ClusterResponse(
                        clusterGuardado.getId(),
                        clusterGuardado.getNombreSugerido(),
                        clusterGuardado.getPalabrasClaveTop(),
                        clusterGuardado.getTotalDocumentos(),
                        clusterGuardado.getFechaGeneracion()
                ));
            }
        }

        // 3. Guardar las notas vinculadas a su nuevo cluster_id
        notaRepository.saveAll(todasLasNotas);

        return new AgruparResponse(
                mlResponse.n_clusters() != null ? mlResponse.n_clusters() : clusterResponses.size(),
                mlResponse.n_documentos() != null ? mlResponse.n_documentos() : todasLasNotas.size(),
                clusterResponses,
                mlResponse.tiempo_procesamiento_ms()
        );
    }
}