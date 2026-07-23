package com.g9_latam_team_61.backend.client;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

@Component
@RequiredArgsConstructor
public class MlClient {

    private final RestClient fastApiClient;

    public MlResult analizar(String contenido) {
        FastApiResponse response = fastApiClient.post()
                .uri("/analizar")
                .body(new FastApiRequest(contenido))
                .retrieve()
                .body(FastApiResponse.class);

        if (response == null) {
            throw new MlServiceException("FastAPI no devolvió respuesta");
        }

        return new MlResult(
                response.categoria(),
                response.probabilidad(),
                response.palabras_clave()
        );
    }
}
