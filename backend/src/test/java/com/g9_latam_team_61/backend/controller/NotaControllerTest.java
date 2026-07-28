package com.g9_latam_team_61.backend.controller;

import com.g9_latam_team_61.backend.client.MlServiceException;
import com.g9_latam_team_61.backend.client.MlServiceTimeoutException;
import com.g9_latam_team_61.backend.dto.NotaRequest;
import com.g9_latam_team_61.backend.dto.NotaResponse;
import com.g9_latam_team_61.backend.service.NotaService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import tools.jackson.databind.json.JsonMapper;

import java.time.LocalDateTime;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
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
        NotaRequest request = new NotaRequest("Titulo", "Una descripcion valida de prueba");
        NotaResponse response = new NotaResponse(
                1L, "Titulo", "DevOps", 0.94, List.of("OCI", "Docker"), LocalDateTime.now()
        );

        when(notaService.procesar(any(NotaRequest.class))).thenReturn(response);

        mockMvc.perform(post("/api/contenido")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(jsonMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.categoria").value("DevOps"))
                .andExpect(jsonPath("$.probabilidad").value(0.94));
    }

    @Test
    void analizar_debeRetornar400_siDescripcionEsMuyCorta() throws Exception {
        NotaRequest invalido = new NotaRequest("Titulo", "corta");

        mockMvc.perform(post("/api/contenido")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(jsonMapper.writeValueAsString(invalido)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void analizar_debeRetornar502_cuandoServicioMlFalla() throws Exception {
        NotaRequest request = new NotaRequest("Titulo", "Una descripcion valida de prueba");
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
        NotaRequest request = new NotaRequest("Titulo", "Una descripcion valida de prueba");
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
        NotaRequest request = new NotaRequest("Titulo", "Una descripcion valida de prueba");
        when(notaService.procesar(any(NotaRequest.class)))
                .thenThrow(new RuntimeException("Error inesperado en BD"));

        mockMvc.perform(post("/api/contenido")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(jsonMapper.writeValueAsString(request)))
                .andExpect(status().isInternalServerError())
                .andExpect(jsonPath("$.status").value(500))
                .andExpect(jsonPath("$.error").value("Ha ocurrido un error interno en el servidor"));
    }
}