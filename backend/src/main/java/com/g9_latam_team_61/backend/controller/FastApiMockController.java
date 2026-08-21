package com.g9_latam_team_61.backend.controller;

import com.g9_latam_team_61.backend.client.FastApiClusterInfo;
import com.g9_latam_team_61.backend.client.FastApiClusteringRequest;
import com.g9_latam_team_61.backend.client.FastApiClusteringResponse;
import com.g9_latam_team_61.backend.client.FastApiHealthResponse;
import com.g9_latam_team_61.backend.client.FastApiRequest;
import com.g9_latam_team_61.backend.client.FastApiResponse;
import org.springframework.context.annotation.Profile;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@Profile({"local", "test"})
@RestController
public class FastApiMockController {

    @GetMapping("/health")
    public ResponseEntity<FastApiHealthResponse> mockHealth() {
        return ResponseEntity.ok(new FastApiHealthResponse("ok", true));
    }

    @GetMapping("/")
    public ResponseEntity<Map<String, String>> mockRoot() {
        return ResponseEntity.ok(Map.of(
                "service", "KMS Inference Service API",
                "status", "running",
                "docs", "/docs"
        ));
    }

    @PostMapping("/predict")
    public ResponseEntity<?> mockPredict(@RequestBody(required = false) FastApiRequest request) {
        if (request == null || request.contenido_crudo() == null || request.contenido_crudo().trim().isEmpty()
                || request.contenido_crudo().length() < 30 || request.contenido_crudo().length() > 5000) {
            return ResponseEntity.unprocessableEntity().body(Map.of(
                    "detail", "Validación fallida: el contenido_crudo debe tener entre 30 y 5000 caracteres"
            ));
        }

        FastApiResponse response = new FastApiResponse(
                "DevOps",
                0.94,
                List.of("OCI", "Docker", "Balanceadores"),
                32.5
        );
        return ResponseEntity.ok(response);
    }

    @PostMapping("/predict/lote")
    public ResponseEntity<?> mockPredictLote(@RequestBody(required = false) Map<String, List<String>> payload) {
        if (payload == null || !payload.containsKey("textos") || payload.get("textos") == null || payload.get("textos").isEmpty()) {
            return ResponseEntity.unprocessableEntity().body(Map.of(
                    "detail", "Validación fallida: lista de textos es requerida"
            ));
        }

        List<String> textos = payload.get("textos");
        for (String t : textos) {
            if (t == null || t.trim().isEmpty() || t.length() < 30 || t.length() > 5000) {
                return ResponseEntity.unprocessableEntity().body(Map.of(
                        "detail", "Validación fallida: cada texto debe tener entre 30 y 5000 caracteres"
                ));
            }
        }
        
        List<FastApiResponse> resultados = textos.stream()
                .map(t -> new FastApiResponse("DevOps", 0.94, List.of("Docker", "Cluster"), 3.2))
                .toList();

        return ResponseEntity.ok(resultados);
    }

    @PostMapping("/predict/clustering")
    public ResponseEntity<FastApiClusteringResponse> mockPredictClustering(@RequestBody(required = false) FastApiClusteringRequest request) {
        int totalDocs = (request != null && request.documentos() != null) ? request.documentos().size() : 0;
        
        FastApiClusterInfo c0 = new FastApiClusterInfo(
                0,
                totalDocs > 0 ? totalDocs : 1,
                List.of("docker", "kubernetes", "oci"),
                "Docker & Kubernetes",
                List.of("doc1")
        );

        FastApiClusteringResponse response = new FastApiClusteringResponse(
                "exec-123",
                1,
                totalDocs,
                List.of(c0),
                45.2
        );
        return ResponseEntity.ok(response);
    }
}
