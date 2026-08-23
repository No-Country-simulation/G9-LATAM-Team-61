package com.g9_latam_team_61.backend.service;

import com.g9_latam_team_61.backend.client.FastApiClusterInfo;
import com.g9_latam_team_61.backend.client.FastApiClusteringResponse;
import com.g9_latam_team_61.backend.client.FastApiHealthResponse;
import com.g9_latam_team_61.backend.client.FastApiResponse;
import com.g9_latam_team_61.backend.client.MlClient;
import com.g9_latam_team_61.backend.client.MlResult;
import com.g9_latam_team_61.backend.client.MlServiceException;
import com.g9_latam_team_61.backend.dto.AgruparResponse;
import com.g9_latam_team_61.backend.dto.CategoriaConteoResponse;
import com.g9_latam_team_61.backend.dto.ClusterResponse;
import com.g9_latam_team_61.backend.dto.EstadisticasResponse;
import com.g9_latam_team_61.backend.dto.FeedbackRequest;
import com.g9_latam_team_61.backend.dto.HealthResponse;
import com.g9_latam_team_61.backend.dto.LoteRequest;
import com.g9_latam_team_61.backend.dto.LoteResponse;
import com.g9_latam_team_61.backend.dto.NotaRequest;
import com.g9_latam_team_61.backend.dto.NotaResponse;
import com.g9_latam_team_61.backend.mapper.NotaMapper;
import com.g9_latam_team_61.backend.model.Cluster;
import com.g9_latam_team_61.backend.model.Nota;
import com.g9_latam_team_61.backend.repository.ClusterRepository;
import com.g9_latam_team_61.backend.repository.NotaRepository;
import com.g9_latam_team_61.backend.util.CsvParserUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class NotaService {

    private final NotaRepository notaRepository;
    private final ClusterRepository clusterRepository;
    private final ClusterPersistenceService clusterPersistenceService;
    private final MlClient mlClient;
    private final NotaMapper notaMapper;

    private static final int MAX_PAGE_SIZE = 100;
    private static final Set<String> CAMPOS_ORDENABLES = Set.of("fechaAnalisis", "categoria", "probabilidad", "contenidoOriginal");

    public NotaResponse procesar(NotaRequest request) {
        MlResult mlResult = mlClient.analizar(request.descripcion());

        Nota nota = notaMapper.toEntity(request, mlResult);
        Nota notaGuardada = notaRepository.save(nota);

        return notaMapper.toResponse(notaGuardada);
    }

    public LoteResponse procesarLote(MultipartFile file, LoteRequest request) {
        List<String> textos;

        if (file != null && !file.isEmpty()) {
            textos = CsvParserUtil.parsearCsv(file);
        } else if (request != null && request.textos() != null && !request.textos().isEmpty()) {
            textos = request.textos();
        } else {
            throw new IllegalArgumentException("Debe proporcionar un archivo CSV o un payload JSON con la lista de textos");
        }

        if (textos.size() > 100) {
            throw new IllegalArgumentException("El lote no puede superar el límite máximo de 100 textos");
        }

        for (int i = 0; i < textos.size(); i++) {
            String t = textos.get(i);
            if (t == null || t.trim().isEmpty() || t.length() < 30 || t.length() > 5000) {
                throw new IllegalArgumentException("El texto en la posición " + (i + 1) + " debe tener entre 30 y 5000 caracteres");
            }
        }

        List<FastApiResponse> mlResultados = mlClient.analizarLote(textos);

        if (mlResultados == null || mlResultados.size() != textos.size()) {
            throw new MlServiceException("La cantidad de respuestas del servicio ML no coincide con la cantidad de textos enviados");
        }

        List<Nota> notas = new ArrayList<>();
        double tiempoTotalMs = 0.0;

        for (int i = 0; i < textos.size(); i++) {
            String texto = textos.get(i);
            FastApiResponse res = mlResultados.get(i);

            if (res == null || res.categoria() == null || res.categoria().isBlank()) {
                throw new MlServiceException("El servicio ML devolvió una respuesta incompleta para el registro " + (i + 1));
            }

            Double latencia = (res.tiempo_procesamiento_ms() != null) ? res.tiempo_procesamiento_ms() : 0.0;
            tiempoTotalMs += latencia;

            Nota nota = new Nota();
            nota.setContenidoOriginal(texto);
            nota.setCategoria(res.categoria());
            nota.setProbabilidad(res.probabilidad() != null ? res.probabilidad() : 0.0);
            nota.setPalabrasClave(res.palabras_clave() != null ? res.palabras_clave() : List.of());
            nota.setTiempoProcesamientoMs(latencia);
            notas.add(nota);
        }

        List<Nota> notasGuardadas = notaRepository.saveAll(notas);

        List<NotaResponse> respuestas = notasGuardadas.stream()
                .map(notaMapper::toResponse)
                .toList();

        int totalProcesados = respuestas.size();
        double tiempoPromedioMs = totalProcesados > 0 ? tiempoTotalMs / totalProcesados : 0.0;
        double tiempoTotalRedondeado = Math.round(tiempoTotalMs * 100.0) / 100.0;
        double tiempoPromedioRedondeado = Math.round(tiempoPromedioMs * 100.0) / 100.0;

        return new LoteResponse(
                totalProcesados,
                tiempoTotalRedondeado,
                tiempoPromedioRedondeado,
                respuestas
        );
    }

    public AgruparResponse agruparContenido(Integer nClusters) {
        List<Nota> todasLasNotas = notaRepository.findAll();
        if (todasLasNotas.size() < 2) {
            throw new IllegalArgumentException("Se necesitan al menos 2 notas registradas para realizar el agrupamiento por K-Means");
        }

        // 1. Ejecutar clustering en FastAPI y validar el resultado ANTES de modificar la base de datos
        FastApiClusteringResponse mlResponse = mlClient.ejecutarClustering(todasLasNotas, nClusters);
        validarRespuestaClustering(mlResponse);

        // 2. Aplicar los cambios en la base de datos de manera transaccional y atómica mediante ClusterPersistenceService
        return clusterPersistenceService.aplicarClustering(todasLasNotas, mlResponse);
    }

    private void validarRespuestaClustering(FastApiClusteringResponse mlResponse) {
        if (mlResponse == null || mlResponse.clusters() == null || mlResponse.clusters().isEmpty()) {
            throw new MlServiceException("El servicio de clustering devolvió una respuesta nula o sin clusters");
        }
        for (FastApiClusterInfo info : mlResponse.clusters()) {
            if (info == null || info.cluster_id() == null) {
                throw new MlServiceException("El servicio de clustering devolvió información de cluster incompleta");
            }
        }
    }

    public NotaResponse registrarFeedback(Long id, FeedbackRequest request) {
        Nota nota = notaRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("La nota especificada no existe"));

        String comentario = (request.comentario() != null && !request.comentario().isBlank())
                ? request.comentario()
                : "Categoría corregida a " + request.categoriaSugerida();

        nota.setCategoria(request.categoriaSugerida());
        nota.setFeedbackUsuario(comentario);

        Nota notaGuardada = notaRepository.save(nota);
        return notaMapper.toResponse(notaGuardada);
    }

    public HealthResponse verificarSaludSistema() {
        Map<String, Object> componentes = new LinkedHashMap<>();

        boolean dbUp = false;
        try {
            notaRepository.count();
            dbUp = true;
            componentes.put("base_datos", "UP");
        } catch (Exception ex) {
            componentes.put("base_datos", "DOWN");
        }

        FastApiHealthResponse mlHealth = mlClient.verificarSalud();
        boolean mlUp = "ok".equalsIgnoreCase(mlHealth.status());
        componentes.put("fastapi_ml", Map.of(
                "status", mlUp ? "UP" : "DOWN",
                "modelo_cargado", Boolean.TRUE.equals(mlHealth.model_loaded())
        ));

        String statusGlobal = (dbUp && mlUp) ? "UP" : "DOWN";
        return new HealthResponse(statusGlobal, componentes);
    }

    public List<NotaResponse> buscar(String query) {
        if (query == null || query.isBlank()) {
            throw new IllegalArgumentException("El parámetro de búsqueda no puede estar vacío");
        }

        List<Nota> resultados = notaRepository.buscarPorSimilitud(query.trim());
        return resultados.stream()
                .map(notaMapper::toResponse)
                .toList();
    }

    public List<NotaResponse> obtenerRecomendados(Long id) {
        if (id == null || !notaRepository.existsById(id)) {
            throw new IllegalArgumentException("La nota especificada no existe");
        }

        List<Nota> recomendados = notaRepository.encontrarRecomendados(id);
        return recomendados.stream()
                .map(notaMapper::toResponse)
                .toList();
    }

    public List<CategoriaConteoResponse> obtenerConteoCategorias() {
        return notaRepository.contarNotasPorCategoria();
    }

    @Transactional(readOnly = true)
    public Page<NotaResponse> obtenerHistorial(String categoria, Pageable pageable) {

        validarPageable(pageable);

        Page<Nota> notas = (categoria != null && !categoria.isBlank())
                ? notaRepository.findByCategoriaIgnoreCase(categoria, pageable)
                : notaRepository.findAll(pageable);

        return notas.map(notaMapper::toResponse);
    }

    public EstadisticasResponse obtenerEstadisticas() {
        long total = notaRepository.count();
        Double precisionPromedio = notaRepository.findConfianzaPromedio();
        Double latenciaPromedio = notaRepository.findLatenciaPromedio();
        long totalFeedback = notaRepository.countByFeedbackUsuarioIsNotNull();
        List<CategoriaConteoResponse> categorias = notaRepository.contarNotasPorCategoria();

        Double confianzaRedondeada = precisionPromedio != null
                ? Math.round(precisionPromedio * 10000.0) / 10000.0
                : null;

        Double latenciaRedondeada = latenciaPromedio != null
                ? Math.round(latenciaPromedio * 100.0) / 100.0
                : null;

        return new EstadisticasResponse(total, confianzaRedondeada, latenciaRedondeada, totalFeedback, categorias);
    }

    private void validarPageable(Pageable pageable) {
        if (pageable.getPageSize() > MAX_PAGE_SIZE) {
            throw new IllegalArgumentException("El tamaño de página no puede exceder " + MAX_PAGE_SIZE);
        }

        boolean sortInvalido = pageable.getSort().stream()
                .anyMatch(order -> !CAMPOS_ORDENABLES.contains(order.getProperty()));
        if (sortInvalido) {
            throw new IllegalArgumentException("Campo de ordenamiento no permitido");
        }
    }
}
