package com.g9_latam_team_61.backend.service;

import com.g9_latam_team_61.backend.client.FastApiClusterInfo;
import com.g9_latam_team_61.backend.client.FastApiClusteringResponse;
import com.g9_latam_team_61.backend.client.FastApiHealthResponse;
import com.g9_latam_team_61.backend.client.FastApiResponse;
import com.g9_latam_team_61.backend.client.MlClient;
import com.g9_latam_team_61.backend.client.MlResult;
import com.g9_latam_team_61.backend.client.MlServiceException;
import com.g9_latam_team_61.backend.dto.AgruparResponse;
import com.g9_latam_team_61.backend.dto.CategoriaConteoResponse;
import com.g9_latam_team_61.backend.dto.EstadisticasResponse;
import com.g9_latam_team_61.backend.dto.FeedbackRequest;
import com.g9_latam_team_61.backend.dto.HealthResponse;
import com.g9_latam_team_61.backend.dto.LoteRequest;
import com.g9_latam_team_61.backend.dto.LoteResponse;
import com.g9_latam_team_61.backend.dto.NotaRequest;
import com.g9_latam_team_61.backend.dto.NotaResponse;
import com.g9_latam_team_61.backend.mapper.NotaMapper;
import com.g9_latam_team_61.backend.model.Cluster;
import com.g9_latam_team_61.backend.model.Nota;
import com.g9_latam_team_61.backend.repository.ClusterRepository;
import com.g9_latam_team_61.backend.repository.NotaRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.*;
import org.springframework.mock.web.MockMultipartFile;

import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class NotaServiceTest {

    @Mock
    private NotaRepository notaRepository;

    @Mock
    private ClusterRepository clusterRepository;

    @Mock
    private MlClient mlClient;

    @Mock
    private NotaMapper notaMapper;

    @InjectMocks
    private NotaService notaService;

    @Test
    void procesar_debeGuardarNotaYRetornarResponse() {

        NotaRequest request = new NotaRequest("Descripcion con mas de 30 caracteres para testing completo");
        MlResult mlResult = new MlResult("DevOps", 0.94, List.of("OCI", "Docker"), 32.5);

        Nota notaSinGuardar = new Nota();
        notaSinGuardar.setContenidoOriginal(request.descripcion());
        notaSinGuardar.setTiempoProcesamientoMs(32.5);

        Nota notaGuardada = new Nota();
        notaGuardada.setId(1L);
        notaGuardada.setContenidoOriginal(request.descripcion());
        notaGuardada.setCategoria("DevOps");
        notaGuardada.setProbabilidad(0.94);
        notaGuardada.setPalabrasClave(List.of("OCI", "Docker"));
        notaGuardada.setFechaAnalisis(LocalDateTime.now());
        notaGuardada.setTiempoProcesamientoMs(32.5);

        NotaResponse expectedResponse = new NotaResponse(
                1L, "Descripcion con mas de 30 caracteres para testing completo", "DevOps", 0.94,
                List.of("OCI", "Docker"), notaGuardada.getFechaAnalisis(), 32.5
        );

        when(mlClient.analizar(anyString())).thenReturn(mlResult);
        when(notaMapper.toEntity(request, mlResult)).thenReturn(notaSinGuardar);
        when(notaRepository.save(notaSinGuardar)).thenReturn(notaGuardada);
        when(notaMapper.toResponse(notaGuardada)).thenReturn(expectedResponse);

        NotaResponse response = notaService.procesar(request);

        assertEquals(expectedResponse, response);
        verify(mlClient).analizar("Descripcion con mas de 30 caracteres para testing completo");
        verify(notaRepository).save(notaSinGuardar);
    }

    @Test
    void registrarFeedback_debeActualizarCategoriaYGuardarFeedback() {
        Nota nota = new Nota(); nota.setId(1L); nota.setCategoria("DevOps");
        FeedbackRequest request = new FeedbackRequest("Backend", "Corregido a backend");

        when(notaRepository.findById(1L)).thenReturn(Optional.of(nota));
        when(notaRepository.save(any(Nota.class))).thenAnswer(i -> i.getArgument(0));
        when(notaMapper.toResponse(any())).thenReturn(new NotaResponse(1L, "Texto", "Backend", 0.9, List.of(), LocalDateTime.now(), 10.0));

        NotaResponse response = notaService.registrarFeedback(1L, request);

        assertEquals("Backend", response.categoria());
        verify(notaRepository).save(nota);
    }

    @Test
    void verificarSaludSistema_debeRetornarEstadoUp_cuandoComponentesEstanActivos() {
        when(notaRepository.count()).thenReturn(5L);
        when(mlClient.verificarSalud()).thenReturn(new FastApiHealthResponse("ok", true));

        HealthResponse health = notaService.verificarSaludSistema();

        assertEquals("UP", health.status());
        assertEquals("UP", health.componentes().get("base_datos"));
    }

    @Test
    void agruparContenido_debeEjecutarClusteringYPersistirClusters() {
        Nota n1 = new Nota(); n1.setId(1L); n1.setContenidoOriginal("Texto 1");
        Nota n2 = new Nota(); n2.setId(2L); n2.setContenidoOriginal("Texto 2");

        FastApiClusterInfo info = new FastApiClusterInfo(0, 2, List.of("docker"), "Docker", List.of("Texto 1"));
        FastApiClusteringResponse mlResponse = new FastApiClusteringResponse("exec-1", 1, 2, List.of(info), 45.0);

        Cluster cluster = new Cluster(0, "Docker", List.of("docker"), 2, LocalDateTime.now());

        when(notaRepository.findAll()).thenReturn(List.of(n1, n2));
        when(mlClient.ejecutarClustering(anyList(), any())).thenReturn(mlResponse);
        when(clusterRepository.save(any(Cluster.class))).thenReturn(cluster);

        AgruparResponse response = notaService.agruparContenido(null);

        assertEquals(1, response.nClusters());
        assertEquals(2, response.nDocumentos());
        assertEquals(1, response.clusters().size());
        assertEquals("Docker", response.clusters().get(0).nombreSugerido());
        verify(clusterRepository).save(any(Cluster.class));
    }

    @Test
    void buscar_debeRetornarNotasSimilares() {
        Nota nota = new Nota(); nota.setId(1L); nota.setCategoria("DevOps");
        when(notaRepository.buscarPorSimilitud("docker")).thenReturn(List.of(nota));
        when(notaMapper.toResponse(nota)).thenReturn(new NotaResponse(1L, "Texto", "DevOps", 0.9, List.of("docker"), LocalDateTime.now(), 20.0));

        List<NotaResponse> resultado = notaService.buscar("docker");

        assertEquals(1, resultado.size());
        verify(notaRepository).buscarPorSimilitud("docker");
    }

    @Test
    void obtenerRecomendados_debeRetornarNotasSimilares() {
        Nota nota = new Nota(); nota.setId(2L); nota.setCategoria("DevOps");
        when(notaRepository.existsById(1L)).thenReturn(true);
        when(notaRepository.encontrarRecomendados(1L)).thenReturn(List.of(nota));
        when(notaMapper.toResponse(nota)).thenReturn(new NotaResponse(2L, "Texto", "DevOps", 0.9, List.of("docker"), LocalDateTime.now(), 20.0));

        List<NotaResponse> resultado = notaService.obtenerRecomendados(1L);

        assertEquals(1, resultado.size());
        verify(notaRepository).encontrarRecomendados(1L);
    }

    @Test
    void obtenerConteoCategorias_debeRetornarResumen() {
        CategoriaConteoResponse c1 = new CategoriaConteoResponse("DevOps", 5);
        when(notaRepository.contarNotasPorCategoria()).thenReturn(List.of(c1));

        List<CategoriaConteoResponse> resultado = notaService.obtenerConteoCategorias();

        assertEquals(1, resultado.size());
        assertEquals("DevOps", resultado.get(0).categoria());
        assertEquals(5, resultado.get(0).total());
    }

    @Test
    void procesarLote_debeProcesarPayloadJsonExitosamente() {
        LoteRequest request = new LoteRequest(List.of("Texto técnico 1", "Texto técnico 2"));

        FastApiResponse res1 = new FastApiResponse("DevOps", 0.94, List.of("docker"), 3.2);
        FastApiResponse res2 = new FastApiResponse("Backend", 0.88, List.of("spring"), 3.5);

        Nota n1 = new Nota();
        n1.setId(1L);
        n1.setContenidoOriginal("Texto técnico 1");

        Nota n2 = new Nota();
        n2.setId(2L);
        n2.setContenidoOriginal("Texto técnico 2");

        when(mlClient.analizarLote(anyList())).thenReturn(List.of(res1, res2));
        when(notaRepository.saveAll(anyList())).thenReturn(List.of(n1, n2));
        when(notaMapper.toResponse(n1)).thenReturn(new NotaResponse(1L, "Texto técnico 1", "DevOps", 0.94, List.of("docker"), LocalDateTime.now(), 3.2));
        when(notaMapper.toResponse(n2)).thenReturn(new NotaResponse(2L, "Texto técnico 2", "Backend", 0.88, List.of("spring"), LocalDateTime.now(), 3.5));

        LoteResponse response = notaService.procesarLote(null, request);

        assertEquals(2, response.archivosProcesados());
        assertEquals(6.7, response.tiempoTotalMs());
        assertEquals(2, response.resultados().size());
        verify(notaRepository).saveAll(anyList());
    }

    @Test
    void procesarLote_debeProcesarArchivoCsvExitosamente() {
        String csvContent = "contenido\nTexto de prueba CSV numero uno con mas de 30 caracteres\nTexto de prueba CSV numero dos con mas de 30 caracteres\n";
        MockMultipartFile file = new MockMultipartFile("file", "test.csv", "text/csv", csvContent.getBytes(StandardCharsets.UTF_8));

        FastApiResponse res1 = new FastApiResponse("DevOps", 0.94, List.of("docker"), 3.2);
        FastApiResponse res2 = new FastApiResponse("Backend", 0.88, List.of("spring"), 3.5);

        Nota n1 = new Nota();
        n1.setId(1L);
        n1.setContenidoOriginal("Texto de prueba CSV numero uno con mas de 30 caracteres");

        Nota n2 = new Nota();
        n2.setId(2L);
        n2.setContenidoOriginal("Texto de prueba CSV numero dos con mas de 30 caracteres");

        when(mlClient.analizarLote(anyList())).thenReturn(List.of(res1, res2));
        when(notaRepository.saveAll(anyList())).thenReturn(List.of(n1, n2));
        when(notaMapper.toResponse(n1)).thenReturn(new NotaResponse(1L, "Texto de prueba CSV numero uno con mas de 30 caracteres", "DevOps", 0.94, List.of("docker"), LocalDateTime.now(), 3.2));
        when(notaMapper.toResponse(n2)).thenReturn(new NotaResponse(2L, "Texto de prueba CSV numero dos con mas de 30 caracteres", "Backend", 0.88, List.of("spring"), LocalDateTime.now(), 3.5));

        LoteResponse response = notaService.procesarLote(file, null);

        assertEquals(2, response.archivosProcesados());
        verify(notaRepository).saveAll(anyList());
    }

    @Test
    void procesarLote_debeLanzarExcepcion_siNoSeProveenEntradas() {
        assertThrows(IllegalArgumentException.class, () -> notaService.procesarLote(null, null));
    }

    @Test
    void procesar_noDebeGuardarNada_siFastApiFalla() {

        NotaRequest request = new NotaRequest("Descripcion con mas de 30 caracteres valida sin titulo");

        when(mlClient.analizar(anyString()))
                .thenThrow(new MlServiceException("FastAPI no disponible"));

        assertThrows(MlServiceException.class, () -> notaService.procesar(request));

        verify(notaRepository, never()).save(any());
    }

    @Test
    void obtenerHistorial_debeFiltrarPorCategoria() {
        Pageable pageable = PageRequest.of(0, 10);
        Nota nota = new Nota();
        nota.setCategoria("DevOps");
        Page<Nota> notaPage = new PageImpl<>(List.of(nota));

        when(notaRepository.findByCategoriaIgnoreCase("DevOps", pageable)).thenReturn(notaPage);
        when(notaMapper.toResponse(nota)).thenReturn(
                new NotaResponse(1L, "Contenido", "DevOps", 0.9, List.of("test"), LocalDateTime.now(), null)
        );

        Page<NotaResponse> resultado = notaService.obtenerHistorial("DevOps", pageable);

        assertEquals(1, resultado.getTotalElements());
        verify(notaRepository).findByCategoriaIgnoreCase("DevOps", pageable);
    }

    @Test
    void obtenerEstadisticas_debeCalcularTotalYPromedio() {
        when(notaRepository.count()).thenReturn(5L);
        when(notaRepository.findConfianzaPromedio()).thenReturn(0.912345);
        when(notaRepository.findLatenciaPromedio()).thenReturn(25.555);
        when(notaRepository.countByFeedbackUsuarioIsNotNull()).thenReturn(2L);
        when(notaRepository.contarNotasPorCategoria()).thenReturn(List.of(new CategoriaConteoResponse("DevOps", 5)));

        EstadisticasResponse response = notaService.obtenerEstadisticas();

        assertEquals(5L, response.totalIndexados());
        assertEquals(0.9123, response.confianzaPromedio());
        assertEquals(25.56, response.latenciaPromedioMs());
        assertEquals(2L, response.totalFeedback());
    }

    @Test
    void obtenerEstadisticas_debeManejarBaseDatosVacia() {
        when(notaRepository.count()).thenReturn(0L);
        when(notaRepository.findConfianzaPromedio()).thenReturn(null);
        when(notaRepository.findLatenciaPromedio()).thenReturn(null);
        when(notaRepository.countByFeedbackUsuarioIsNotNull()).thenReturn(0L);
        when(notaRepository.contarNotasPorCategoria()).thenReturn(List.of());

        EstadisticasResponse response = notaService.obtenerEstadisticas();

        assertEquals(0L, response.totalIndexados());
        assertNull(response.confianzaPromedio());
        assertNull(response.latenciaPromedioMs());
        assertEquals(0L, response.totalFeedback());
    }

    @Test
    void obtenerHistorial_debeRechazarPageSizeExcesivo() {
        Pageable pageableInvalido = PageRequest.of(0, 200);

        assertThrows(IllegalArgumentException.class,
                () -> notaService.obtenerHistorial(null, pageableInvalido));
    }

    @Test
    void obtenerHistorial_debeRechazarCampoDeOrdenNoPermitido() {
        Pageable pageableInvalido = PageRequest.of(0, 10, Sort.by("campoInexistente"));

        assertThrows(IllegalArgumentException.class,
                () -> notaService.obtenerHistorial(null, pageableInvalido));
    }
}