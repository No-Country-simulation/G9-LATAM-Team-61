package com.g9_latam_team_61.backend.controller;

import com.g9_latam_team_61.backend.client.MlClient;
import com.g9_latam_team_61.backend.client.MlResult;
import com.g9_latam_team_61.backend.dto.NotaRequest;
import com.g9_latam_team_61.backend.model.Nota;
import com.g9_latam_team_61.backend.repository.NotaRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import tools.jackson.databind.json.JsonMapper;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;
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
}