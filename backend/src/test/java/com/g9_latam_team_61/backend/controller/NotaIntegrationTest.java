package com.g9_latam_team_61.backend.controller;

import com.g9_latam_team_61.backend.client.FastApiClusterInfo;
import com.g9_latam_team_61.backend.client.FastApiClusteringResponse;
import com.g9_latam_team_61.backend.client.FastApiHealthResponse;
import com.g9_latam_team_61.backend.client.FastApiResponse;
import com.g9_latam_team_61.backend.client.MlClient;
import com.g9_latam_team_61.backend.client.MlResult;
import com.g9_latam_team_61.backend.client.MlServiceException;
import com.g9_latam_team_61.backend.dto.FeedbackRequest;
import com.g9_latam_team_61.backend.dto.LoteRequest;
import com.g9_latam_team_61.backend.dto.NotaRequest;
import com.g9_latam_team_61.backend.model.Cluster;
import com.g9_latam_team_61.backend.model.Nota;
import com.g9_latam_team_61.backend.repository.NotaRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.context.bean.override.mockito.MockitoSpyBean;
import org.springframework.test.web.servlet.MockMvc;
import tools.jackson.databind.json.JsonMapper;

import java.nio.charset.StandardCharsets;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;


@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class NotaIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private JsonMapper jsonMapper;

    @Autowired
    private NotaRepository notaRepository;

    @MockitoSpyBean
    private com.g9_latam_team_61.backend.repository.ClusterRepository clusterRepository;

    @MockitoBean
    private MlClient mlClient;

    @BeforeEach
    void setUp() {
        clusterRepository.deleteAll();
        notaRepository.deleteAll();
    }

    @Test
    void debePersistirContenidoOriginalYMetricas_alProcesarNotaExitosamente() throws Exception {
        when(mlClient.analizar(anyString()))
                .thenReturn(new MlResult("DevOps", 0.94, List.of("OCI", "Docker"), 32.5));

        String descripcionOriginal = "Configuracion de balanceadores de carga en OCI usando Docker y Kubernetes.";
        NotaRequest request = new NotaRequest(descripcionOriginal);

        mockMvc.perform(post("/api/contenido")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(jsonMapper.writeValueAsString(request)))
                .andExpect(status().isCreated());

        List<Nota> notas = notaRepository.findAll();
        assertEquals(1, notas.size());
        assertEquals(descripcionOriginal, notas.get(0).getContenidoOriginal());
        assertNotNull(notas.get(0).getTiempoProcesamientoMs());
        assertEquals(32.5, notas.get(0).getTiempoProcesamientoMs());
    }

    @Test
    void debeActualizarCategoriaEnPostgres_alRegistrarFeedback() throws Exception {
        Nota nota = new Nota(); nota.setContenidoOriginal("Texto de prueba"); nota.setCategoria("DevOps"); nota.setProbabilidad(0.9);
        Nota notaGuardada = notaRepository.save(nota);

        FeedbackRequest request = new FeedbackRequest("Backend", "El texto trata sobre Spring Boot");

        mockMvc.perform(post("/api/contenido/" + notaGuardada.getId() + "/feedback")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(jsonMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.categoria").value("Backend"));

        Nota notaActualizada = notaRepository.findById(notaGuardada.getId()).orElseThrow();
        assertEquals("Backend", notaActualizada.getCategoria());
        assertEquals("El texto trata sobre Spring Boot", notaActualizada.getFeedbackUsuario());
    }

    @Test
    void debeRetornarSaludConsolidadaDelSistema() throws Exception {
        when(mlClient.verificarSalud()).thenReturn(new FastApiHealthResponse("ok", true));

        mockMvc.perform(get("/api/health"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("UP"))
                .andExpect(jsonPath("$.componentes.base_datos").value("UP"));
    }

    @Test
    void debePersistirLoteCompletoEnBaseDatos_alEnviarJsonMasivo() throws Exception {
        FastApiResponse res1 = new FastApiResponse("DevOps", 0.94, List.of("docker"), 3.2);
        FastApiResponse res2 = new FastApiResponse("Backend", 0.88, List.of("spring"), 3.5);

        when(mlClient.analizarLote(anyList())).thenReturn(List.of(res1, res2));

        LoteRequest request = new LoteRequest(List.of(
                "Texto de prueba masivo numero uno con mas de 30 caracteres",
                "Texto de prueba masivo numero dos con mas de 30 caracteres"
        ));

        mockMvc.perform(post("/api/contenido/lote")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(jsonMapper.writeValueAsString(request)))
                .andExpect(status().isCreated());

        List<Nota> notas = notaRepository.findAll();
        assertEquals(2, notas.size());
        assertEquals("Texto de prueba masivo numero uno con mas de 30 caracteres", notas.get(0).getContenidoOriginal());
        assertEquals("Texto de prueba masivo numero dos con mas de 30 caracteres", notas.get(1).getContenidoOriginal());
    }

    @Test
    void debePersistirLoteCompletoEnBaseDatos_alEnviarArchivoCsv() throws Exception {
        FastApiResponse res1 = new FastApiResponse("DevOps", 0.94, List.of("docker"), 3.2);
        FastApiResponse res2 = new FastApiResponse("Backend", 0.88, List.of("spring"), 3.5);

        when(mlClient.analizarLote(anyList())).thenReturn(List.of(res1, res2));

        String csvContent = "contenido\nTexto de prueba CSV numero uno con mas de 30 caracteres\nTexto de prueba CSV numero dos con mas de 30 caracteres\n";
        MockMultipartFile file = new MockMultipartFile("file", "test.csv", "text/csv", csvContent.getBytes(StandardCharsets.UTF_8));

        mockMvc.perform(multipart("/api/contenido/lote")
                        .file(file))
                .andExpect(status().isCreated());

        List<Nota> notas = notaRepository.findAll();
        assertEquals(2, notas.size());
        assertEquals("Texto de prueba CSV numero uno con mas de 30 caracteres", notas.get(0).getContenidoOriginal());
        assertEquals("Texto de prueba CSV numero dos con mas de 30 caracteres", notas.get(1).getContenidoOriginal());
    }

    @Test
    void debeAgruparContenidoExitosamente() throws Exception {
        Nota n1 = new Nota(); n1.setContenidoOriginal("Texto 1"); n1.setCategoria("DevOps"); n1.setProbabilidad(0.9);
        Nota n2 = new Nota(); n2.setContenidoOriginal("Texto 2"); n2.setCategoria("DevOps"); n2.setProbabilidad(0.9);
        notaRepository.saveAll(List.of(n1, n2));

        FastApiClusterInfo info = new FastApiClusterInfo(0, 2, List.of("docker"), "Docker", List.of("Texto 1"));
        FastApiClusteringResponse mlResponse = new FastApiClusteringResponse("exec-1", 1, 2, List.of(info), 45.0);

        when(mlClient.ejecutarClustering(anyList(), any())).thenReturn(mlResponse);

        mockMvc.perform(post("/api/contenido/agrupar"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.n_clusters").value(1))
                .andExpect(jsonPath("$.n_documentos").value(2));
    }

    @Test
    void debePreservarClustersYAsignacionesPrevias_siFastApiFallaAlAgrupar() throws Exception {
        Cluster cPrevio = new Cluster();
        cPrevio.setId(0);
        cPrevio.setNombreSugerido("Cluster Previo");
        cPrevio.setPalabrasClaveTop(List.of("k8s"));
        cPrevio.setTotalDocumentos(2);
        clusterRepository.save(cPrevio);

        Nota n1 = new Nota(); n1.setContenidoOriginal("Texto 1"); n1.setCategoria("DevOps"); n1.setProbabilidad(0.9); n1.setClusterId(0);
        Nota n2 = new Nota(); n2.setContenidoOriginal("Texto 2"); n2.setCategoria("DevOps"); n2.setProbabilidad(0.9); n2.setClusterId(0);
        notaRepository.saveAll(List.of(n1, n2));

        when(mlClient.ejecutarClustering(anyList(), any()))
                .thenThrow(new MlServiceException("FastAPI de clustering no disponible"));

        mockMvc.perform(post("/api/contenido/agrupar"))
                .andExpect(status().isBadGateway());

        // Verificar que el estado previo NO se perdió
        assertEquals(1, clusterRepository.count());
        List<Nota> notasPostFallo = notaRepository.findAll();
        assertEquals(0, notasPostFallo.get(0).getClusterId());
        assertEquals(0, notasPostFallo.get(1).getClusterId());
    }

    @Test
    void debeHacerRollbackYPreservarEstadoPrevio_siOcurreFalloDuranteEscrituraDeClustering() throws Exception {
        Cluster cPrevio = new Cluster();
        cPrevio.setId(0);
        cPrevio.setNombreSugerido("Cluster Previo Original");
        cPrevio.setPalabrasClaveTop(List.of("docker"));
        cPrevio.setTotalDocumentos(2);
        clusterRepository.save(cPrevio);

        Nota n1 = new Nota(); n1.setContenidoOriginal("Texto 1"); n1.setCategoria("DevOps"); n1.setProbabilidad(0.9); n1.setClusterId(0);
        Nota n2 = new Nota(); n2.setContenidoOriginal("Texto 2"); n2.setCategoria("DevOps"); n2.setProbabilidad(0.9); n2.setClusterId(0);
        notaRepository.saveAll(List.of(n1, n2));

        FastApiClusterInfo info = new FastApiClusterInfo(1, 2, List.of("k8s"), "Nuevo Cluster", List.of("Texto 1"));
        FastApiClusteringResponse mlResponse = new FastApiClusteringResponse("exec-1", 1, 2, List.of(info), 45.0);
        when(mlClient.ejecutarClustering(anyList(), any())).thenReturn(mlResponse);

        // Provocar fallo intencional durante la persistencia del nuevo cluster después del deleteAll()
        doThrow(new RuntimeException("Fallo simulado de base de datos durante escritura de nuevo cluster"))
                .when(clusterRepository).save(any(Cluster.class));

        mockMvc.perform(post("/api/contenido/agrupar"))
                .andExpect(status().isInternalServerError());

        // Verificar que el rollback restauró el cluster previo y las asignaciones originales de las notas
        assertEquals(1, clusterRepository.count());
        Cluster clusterRecuperado = clusterRepository.findById(0).orElseThrow();
        assertEquals("Cluster Previo Original", clusterRecuperado.getNombreSugerido());

        List<Nota> notasPostRollback = notaRepository.findAll();
        assertEquals(0, notasPostRollback.get(0).getClusterId());
        assertEquals(0, notasPostRollback.get(1).getClusterId());
    }

    @Test
    void debeBuscarPorSimilitudYRetornarResultados() throws Exception {
        Nota n1 = new Nota(); n1.setContenidoOriginal("Texto sobre docker en OCI"); n1.setCategoria("DevOps"); n1.setProbabilidad(0.9); n1.setPalabrasClave(List.of("docker"));
        notaRepository.save(n1);

        mockMvc.perform(get("/api/buscar").param("q", "docker"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].categoria").value("DevOps"));
    }

    @Test
    void debeRetornarResumenDeCategorias() throws Exception {
        Nota n1 = new Nota(); n1.setContenidoOriginal("Texto de prueba"); n1.setCategoria("DevOps"); n1.setProbabilidad(0.9);
        notaRepository.save(n1);

        mockMvc.perform(get("/api/categorias"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].categoria").value("DevOps"))
                .andExpect(jsonPath("$[0].total").value(1));
    }
}