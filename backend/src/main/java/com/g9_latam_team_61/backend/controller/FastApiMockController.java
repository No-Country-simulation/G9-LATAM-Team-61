package com.g9_latam_team_61.backend.controller;

import com.g9_latam_team_61.backend.client.FastApiRequest;
import com.g9_latam_team_61.backend.client.FastApiResponse;
import org.springframework.context.annotation.Profile;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Profile({"local", "mock", "test"})
@RestController
@RequestMapping("/analizar")
public class FastApiMockController {

    @PostMapping
    public ResponseEntity<FastApiResponse> mockAnalizar(@RequestBody(required = false) FastApiRequest request) {
        FastApiResponse response = new FastApiResponse(
                "DevOps",
                0.94,
                List.of("OCI", "Docker", "Balanceadores")
        );
        return ResponseEntity.ok(response);
    }
}
