package com.g9_latam_team_61.backend.client;

import com.g9_latam_team_61.backend.model.Nota;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.web.client.HttpStatusCodeException;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestClient;
import java.util.List;
import java.util.Map;

@Component
@RequiredArgsConstructor
public class MlClient {

    private final RestClient fastApiClient;

    public MlResult analizar(String contenido) {
        FastApiResponse response;

        try {
            response = fastApiClient.post()
                    .uri("/predict")
                    .body(new FastApiRequest(contenido))
                    .retrieve()
                    .body(FastApiResponse.class);
        } catch (ResourceAccessException ex) {
            throw new MlServiceTimeoutException("El servicio de análisis no respondió a tiempo");
        } catch (HttpStatusCodeException ex) {
            if (ex.getStatusCode().is4xxClientError()) {
                throw new MlValidationException("Error de validación en servicio de inferencia: " + ex.getStatusCode().value(), ex.getStatusCode());
            }
            throw new MlServiceException("El servicio de análisis devolvió un error: " + ex.getStatusCode());
        } catch (org.springframework.web.client.RestClientException ex) {
            throw new MlServiceException("Error de comunicación con el servicio de análisis");
        }

        validarRespuesta(response);

        List<String> palabrasClave = response.palabras_clave() != null ? response.palabras_clave() : List.of();

        return new MlResult(response.categoria(), response.probabilidad(), palabrasClave, response.tiempo_procesamiento_ms());
    }

    public List<FastApiResponse> analizarLote(List<String> textos) {
        FastApiResponse[] responseArray;

        try {
            responseArray = fastApiClient.post()
                    .uri("/predict/lote")
                    .body(Map.of("textos", textos))
                    .retrieve()
                    .body(FastApiResponse[].class);
        } catch (ResourceAccessException ex) {
            throw new MlServiceTimeoutException("El servicio de análisis en lote no respondió a tiempo");
        } catch (HttpStatusCodeException ex) {
            if (ex.getStatusCode().is4xxClientError()) {
                throw new MlValidationException("Error de validación en servicio de inferencia por lote: " + ex.getStatusCode().value(), ex.getStatusCode());
            }
            throw new MlServiceException("El servicio de análisis devolvió un error: " + ex.getStatusCode());
        } catch (org.springframework.web.client.RestClientException ex) {
            throw new MlServiceException("Error de comunicación con el servicio de análisis en lote");
        }

        if (responseArray == null) {
            throw new MlServiceException("FastAPI no devolvió respuesta para el análisis en lote");
        }

        return List.of(responseArray);
    }

    public FastApiClusteringResponse ejecutarClustering(List<Nota> notas, Integer nClusters) {
        if (notas == null || notas.size() < 2) {
            throw new IllegalArgumentException("Se necesitan al menos 2 documentos para realizar clustering");
        }

        List<FastApiDocumentoCluster> docs = notas.stream()
                .map(n -> new FastApiDocumentoCluster(String.valueOf(n.getId()), n.getContenidoOriginal()))
                .toList();

        FastApiClusteringRequest request = new FastApiClusteringRequest(docs, nClusters, "kmeans", "es");

        try {
            return fastApiClient.post()
                    .uri("/predict/clustering")
                    .body(request)
                    .retrieve()
                    .body(FastApiClusteringResponse.class);
        } catch (ResourceAccessException ex) {
            throw new MlServiceTimeoutException("El servicio de clustering no respondió a tiempo");
        } catch (HttpStatusCodeException ex) {
            if (ex.getStatusCode().is4xxClientError()) {
                throw new MlValidationException("Error de validación en servicio de clustering: " + ex.getStatusCode().value(), ex.getStatusCode());
            }
            throw new MlServiceException("El servicio de clustering devolvió un error: " + ex.getStatusCode());
        } catch (org.springframework.web.client.RestClientException ex) {
            throw new MlServiceException("Error de comunicación con el servicio de clustering");
        }
    }

    public FastApiHealthResponse verificarSalud() {
        try {
            return fastApiClient.get()
                    .uri("/health")
                    .retrieve()
                    .body(FastApiHealthResponse.class);
        } catch (Exception ex) {
            return new FastApiHealthResponse("down", false);
        }
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