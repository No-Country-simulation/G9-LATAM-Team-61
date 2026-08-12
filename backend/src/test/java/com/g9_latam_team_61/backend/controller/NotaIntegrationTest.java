package com.g9_latam_team_61.backend.controller;

import com.g9_latam_team_61.backend.client.FastApiResponse;
import com.g9_latam_team_61.backend.client.MlClient;
import com.g9_latam_team_61.backend.client.MlResult;
import com.g9_latam_team_61.backend.dto.LoteRequest;
import com.g9_latam_team_61.backend.dto.NotaRequest;
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
import org.springframework.test.web.servlet.MockMvc;
import tools.jackson.databind.json.JsonMapper;

import java.nio.charset.StandardCharsets;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
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

    @MockitoBean
    private MlClient mlClient;

    @BeforeEach
    void setUp() {
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
    void debePersistirLoteCompletoEnBaseDatos_alEnviarJsonMasivo() throws Exception {
        FastApiResponse res1 = new FastApiResponse("DevOps", 0.94, List.of("docker"), 3.2);
        FastApiResponse res2 = new FastApiResponse("Backend", 0.88, List.of("spring"), 3.5);

        when(mlClient.analizarLote(anyList())).thenReturn(List.of(res1, res2));

        LoteRequest request = new LoteRequest(List.of("Texto de prueba masivo 1", "Texto de prueba masivo 2"));

        mockMvc.perform(post("/api/contenido/lote")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(jsonMapper.writeValueAsString(request)))
                .andExpect(status().isCreated());

        List<Nota> notas = notaRepository.findAll();
        assertEquals(2, notas.size());
        assertEquals("Texto de prueba masivo 1", notas.get(0).getContenidoOriginal());
        assertEquals("Texto de prueba masivo 2", notas.get(1).getContenidoOriginal());
    }

    @Test
    void debePersistirLoteCompletoEnBaseDatos_alEnviarArchivoCsv() throws Exception {
        FastApiResponse res1 = new FastApiResponse("DevOps", 0.94, List.of("docker"), 3.2);
        FastApiResponse res2 = new FastApiResponse("Backend", 0.88, List.of("spring"), 3.5);

        when(mlClient.analizarLote(anyList())).thenReturn(List.of(res1, res2));

        MockMultipartFile file = new MockMultipartFile("file", "test.csv", "text/csv", "contenido\nTexto CSV 1\nTexto CSV 2\n".getBytes(StandardCharsets.UTF_8));

        mockMvc.perform(multipart("/api/contenido/lote")
                        .file(file))
                .andExpect(status().isCreated());

        List<Nota> notas = notaRepository.findAll();
        assertEquals(2, notas.size());
        assertEquals("Texto CSV 1", notas.get(0).getContenidoOriginal());
        assertEquals("Texto CSV 2", notas.get(1).getContenidoOriginal());
    }
}