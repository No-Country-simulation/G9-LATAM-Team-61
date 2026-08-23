package com.g9_latam_team_61.backend.mapper;

import com.g9_latam_team_61.backend.client.MlResult;
import com.g9_latam_team_61.backend.dto.NotaRequest;
import com.g9_latam_team_61.backend.dto.NotaResponse;
import com.g9_latam_team_61.backend.model.Nota;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class NotaMapper {

    public Nota toEntity(NotaRequest request, MlResult mlResult) {
        Nota nota = new Nota();
        nota.setContenidoOriginal(request.descripcion());
        nota.setCategoria(mlResult.categoria());
        nota.setProbabilidad(mlResult.probabilidad());
        nota.setPalabrasClave(mlResult.palabrasClave());
        nota.setTiempoProcesamientoMs(mlResult.tiempoProcesamientoMs());
        return nota;
    }

    public NotaResponse toResponse(Nota nota) {
        return new NotaResponse(
                nota.getId(),
                nota.getContenidoOriginal(),
                nota.getCategoria(),
                nota.getProbabilidad(),
                copiarPalabrasClave(nota),
                nota.getFechaAnalisis(),
                nota.getTiempoProcesamientoMs(),
                nota.getFeedbackUsuario()
        );
    }

    public NotaResponse toResponse(Nota nota, Double tiempoProcesamientoMs) {
        return new NotaResponse(
                nota.getId(),
                nota.getContenidoOriginal(),
                nota.getCategoria(),
                nota.getProbabilidad(),
                copiarPalabrasClave(nota),
                nota.getFechaAnalisis(),
                tiempoProcesamientoMs != null ? tiempoProcesamientoMs : nota.getTiempoProcesamientoMs(),
                nota.getFeedbackUsuario()
        );
    }

    private List<String> copiarPalabrasClave(Nota nota) {
        return nota.getPalabrasClave() == null ? null : List.copyOf(nota.getPalabrasClave());
    }
}
