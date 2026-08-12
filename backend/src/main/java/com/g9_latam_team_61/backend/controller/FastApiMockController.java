package com.g9_latam_team_61.backend.controller;

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

    @PostMapping("/analizar")
    public ResponseEntity<FastApiResponse> mockAnalizar(@RequestBody(required = false) FastApiRequest request) {
        FastApiResponse response = new FastApiResponse(
                "DevOps",
                0.94,
                List.of("OCI", "Docker", "Balanceadores"),
                32.5
        );
        return ResponseEntity.ok(response);
    }

    @PostMapping("/predict/lote")
    public ResponseEntity<List<FastApiResponse>> mockAnalizarLote(@RequestBody(required = false) Map<String, List<String>> payload) {
        List<String> textos = (payload != null && payload.containsKey("textos")) ? payload.get("textos") : List.of();
        
        List<FastApiResponse> resultados = textos.stream()
                .map(t -> new FastApiResponse("DevOps", 0.94, List.of("Docker", "Cluster"), 3.2))
                .toList();

        return ResponseEntity.ok(resultados);
    }
}
