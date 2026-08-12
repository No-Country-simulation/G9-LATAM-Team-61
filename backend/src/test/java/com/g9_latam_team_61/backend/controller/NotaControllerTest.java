package com.g9_latam_team_61.backend.controller;

import com.g9_latam_team_61.backend.client.MlServiceException;
import com.g9_latam_team_61.backend.client.MlServiceTimeoutException;
import com.g9_latam_team_61.backend.dto.EstadisticasResponse;
import com.g9_latam_team_61.backend.dto.LoteRequest;
import com.g9_latam_team_61.backend.dto.LoteResponse;
import com.g9_latam_team_61.backend.dto.NotaRequest;
import com.g9_latam_team_61.backend.dto.NotaResponse;
import com.g9_latam_team_61.backend.service.NotaService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import tools.jackson.databind.json.JsonMapper;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.util.List;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(NotaController.class)
class NotaControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private JsonMapper jsonMapper;

    @MockitoBean
    private NotaService notaService;

    @Test
    void analizar_debeRetornar201_conRequestValido() throws Exception {
        NotaRequest request = new NotaRequest("Una descripcion valida de prueba con mas de 30 caracteres");
        NotaResponse response = new NotaResponse(
                1L, "Una descripcion valida de prueba con mas de 30 caracteres", "DevOps", 0.94, List.of("OCI", "Docker"), LocalDateTime.now(), 32.5
        );

        when(notaService.procesar(any(NotaRequest.class))).thenReturn(response);

        mockMvc.perform(post("/api/contenido")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(jsonMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.categoria").value("DevOps"))
                .andExpect(jsonPath("$.probabilidad").value(0.94))
                .andExpect(jsonPath("$.tiempoProcesamientoMs").value(32.5));
    }

    @Test
    void analizarLote_debeRetornar201_conPayloadJsonValido() throws Exception {
        LoteRequest request = new LoteRequest(List.of("Texto 1", "Texto 2"));
        NotaResponse n1 = new NotaResponse(1L, "Texto 1", "DevOps", 0.94, List.of("docker"), LocalDateTime.now(), 3.2);
        LoteResponse response = new LoteResponse(2, 6.4, 3.2, List.of(n1));

        when(notaService.procesarLote(isNull(), any(LoteRequest.class))).thenReturn(response);

        mockMvc.perform(post("/api/contenido/lote")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(jsonMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.archivos_procesados").value(2))
                .andExpect(jsonPath("$.tiempo_total_ms").value(6.4));
    }

    @Test
    void analizarLote_debeRetornar201_conArchivoCsvValido() throws Exception {
        MockMultipartFile file = new MockMultipartFile("file", "test.csv", "text/csv", "contenido\nTexto 1\n".getBytes(StandardCharsets.UTF_8));
        NotaResponse n1 = new NotaResponse(1L, "Texto 1", "DevOps", 0.94, List.of("docker"), LocalDateTime.now(), 3.2);
        LoteResponse response = new LoteResponse(1, 3.2, 3.2, List.of(n1));

        when(notaService.procesarLote(any(), isNull())).thenReturn(response);

        mockMvc.perform(multipart("/api/contenido/lote")
                        .file(file))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.archivos_procesados").value(1));
    }

    @Test
    void analizarLote_debeRetornar400_cuandoListaTextosEsVaciaEnJson() throws Exception {
        LoteRequest requestInvalido = new LoteRequest(List.of());

        mockMvc.perform(post("/api/contenido/lote")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(jsonMapper.writeValueAsString(requestInvalido)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400));
    }

    @Test
    void analizar_debeRetornar400_siDescripcionEsMuyCorta() throws Exception {
        NotaRequest invalido = new NotaRequest("corta");

        mockMvc.perform(post("/api/contenido")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(jsonMapper.writeValueAsString(invalido)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void analizar_debeRetornar502_cuandoServicioMlFalla() throws Exception {
        NotaRequest request = new NotaRequest("Una descripcion valida de prueba con mas de 30 caracteres");
        when(notaService.procesar(any(NotaRequest.class)))
                .thenThrow(new MlServiceException("El servicio de análisis devolvió un error: 500 INTERNAL_SERVER_ERROR"));

        mockMvc.perform(post("/api/contenido")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(jsonMapper.writeValueAsString(request)))
                .andExpect(status().isBadGateway())
                .andExpect(jsonPath("$.status").value(502));
    }

    @Test
    void analizar_debeRetornar504_cuandoServicioMlEsperaTimeout() throws Exception {
        NotaRequest request = new NotaRequest("Una descripcion valida de prueba con mas de 30 caracteres");
        when(notaService.procesar(any(NotaRequest.class)))
                .thenThrow(new MlServiceTimeoutException("El servicio de análisis no respondió a tiempo"));

        mockMvc.perform(post("/api/contenido")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(jsonMapper.writeValueAsString(request)))
                .andExpect(status().isGatewayTimeout())
                .andExpect(jsonPath("$.status").value(504));
    }

    @Test
    void analizar_debeRetornar500_cuandoOcurreExcepcionInesperada() throws Exception {
        NotaRequest request = new NotaRequest("Una descripcion valida de prueba con mas de 30 caracteres");
        when(notaService.procesar(any(NotaRequest.class)))
                .thenThrow(new RuntimeException("Error inesperado en BD"));

        mockMvc.perform(post("/api/contenido")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(jsonMapper.writeValueAsString(request)))
                .andExpect(status().isInternalServerError())
                .andExpect(jsonPath("$.status").value(500))
                .andExpect(jsonPath("$.error").value("Ha ocurrido un error interno en el servidor"));
    }

    @Test
    void historial_debeRetornarPaginaConEstructuraEsperada() throws Exception {
        NotaResponse nota = new NotaResponse(1L, "Contenido de prueba", "DevOps", 0.94, List.of("OCI"), LocalDateTime.now(), null);
        Page<NotaResponse> pagina = new PageImpl<>(List.of(nota), PageRequest.of(0, 10), 1);

        when(notaService.obtenerHistorial(isNull(), any(Pageable.class))).thenReturn(pagina);

        mockMvc.perform(get("/api/contenido"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[0].categoria").value("DevOps"))
                .andExpect(jsonPath("$.totalElements").value(1))
                .andExpect(jsonPath("$.page").value(0));
    }

    @Test
    void historial_debeFiltrarPorCategoria() throws Exception {
        NotaResponse nota = new NotaResponse(1L, "Contenido backend", "Backend", 0.90, List.of("spring"), LocalDateTime.now(), null);
        Page<NotaResponse> pagina = new PageImpl<>(List.of(nota));

        when(notaService.obtenerHistorial(eq("Backend"), any(Pageable.class))).thenReturn(pagina);

        mockMvc.perform(get("/api/contenido").param("categoria", "Backend"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[0].categoria").value("Backend"));
    }

    @Test
    void estadisticas_debeRetornarTotalYConfianza() throws Exception {
        EstadisticasResponse response = new EstadisticasResponse(10L, 0.912);
        when(notaService.obtenerEstadisticas()).thenReturn(response);

        mockMvc.perform(get("/api/contenido/stats"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalIndexados").value(10))
                .andExpect(jsonPath("$.confianzaPromedio").value(0.912));
    }

    @Test
    void estadisticas_debeManejarBaseDatosVacia() throws Exception {
        EstadisticasResponse response = new EstadisticasResponse(0L, null);
        when(notaService.obtenerEstadisticas()).thenReturn(response);

        mockMvc.perform(get("/api/contenido/stats"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalIndexados").value(0))
                .andExpect(jsonPath("$.confianzaPromedio").doesNotExist());
    }

}