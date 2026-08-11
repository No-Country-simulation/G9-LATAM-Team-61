package com.g9_latam_team_61.backend.mapper;

import com.g9_latam_team_61.backend.client.MlResult;
import com.g9_latam_team_61.backend.dto.NotaRequest;
import com.g9_latam_team_61.backend.dto.NotaResponse;
import com.g9_latam_team_61.backend.model.Nota;
import org.springframework.stereotype.Component;

@Component
public class NotaMapper {

    public Nota toEntity(NotaRequest request, MlResult mlResult) {
        Nota nota = new Nota();
        nota.setTitulo(request.titulo());
        nota.setContenidoOriginal(request.descripcion());
        nota.setCategoria(mlResult.categoria());
        nota.setProbabilidad(mlResult.probabilidad());
        nota.setPalabrasClave(mlResult.palabrasClave());
        return nota;
    }

    public NotaResponse toResponse(Nota nota) {
        return toResponse(nota, null);
    }

    public NotaResponse toResponse(Nota nota, Double tiempoProcesamientoMs) {
        return new NotaResponse(
                nota.getId(),
                nota.getTitulo(),
                nota.getCategoria(),
                nota.getProbabilidad(),
                nota.getPalabrasClave(),
                nota.getFechaAnalisis(),
                tiempoProcesamientoMs
        );
    }
}
