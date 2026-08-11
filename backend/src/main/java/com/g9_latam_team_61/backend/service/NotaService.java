package com.g9_latam_team_61.backend.service;

import com.g9_latam_team_61.backend.client.MlClient;
import com.g9_latam_team_61.backend.client.MlResult;
import com.g9_latam_team_61.backend.dto.EstadisticasResponse;
import com.g9_latam_team_61.backend.mapper.NotaMapper;
import com.g9_latam_team_61.backend.repository.NotaRepository;
import com.g9_latam_team_61.backend.dto.NotaRequest;
import com.g9_latam_team_61.backend.dto.NotaResponse;
import com.g9_latam_team_61.backend.model.Nota;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.util.Set;

@Service
@RequiredArgsConstructor
public class NotaService {

    private final NotaRepository notaRepository;
    private final MlClient mlClient;
    private final NotaMapper notaMapper;

    private static final int MAX_PAGE_SIZE = 100;
    private static final Set<String> CAMPOS_ORDENABLES = Set.of("fechaAnalisis", "categoria", "probabilidad", "titulo");

    public NotaResponse procesar(NotaRequest request) {
        MlResult mlResult = mlClient.analizar(request.descripcion());

        Nota nota = notaMapper.toEntity(request, mlResult);
        Nota notaGuardada = notaRepository.save(nota);

        return notaMapper.toResponse(notaGuardada, mlResult.tiempoProcesamientoMs());
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
