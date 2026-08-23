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
}
