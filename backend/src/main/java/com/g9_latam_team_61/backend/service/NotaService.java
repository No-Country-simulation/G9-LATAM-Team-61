package com.g9_latam_team_61.backend.service;

import com.g9_latam_team_61.backend.client.FastApiResponse;
import com.g9_latam_team_61.backend.client.MlClient;
import com.g9_latam_team_61.backend.client.MlResult;
import com.g9_latam_team_61.backend.dto.EstadisticasResponse;
import com.g9_latam_team_61.backend.dto.LoteRequest;
import com.g9_latam_team_61.backend.dto.LoteResponse;
import com.g9_latam_team_61.backend.dto.NotaRequest;
import com.g9_latam_team_61.backend.dto.NotaResponse;
import com.g9_latam_team_61.backend.mapper.NotaMapper;
import com.g9_latam_team_61.backend.model.Nota;
import com.g9_latam_team_61.backend.repository.NotaRepository;
import com.g9_latam_team_61.backend.util.CsvParserUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.util.ArrayList;
import java.util.List;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class NotaService {

    private final NotaRepository notaRepository;
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

        List<FastApiResponse> mlResultados = mlClient.analizarLote(textos);

        List<Nota> notas = new ArrayList<>();
        double tiempoTotalMs = 0.0;

        for (int i = 0; i < textos.size(); i++) {
            String texto = textos.get(i);
            FastApiResponse res = mlResultados.get(i);

            Double latencia = (res != null && res.tiempo_procesamiento_ms() != null) ? res.tiempo_procesamiento_ms() : 0.0;
            tiempoTotalMs += latencia;

            Nota nota = new Nota();
            nota.setContenidoOriginal(texto);
            nota.setCategoria(res != null ? res.categoria() : "Otros");
            nota.setProbabilidad(res != null && res.probabilidad() != null ? res.probabilidad() : 0.0);
            nota.setPalabrasClave(res != null && res.palabras_clave() != null ? res.palabras_clave() : List.of());
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

        Double confianzaRedondeada = precisionPromedio != null
                ? Math.round(precisionPromedio * 10000.0) / 10000.0
                : null;

        return new EstadisticasResponse(total, confianzaRedondeada);
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
