package com.g9_latam_team_61.backend.client;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.web.client.HttpStatusCodeException;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestClient;
import java.util.List;

@Component
@RequiredArgsConstructor
public class MlClient {

    private final RestClient fastApiClient;

    public MlResult analizar(String contenido) {
        FastApiResponse response;

        try {
            response = fastApiClient.post()
                    .uri("/analizar")
                    .body(new FastApiRequest(contenido))
                    .retrieve()
                    .body(FastApiResponse.class);
        } catch (ResourceAccessException ex) {
            throw new MlServiceTimeoutException("El servicio de análisis no respondió a tiempo");
        } catch (HttpStatusCodeException ex) {
            throw new MlServiceException("El servicio de análisis devolvió un error: " + ex.getStatusCode());
        } catch (org.springframework.web.client.RestClientException ex) {
            throw new MlServiceException("Error de comunicación con el servicio de análisis");
        }

        validarRespuesta(response);

        List<String> palabrasClave = response.palabras_clave() != null ? response.palabras_clave() : List.of();

        return new MlResult(response.categoria(), response.probabilidad(), palabrasClave, response.tiempo_procesamiento_ms());
    }

    private void validarRespuesta(FastApiResponse response) {
        if (response == null) {
            throw new MlServiceException("FastAPI no devolvió respuesta");
        }
        if (response.categoria() == null || response.categoria().isBlank()) {
            throw new MlServiceException("El servicio de análisis devolvió una categoría inválida");
        }
        if (response.probabilidad() == null || response.probabilidad() < 0 || response.probabilidad() > 1) {
            throw new MlServiceException("El servicio de análisis devolvió una probabilidad inválida");
        }
    }
}