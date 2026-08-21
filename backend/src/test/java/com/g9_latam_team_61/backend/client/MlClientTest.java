package com.g9_latam_team_61.backend.client;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.test.web.client.MockRestServiceServer;
import org.springframework.web.client.RestClient;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.*;
import static org.springframework.test.web.client.response.MockRestResponseCreators.*;

class MlClientTest {

    private MlClient mlClient;
    private MockRestServiceServer mockServer;

    @BeforeEach
    void setUp() {
        RestClient.Builder builder = RestClient.builder().baseUrl("http://localhost:8000");
        mockServer = MockRestServiceServer.bindTo(builder).build();
        mlClient = new MlClient(builder.build());
    }

    @Test
    void analizarLote_debeRetornarListaValida_cuandoFastApiRespondeCorrectamente() {
        mockServer.expect(requestTo("http://localhost:8000/predict/lote"))
                .andExpect(method(HttpMethod.POST))
                .andRespond(withSuccess("[{\"categoria\":\"DevOps\",\"probabilidad\":0.94,\"palabras_clave\":[\"docker\"],\"tiempo_procesamiento_ms\":3.2},{\"categoria\":\"Backend\",\"probabilidad\":0.88,\"palabras_clave\":[\"spring\"],\"tiempo_procesamiento_ms\":2.5}]", MediaType.APPLICATION_JSON));

        List<String> textos = List.of(
                "Texto de prueba masivo numero uno con mas de 30 caracteres",
                "Texto de prueba masivo numero dos con mas de 30 caracteres"
        );

        List<FastApiResponse> resultado = mlClient.analizarLote(textos);

        assertNotNull(resultado);
        assertEquals(2, resultado.size());
        assertEquals("DevOps", resultado.get(0).categoria());
        assertEquals("Backend", resultado.get(1).categoria());
        mockServer.verify();
    }

    @Test
    void analizarLote_debeLanzarExcepcion_siCardinalidadEsMenorQueSolicitud() {
        mockServer.expect(requestTo("http://localhost:8000/predict/lote"))
                .andExpect(method(HttpMethod.POST))
                .andRespond(withSuccess("[{\"categoria\":\"DevOps\",\"probabilidad\":0.94,\"palabras_clave\":[\"docker\"],\"tiempo_procesamiento_ms\":3.2}]", MediaType.APPLICATION_JSON));

        List<String> textos = List.of(
                "Texto de prueba masivo numero uno con mas de 30 caracteres",
                "Texto de prueba masivo numero dos con mas de 30 caracteres"
        );

        MlServiceException ex = assertThrows(MlServiceException.class, () -> mlClient.analizarLote(textos));
        assertTrue(ex.getMessage().contains("no coincide en cantidad"));
    }

    @Test
    void analizarLote_debeLanzarExcepcion_siCardinalidadEsMayorQueSolicitud() {
        mockServer.expect(requestTo("http://localhost:8000/predict/lote"))
                .andExpect(method(HttpMethod.POST))
                .andRespond(withSuccess("[{\"categoria\":\"DevOps\",\"probabilidad\":0.94,\"palabras_clave\":[\"docker\"],\"tiempo_procesamiento_ms\":3.2},{\"categoria\":\"Backend\",\"probabilidad\":0.88,\"palabras_clave\":[\"spring\"],\"tiempo_procesamiento_ms\":2.5}]", MediaType.APPLICATION_JSON));

        List<String> textos = List.of(
                "Texto de prueba masivo numero uno con mas de 30 caracteres"
        );

        MlServiceException ex = assertThrows(MlServiceException.class, () -> mlClient.analizarLote(textos));
        assertTrue(ex.getMessage().contains("no coincide en cantidad"));
    }

    @Test
    void analizarLote_debeLanzarExcepcion_siUnElementoEsInvalido() {
        mockServer.expect(requestTo("http://localhost:8000/predict/lote"))
                .andExpect(method(HttpMethod.POST))
                .andRespond(withSuccess("[{\"categoria\":\"\",\"probabilidad\":0.94,\"palabras_clave\":[],\"tiempo_procesamiento_ms\":3.2}]", MediaType.APPLICATION_JSON));

        List<String> textos = List.of("Texto de prueba masivo numero uno con mas de 30 caracteres");

        MlServiceException ex = assertThrows(MlServiceException.class, () -> mlClient.analizarLote(textos));
        assertTrue(ex.getMessage().contains("categoría inválida"));
    }

    @Test
    void analizarLote_debePropagarMlValidationException_siFastApiRetorna422() {
        mockServer.expect(requestTo("http://localhost:8000/predict/lote"))
                .andExpect(method(HttpMethod.POST))
                .andRespond(withRawStatus(422).contentType(MediaType.APPLICATION_JSON).body("{\"detail\":\"validation error\"}"));

        List<String> textos = List.of("Texto de prueba masivo numero uno con mas de 30 caracteres");

        MlValidationException ex = assertThrows(MlValidationException.class, () -> mlClient.analizarLote(textos));
        assertEquals(422, ex.getStatusCode().value());
    }

    @Test
    void analizarLote_debePropagarMlServiceException_siFastApiRetorna500() {
        mockServer.expect(requestTo("http://localhost:8000/predict/lote"))
                .andExpect(method(HttpMethod.POST))
                .andRespond(withServerError());

        List<String> textos = List.of("Texto de prueba masivo numero uno con mas de 30 caracteres");

        assertThrows(MlServiceException.class, () -> mlClient.analizarLote(textos));
    }
}