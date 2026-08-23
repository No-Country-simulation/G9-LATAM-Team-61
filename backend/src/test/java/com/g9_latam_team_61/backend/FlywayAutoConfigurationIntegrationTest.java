package com.g9_latam_team_61.backend;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.g9_latam_team_61.backend.client.MlClient;
import com.g9_latam_team_61.backend.client.MlResult;
import jakarta.persistence.EntityManagerFactory;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.context.SpringBootTest.WebEnvironment;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;

@SpringBootTest(webEnvironment = WebEnvironment.RANDOM_PORT)
@ActiveProfiles("prod")
@Testcontainers(disabledWithoutDocker = true)
class FlywayAutoConfigurationIntegrationTest {

    @Container
    private static final PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:16-alpine")
            .withDatabaseName("flyway_autoconfiguration_test")
            .withUsername("postgres")
            .withPassword("postgres");

    @DynamicPropertySource
    static void configurePostgres(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", postgres::getJdbcUrl);
        registry.add("spring.datasource.username", postgres::getUsername);
        registry.add("spring.datasource.password", postgres::getPassword);
        registry.add("spring.flyway.enabled", () -> "true");
        registry.add("spring.jpa.hibernate.ddl-auto", () -> "validate");
        registry.add("spring.jpa.open-in-view", () -> "false");
        registry.add("cors.allowed-origins", () -> "http://127.0.0.1:8080,http://localhost:8080");
        registry.add("fastapi.url", () -> "http://localhost:8000");
    }

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Autowired
    private EntityManagerFactory entityManagerFactory;

    private final ObjectMapper objectMapper = new ObjectMapper();

    @LocalServerPort
    private int serverPort;

    @MockitoBean
    private MlClient mlClient;

    @Test
    void springBootAppliesV1AndV2BeforeHibernateValidation() {
        Boolean historyExists = jdbcTemplate.queryForObject(
                "SELECT to_regclass('public.flyway_schema_history') IS NOT NULL",
                Boolean.class
        );
        assertTrue(Boolean.TRUE.equals(historyExists));

        List<String> appliedVersions = jdbcTemplate.queryForList(
                "SELECT version FROM flyway_schema_history "
                        + "WHERE success = true AND version IS NOT NULL ORDER BY installed_rank",
                String.class
        );
        assertEquals(List.of("1", "2"), appliedVersions);

        assertTrue(entityManagerFactory.isOpen());
    }

    @Test
    void prodHttpSupportsUtf8HistoryWithLazyKeywordsAndReturns404ForUnknownRoute() throws Exception {
        String descripcion = "Documento suficientemente largo para validar una clasificación técnica con acentos.";
        when(mlClient.analizar(anyString()))
                .thenReturn(new MlResult("Backend", 0.94, List.of("clasificación", "acentos"), 12.5));

        HttpClient client = HttpClient.newHttpClient();
        String baseUrl = "http://127.0.0.1:" + serverPort;
        String json = "{\"descripcion\":\"" + descripcion + "\"}";

        HttpRequest postRequest = HttpRequest.newBuilder(URI.create(baseUrl + "/api/contenido"))
                .header("Content-Type", "application/json; charset=utf-8")
                .POST(HttpRequest.BodyPublishers.ofByteArray(json.getBytes(StandardCharsets.UTF_8)))
                .build();
        HttpResponse<String> postResponse = client.send(
                postRequest,
                HttpResponse.BodyHandlers.ofString(StandardCharsets.UTF_8)
        );

        assertEquals(201, postResponse.statusCode());
        assertTrue(postResponse.body().contains(descripcion));

        HttpResponse<String> historyResponse = client.send(
                HttpRequest.newBuilder(URI.create(baseUrl + "/api/contenido")).GET().build(),
                HttpResponse.BodyHandlers.ofString(StandardCharsets.UTF_8)
        );

        assertEquals(200, historyResponse.statusCode());
        assertTrue(historyResponse.body().contains(descripcion));
        JsonNode keywords = objectMapper.readTree(historyResponse.body())
                .path("content")
                .get(0)
                .path("palabrasClave");
        Set<String> actualKeywords = new HashSet<>();
        keywords.forEach(keyword -> actualKeywords.add(keyword.asText()));
        assertEquals(2, keywords.size());
        assertEquals(Set.of("clasificación", "acentos"), actualKeywords);
        assertFalse(historyResponse.body().contains("LazyInitializationException"));

        HttpResponse<String> missingRouteResponse = client.send(
                HttpRequest.newBuilder(URI.create(baseUrl + "/api/notas")).GET().build(),
                HttpResponse.BodyHandlers.ofString(StandardCharsets.UTF_8)
        );

        assertEquals(404, missingRouteResponse.statusCode());
        assertTrue(missingRouteResponse.body().contains("\"status\":404"));
    }

    @Test
    void corsAllowsCanonicalLoopbackOriginAndRejectsUnknownOrigin() throws Exception {
        HttpClient client = HttpClient.newHttpClient();
        String endpoint = "http://127.0.0.1:" + serverPort + "/api/contenido";

        HttpResponse<String> allowed = client.send(
                HttpRequest.newBuilder(URI.create(endpoint))
                        .header("Origin", "http://127.0.0.1:8080")
                        .header("Access-Control-Request-Method", "POST")
                        .method("OPTIONS", HttpRequest.BodyPublishers.noBody())
                        .build(),
                HttpResponse.BodyHandlers.ofString(StandardCharsets.UTF_8)
        );

        assertEquals(200, allowed.statusCode());
        assertEquals(
                "http://127.0.0.1:8080",
                allowed.headers().firstValue("Access-Control-Allow-Origin").orElse(null)
        );

        HttpResponse<String> rejected = client.send(
                HttpRequest.newBuilder(URI.create(endpoint))
                        .header("Origin", "https://origen-no-autorizado.example")
                        .header("Access-Control-Request-Method", "POST")
                        .method("OPTIONS", HttpRequest.BodyPublishers.noBody())
                        .build(),
                HttpResponse.BodyHandlers.ofString(StandardCharsets.UTF_8)
        );

        assertEquals(403, rejected.statusCode());
        assertTrue(rejected.headers().firstValue("Access-Control-Allow-Origin").isEmpty());
    }

    @Test
    void feedbackReturnsPersistedDataAndHistoryReflectsItWithLazyKeywords() throws Exception {
        long notaId = insertNote(
                "Documento de feedback integrado con palabras clave materializadas.",
                "DevOps",
                0.91
        );
        insertKeyword(notaId, "feedback-e2e");

        String comentario = "Categoría confirmada mediante prueba PostgreSQL real";
        String payload = "{\"categoriaSugerida\":\"Backend\",\"comentario\":\"" + comentario + "\"}";
        HttpClient client = HttpClient.newHttpClient();
        String baseUrl = "http://127.0.0.1:" + serverPort;

        HttpResponse<String> feedbackResponse = client.send(
                HttpRequest.newBuilder(URI.create(baseUrl + "/api/contenido/" + notaId + "/feedback"))
                        .header("Content-Type", "application/json; charset=utf-8")
                        .POST(HttpRequest.BodyPublishers.ofString(payload, StandardCharsets.UTF_8))
                        .build(),
                HttpResponse.BodyHandlers.ofString(StandardCharsets.UTF_8)
        );

        assertEquals(200, feedbackResponse.statusCode());
        JsonNode feedbackJson = objectMapper.readTree(feedbackResponse.body());
        assertEquals("Backend", feedbackJson.path("categoria").asText());
        assertEquals(comentario, feedbackJson.path("feedbackUsuario").asText());
        assertEquals("feedback-e2e", feedbackJson.path("palabrasClave").get(0).asText());

        assertEquals(
                comentario,
                jdbcTemplate.queryForObject(
                        "SELECT feedback_usuario FROM notas WHERE id = ?",
                        String.class,
                        notaId
                )
        );

        HttpResponse<String> historyResponse = client.send(
                HttpRequest.newBuilder(URI.create(baseUrl + "/api/contenido?size=100")).GET().build(),
                HttpResponse.BodyHandlers.ofString(StandardCharsets.UTF_8)
        );
        assertEquals(200, historyResponse.statusCode());
        JsonNode historyItem = findById(objectMapper.readTree(historyResponse.body()).path("content"), notaId);
        assertNotNull(historyItem);
        assertEquals(comentario, historyItem.path("feedbackUsuario").asText());
        assertEquals("feedback-e2e", historyItem.path("palabrasClave").get(0).asText());
    }

    @Test
    void searchReturnsRealResultsWithMaterializedKeywords() throws Exception {
        long notaId = insertNote(
                "Contenido único para buscar el término busquedae2ereal dentro de PostgreSQL.",
                "Backend",
                0.88
        );
        insertKeyword(notaId, "busquedae2ereal");

        HttpResponse<String> response = HttpClient.newHttpClient().send(
                HttpRequest.newBuilder(URI.create(
                        "http://127.0.0.1:" + serverPort + "/api/buscar?q=busquedae2ereal"
                )).GET().build(),
                HttpResponse.BodyHandlers.ofString(StandardCharsets.UTF_8)
        );

        assertEquals(200, response.statusCode());
        JsonNode item = findById(objectMapper.readTree(response.body()), notaId);
        assertNotNull(item);
        assertEquals("busquedae2ereal", item.path("palabrasClave").get(0).asText());
    }

    @Test
    void recommendationsReturnMaterializedKeywordsAndAllowAValidEmptyList() throws Exception {
        long sourceId = insertNote("Documento fuente de recomendaciones PostgreSQL.", "RecomendacionE2E", 0.90);
        long recommendedId = insertNote("Documento recomendado con palabras compartidas.", "RecomendacionE2E", 0.92);
        insertKeyword(sourceId, "recomendacione2e");
        insertKeyword(recommendedId, "recomendacione2e");
        insertKeyword(recommendedId, "materializada");

        HttpClient client = HttpClient.newHttpClient();
        String baseUrl = "http://127.0.0.1:" + serverPort;
        HttpResponse<String> response = client.send(
                HttpRequest.newBuilder(URI.create(baseUrl + "/api/contenido/" + sourceId + "/recomendados"))
                        .GET()
                        .build(),
                HttpResponse.BodyHandlers.ofString(StandardCharsets.UTF_8)
        );

        assertEquals(200, response.statusCode());
        JsonNode recommended = findById(objectMapper.readTree(response.body()), recommendedId);
        assertNotNull(recommended);
        Set<String> keywords = new HashSet<>();
        recommended.path("palabrasClave").forEach(keyword -> keywords.add(keyword.asText()));
        assertEquals(Set.of("recomendacione2e", "materializada"), keywords);

        long isolatedId = insertNote("Documento aislado sin recomendaciones posibles.", "CategoriaAisladaE2E", 0.75);
        insertKeyword(isolatedId, "aislado-e2e");
        HttpResponse<String> emptyResponse = client.send(
                HttpRequest.newBuilder(URI.create(baseUrl + "/api/contenido/" + isolatedId + "/recomendados"))
                        .GET()
                        .build(),
                HttpResponse.BodyHandlers.ofString(StandardCharsets.UTF_8)
        );

        assertEquals(200, emptyResponse.statusCode());
        assertEquals(0, objectMapper.readTree(emptyResponse.body()).size());
    }

    private long insertNote(String contenido, String categoria, double probabilidad) {
        Long id = jdbcTemplate.queryForObject(
                "INSERT INTO notas (contenido_original, categoria, probabilidad, fecha_analisis) "
                        + "VALUES (?, ?, ?, CURRENT_TIMESTAMP) RETURNING id",
                Long.class,
                contenido,
                categoria,
                probabilidad
        );
        assertNotNull(id);
        return id;
    }

    private void insertKeyword(long notaId, String keyword) {
        jdbcTemplate.update(
                "INSERT INTO nota_palabras_clave (nota_id, palabra) VALUES (?, ?)",
                notaId,
                keyword
        );
    }

    private JsonNode findById(JsonNode items, long id) {
        for (JsonNode item : items) {
            if (item.path("id").asLong() == id) {
                return item;
            }
        }
        return null;
    }
}
