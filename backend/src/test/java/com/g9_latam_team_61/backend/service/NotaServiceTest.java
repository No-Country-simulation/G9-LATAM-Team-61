package com.g9_latam_team_61.backend.service;

import com.g9_latam_team_61.backend.client.MlClient;
import com.g9_latam_team_61.backend.client.MlResult;
import com.g9_latam_team_61.backend.client.MlServiceException;
import com.g9_latam_team_61.backend.dto.EstadisticasResponse;
import com.g9_latam_team_61.backend.dto.NotaRequest;
import com.g9_latam_team_61.backend.dto.NotaResponse;
import com.g9_latam_team_61.backend.mapper.NotaMapper;
import com.g9_latam_team_61.backend.model.Nota;
import com.g9_latam_team_61.backend.repository.NotaRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

import java.time.LocalDateTime;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class NotaServiceTest {

    @Mock
    private NotaRepository notaRepository;

    @Mock
    private MlClient mlClient;

    @Mock
    private NotaMapper notaMapper;

    @InjectMocks
    private NotaService notaService;

    @Test
    void procesar_debeGuardarNotaYRetornarResponse() {

        NotaRequest request = new NotaRequest("Titulo prueba", "Descripcion con mas de 10 caracteres");
        MlResult mlResult = new MlResult("DevOps", 0.94, List.of("OCI", "Docker"));

        Nota notaSinGuardar = new Nota();
        notaSinGuardar.setTitulo(request.titulo());
        notaSinGuardar.setContenidoOriginal(request.descripcion());

        Nota notaGuardada = new Nota();
        notaGuardada.setId(1L);
        notaGuardada.setTitulo(request.titulo());
        notaGuardada.setCategoria("DevOps");
        notaGuardada.setProbabilidad(0.94);
        notaGuardada.setPalabrasClave(List.of("OCI", "Docker"));
        notaGuardada.setFechaAnalisis(LocalDateTime.now());

        NotaResponse expectedResponse = new NotaResponse(
                1L, "Titulo prueba", "DevOps", 0.94,
                List.of("OCI", "Docker"), notaGuardada.getFechaAnalisis()
        );

        when(notaMapper.construirContenido(request))
                .thenReturn("Titulo prueba. Descripcion con mas de 10 caracteres");
        when(mlClient.analizar(anyString())).thenReturn(mlResult);
        when(notaMapper.toEntity(request, mlResult)).thenReturn(notaSinGuardar);
        when(notaRepository.save(notaSinGuardar)).thenReturn(notaGuardada);
        when(notaMapper.toResponse(notaGuardada)).thenReturn(expectedResponse);

        NotaResponse response = notaService.procesar(request);

        assertEquals(expectedResponse, response);
        verify(mlClient).analizar("Titulo prueba. Descripcion con mas de 10 caracteres");
        verify(notaRepository).save(notaSinGuardar);
    }

    @Test
    void procesar_noDebeGuardarNada_siFastApiFalla() {


        NotaRequest request = new NotaRequest(null, "Descripcion sin titulo pero valida");

        when(notaMapper.construirContenido(request)).thenReturn("Descripcion sin titulo pero valida");
        when(mlClient.analizar(anyString()))
                .thenThrow(new MlServiceException("FastAPI no disponible"));

        assertThrows(MlServiceException.class, () -> notaService.procesar(request));

        verify(notaRepository, never()).save(any());
    }

    @Test
    void obtenerHistorial_debeFiltrarPorCategoria() {
        Pageable pageable = PageRequest.of(0, 10);
        Nota nota = new Nota();
        nota.setCategoria("DevOps");
        Page<Nota> notaPage = new PageImpl<>(List.of(nota));

        when(notaRepository.findByCategoria("DevOps", pageable)).thenReturn(notaPage);
        when(notaMapper.toResponse(nota)).thenReturn(
                new NotaResponse(1L, "Titulo", "DevOps", 0.9, List.of("test"), LocalDateTime.now())
        );

        Page<NotaResponse> resultado = notaService.obtenerHistorial("DevOps", pageable);

        assertEquals(1, resultado.getTotalElements());
        verify(notaRepository).findByCategoria("DevOps", pageable);
    }

    @Test
    void obtenerEstadisticas_debeCalcularTotalYPromedio() {
        when(notaRepository.count()).thenReturn(5L);
        when(notaRepository.findPrecisionPromedio()).thenReturn(0.912345);

        EstadisticasResponse response = notaService.obtenerEstadisticas();

        assertEquals(5L, response.totalIndexados());
        assertEquals(0.9123, response.precisionPromedio());
    }

    @Test
    void obtenerEstadisticas_debeManejarBaseDatosVacia() {
        when(notaRepository.count()).thenReturn(0L);
        when(notaRepository.findPrecisionPromedio()).thenReturn(null);

        EstadisticasResponse response = notaService.obtenerEstadisticas();

        assertEquals(0L, response.totalIndexados());
        assertNull(response.precisionPromedio());
    }

}