package com.g9_latam_team_61.backend.controller;

import com.g9_latam_team_61.backend.client.FastApiClusteringRequest;
import com.g9_latam_team_61.backend.client.FastApiDocumentoCluster;
import com.g9_latam_team_61.backend.client.FastApiRequest;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import tools.jackson.databind.json.JsonMapper;

import java.util.List;
import java.util.Map;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(FastApiMockController.class)
@ActiveProfiles("test")
class FastApiMockControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private JsonMapper jsonMapper;

    @Test
    void mockHealth_debeRetornarOk() throws Exception {
        mockMvc.perform(get("/health"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("ok"))
                .andExpect(jsonPath("$.model_loaded").value(true));
    }

    @Test
    void mockRoot_debeRetornarInformacionDelServicio() throws Exception {
        mockMvc.perform(get("/"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.service").value("KMS Inference Service API"))
                .andExpect(jsonPath("$.status").value("running"));
    }

    @Test
    void mockPredict_debeRetornarPrediccion() throws Exception {
        FastApiRequest request = new FastApiRequest("Configuracion de balanceadores en Docker");

        mockMvc.perform(post("/predict")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(jsonMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.categoria").value("DevOps"))
                .andExpect(jsonPath("$.probabilidad").value(0.94))
                .andExpect(jsonPath("$.palabras_clave[0]").value("OCI"));
    }

    @Test
    void mockPredictLote_debeRetornarResultadosEnLote() throws Exception {
        Map<String, List<String>> payload = Map.of("textos", List.of("Texto 1", "Texto 2"));

        mockMvc.perform(post("/predict/lote")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(jsonMapper.writeValueAsString(payload)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(2))
                .andExpect(jsonPath("$[0].categoria").value("DevOps"));
    }

    @Test
    void mockPredictClustering_debeRetornarClusters() throws Exception {
        FastApiClusteringRequest request = new FastApiClusteringRequest(
                List.of(new FastApiDocumentoCluster("1", "Doc 1"), new FastApiDocumentoCluster("2", "Doc 2")),
                2, "kmeans", "es"
        );

        mockMvc.perform(post("/predict/clustering")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(jsonMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.n_clusters").value(1))
                .andExpect(jsonPath("$.n_documentos").value(2));
    }
}
