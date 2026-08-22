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
}