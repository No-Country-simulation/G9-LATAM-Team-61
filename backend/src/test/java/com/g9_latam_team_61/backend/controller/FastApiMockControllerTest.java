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
    void mockPredict_debeRetornar200_con30Caracteres() throws Exception {
        String texto30 = "123456789012345678901234567890";
        FastApiRequest request = new FastApiRequest(texto30);

        mockMvc.perform(post("/predict")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(jsonMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.categoria").value("DevOps"))
                .andExpect(jsonPath("$.probabilidad").value(0.94));
    }

    @Test
    void mockPredict_debeRetornar200_con5000Caracteres() throws Exception {
        String texto5000 = "a".repeat(5000);
        FastApiRequest request = new FastApiRequest(texto5000);

        mockMvc.perform(post("/predict")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(jsonMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.categoria").value("DevOps"));
    }

    @Test
    void mockPredict_debeRetornar422_con29Caracteres() throws Exception {
        String texto29 = "12345678901234567890123456789";
        FastApiRequest request = new FastApiRequest(texto29);

        mockMvc.perform(post("/predict")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(jsonMapper.writeValueAsString(request)))
                .andExpect(status().isUnprocessableEntity())
                .andExpect(jsonPath("$.detail").exists());
    }

    @Test
    void mockPredict_debeRetornar422_con5001Caracteres() throws Exception {
        String texto5001 = "a".repeat(5001);
        FastApiRequest request = new FastApiRequest(texto5001);

        mockMvc.perform(post("/predict")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(jsonMapper.writeValueAsString(request)))
                .andExpect(status().isUnprocessableEntity())
                .andExpect(jsonPath("$.detail").exists());
    }

    @Test
    void mockPredict_debeRetornar422_siContenidoEsVacioOSoloEspacios() throws Exception {
        FastApiRequest vacio = new FastApiRequest("");
        FastApiRequest soloEspacios = new FastApiRequest("                           ");

        mockMvc.perform(post("/predict")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(jsonMapper.writeValueAsString(vacio)))
                .andExpect(status().isUnprocessableEntity());

        mockMvc.perform(post("/predict")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(jsonMapper.writeValueAsString(soloEspacios)))
                .andExpect(status().isUnprocessableEntity());
    }

    @Test
    void mockPredictLote_debeRetornarResultadosEnLote() throws Exception {
        String texto1 = "Texto de prueba numero uno con mas de 30 caracteres";
        String texto2 = "Texto de prueba numero dos con mas de 30 caracteres";
        Map<String, List<String>> payload = Map.of("textos", List.of(texto1, texto2));

        mockMvc.perform(post("/predict/lote")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(jsonMapper.writeValueAsString(payload)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(2))
                .andExpect(jsonPath("$[0].categoria").value("DevOps"));
    }

    @Test
    void mockPredictLote_debeRetornar422_cuandoElementoTiene29Caracteres() throws Exception {
        String texto29 = "12345678901234567890123456789";
        Map<String, List<String>> payload = Map.of("textos", List.of(texto29));

        mockMvc.perform(post("/predict/lote")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(jsonMapper.writeValueAsString(payload)))
                .andExpect(status().isUnprocessableEntity())
                .andExpect(jsonPath("$.detail").exists());
    }

    @Test
    void mockPredictLote_debeRetornar200_con30Caracteres() throws Exception {
        String texto30 = "123456789012345678901234567890";
        Map<String, List<String>> payload = Map.of("textos", List.of(texto30));

        mockMvc.perform(post("/predict/lote")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(jsonMapper.writeValueAsString(payload)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1));
    }

    @Test
    void mockPredictLote_debeRetornar200_con5000Caracteres() throws Exception {
        String texto5000 = "a".repeat(5000);
        Map<String, List<String>> payload = Map.of("textos", List.of(texto5000));

        mockMvc.perform(post("/predict/lote")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(jsonMapper.writeValueAsString(payload)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1));
    }

    @Test
    void mockPredictLote_debeRetornar422_cuandoElementoTiene5001Caracteres() throws Exception {
        String texto5001 = "a".repeat(5001);
        Map<String, List<String>> payload = Map.of("textos", List.of(texto5001));

        mockMvc.perform(post("/predict/lote")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(jsonMapper.writeValueAsString(payload)))
                .andExpect(status().isUnprocessableEntity())
                .andExpect(jsonPath("$.detail").exists());
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
