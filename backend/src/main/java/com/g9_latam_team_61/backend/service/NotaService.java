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

@Service
@RequiredArgsConstructor
public class NotaService {

    private final NotaRepository notaRepository;
    private final MlClient mlClient;
    private final NotaMapper notaMapper;

    public NotaResponse procesar(NotaRequest request){
        String contenido = notaMapper.construirContenido(request);
        MlResult mlResult = mlClient.analizar(contenido);

        Nota nota = notaMapper.toEntity(request, mlResult);
        Nota notaGuardada = notaRepository.save(nota);

        return notaMapper.toResponse(notaGuardada);
    }

    public Page<NotaResponse> obtenerHistorial(String categoria, Pageable pageable) {
        Page<Nota> notas = (categoria != null && !categoria.isBlank())
                ? notaRepository.findByCategoria(categoria, pageable)
                : notaRepository.findAll(pageable);

        return notas.map(notaMapper::toResponse);
    }

    public EstadisticasResponse obtenerEstadisticas() {
        long total = notaRepository.count();
        Double precisionPromedio = notaRepository.findPrecisionPromedio();

        Double precisionRedondeada = precisionPromedio != null
                ? Math.round(precisionPromedio * 10000.0) / 10000.0
                : null;

        return new EstadisticasResponse(total, precisionRedondeada);
    }
}
