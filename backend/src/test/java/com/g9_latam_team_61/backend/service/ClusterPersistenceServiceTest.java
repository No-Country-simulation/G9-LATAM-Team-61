package com.g9_latam_team_61.backend.service;

import com.g9_latam_team_61.backend.client.FastApiClusterInfo;
import com.g9_latam_team_61.backend.client.FastApiClusteringResponse;
import com.g9_latam_team_61.backend.dto.AgruparResponse;
import com.g9_latam_team_61.backend.model.Cluster;
import com.g9_latam_team_61.backend.model.Nota;
import com.g9_latam_team_61.backend.repository.ClusterRepository;
import com.g9_latam_team_61.backend.repository.NotaRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ClusterPersistenceServiceTest {

    @Mock
    private NotaRepository notaRepository;

    @Mock
    private ClusterRepository clusterRepository;

    @InjectMocks
    private ClusterPersistenceService clusterPersistenceService;

    @Test
    void aplicarClustering_debeLimpiarEstadoPrevioYGuardarNuevosClusters() {
        Nota n1 = new Nota(); n1.setId(1L); n1.setContenidoOriginal("Texto 1"); n1.setClusterId(99);
        Nota n2 = new Nota(); n2.setId(2L); n2.setContenidoOriginal("Texto 2"); n2.setClusterId(99);
        List<Nota> notas = List.of(n1, n2);

        FastApiClusterInfo info = new FastApiClusterInfo(0, 2, List.of("docker"), "Docker", List.of("Texto 1"));
        FastApiClusteringResponse mlResponse = new FastApiClusteringResponse("exec-1", 1, 2, List.of(info), 45.0);

        Cluster clusterGuardado = new Cluster(0, "Docker", List.of("docker"), 2, LocalDateTime.now());
        when(clusterRepository.save(any(Cluster.class))).thenReturn(clusterGuardado);

        AgruparResponse response = clusterPersistenceService.aplicarClustering(notas, mlResponse);

        assertEquals(1, response.nClusters());
        assertEquals(2, response.nDocumentos());
        verify(clusterRepository).deleteAll();
        verify(clusterRepository).save(any(Cluster.class));
        verify(notaRepository, times(2)).saveAll(anyList());
    }

    @Test
    void aplicarClustering_debeAsignarClusterATodosLosDocumentos_inclusoSiSonMasDeCinco() {
        java.util.List<Nota> notas = new java.util.ArrayList<>();
        java.util.List<String> ids = new java.util.ArrayList<>();
        for (long i = 1; i <= 8; i++) {
            Nota n = new Nota();
            n.setId(i);
            n.setContenidoOriginal("Texto " + i);
            notas.add(n);
            ids.add(String.valueOf(i));
        }

        // Preview solo tiene 5 documentos
        List<String> previewDocs = List.of("Texto 1", "Texto 2", "Texto 3", "Texto 4", "Texto 5");

        FastApiClusterInfo info = new FastApiClusterInfo(0, 8, List.of("docker"), "Docker", previewDocs, ids);
        FastApiClusteringResponse mlResponse = new FastApiClusteringResponse("exec-1", 1, 8, List.of(info), 45.0);

        Cluster clusterGuardado = new Cluster(0, "Docker", List.of("docker"), 8, LocalDateTime.now());
        when(clusterRepository.save(any(Cluster.class))).thenReturn(clusterGuardado);

        AgruparResponse response = clusterPersistenceService.aplicarClustering(notas, mlResponse);

        assertEquals(1, response.nClusters());
        assertEquals(8, response.nDocumentos());
        for (Nota nota : notas) {
            assertEquals(0, nota.getClusterId(), "Todas las 8 notas deben recibir el cluster_id");
        }
    }
}