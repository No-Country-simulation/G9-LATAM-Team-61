package com.g9_latam_team_61.backend.service;

import com.g9_latam_team_61.backend.client.FastApiResponse;
import com.g9_latam_team_61.backend.client.MlClient;
import com.g9_latam_team_61.backend.client.MlResult;
import com.g9_latam_team_61.backend.client.MlServiceException;
import com.g9_latam_team_61.backend.dto.EstadisticasResponse;
import com.g9_latam_team_61.backend.dto.LoteRequest;
import com.g9_latam_team_61.backend.dto.LoteResponse;
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
import org.springframework.data.domain.*;
import org.springframework.mock.web.MockMultipartFile;

import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.util.List;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.anyList;
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

        NotaRequest request = new NotaRequest("Descripcion con mas de 30 caracteres para testing completo");
        MlResult mlResult = new MlResult("DevOps", 0.94, List.of("OCI", "Docker"), 32.5);

        Nota notaSinGuardar = new Nota();
        notaSinGuardar.setContenidoOriginal(request.descripcion());
        notaSinGuardar.setTiempoProcesamientoMs(32.5);

        Nota notaGuardada = new Nota();
        notaGuardada.setId(1L);
        notaGuardada.setContenidoOriginal(request.descripcion());
        notaGuardada.setCategoria("DevOps");
        notaGuardada.setProbabilidad(0.94);
        notaGuardada.setPalabrasClave(List.of("OCI", "Docker"));
        notaGuardada.setFechaAnalisis(LocalDateTime.now());
        notaGuardada.setTiempoProcesamientoMs(32.5);

        NotaResponse expectedResponse = new NotaResponse(
                1L, "Descripcion con mas de 30 caracteres para testing completo", "DevOps", 0.94,
                List.of("OCI", "Docker"), notaGuardada.getFechaAnalisis(), 32.5
        );

        when(mlClient.analizar(anyString())).thenReturn(mlResult);
        when(notaMapper.toEntity(request, mlResult)).thenReturn(notaSinGuardar);
        when(notaRepository.save(notaSinGuardar)).thenReturn(notaGuardada);
        when(notaMapper.toResponse(notaGuardada)).thenReturn(expectedResponse);

        NotaResponse response = notaService.procesar(request);

        assertEquals(expectedResponse, response);
        verify(mlClient).analizar("Descripcion con mas de 30 caracteres para testing completo");
        verify(notaRepository).save(notaSinGuardar);
    }

    @Test
    void procesarLote_debeProcesarPayloadJsonExitosamente() {
        LoteRequest request = new LoteRequest(List.of("Texto técnico 1", "Texto técnico 2"));

        FastApiResponse res1 = new FastApiResponse("DevOps", 0.94, List.of("docker"), 3.2);
        FastApiResponse res2 = new FastApiResponse("Backend", 0.88, List.of("spring"), 3.5);

        Nota n1 = new Nota();
        n1.setId(1L);
        n1.setContenidoOriginal("Texto técnico 1");

        Nota n2 = new Nota();
        n2.setId(2L);
        n2.setContenidoOriginal("Texto técnico 2");

        when(mlClient.analizarLote(anyList())).thenReturn(List.of(res1, res2));
        when(notaRepository.saveAll(anyList())).thenReturn(List.of(n1, n2));
        when(notaMapper.toResponse(n1)).thenReturn(new NotaResponse(1L, "Texto técnico 1", "DevOps", 0.94, List.of("docker"), LocalDateTime.now(), 3.2));
        when(notaMapper.toResponse(n2)).thenReturn(new NotaResponse(2L, "Texto técnico 2", "Backend", 0.88, List.of("spring"), LocalDateTime.now(), 3.5));

        LoteResponse response = notaService.procesarLote(null, request);

        assertEquals(2, response.archivosProcesados());
        assertEquals(6.7, response.tiempoTotalMs());
        assertEquals(2, response.resultados().size());
        verify(notaRepository).saveAll(anyList());
    }

    @Test
    void procesarLote_debeProcesarArchivoCsvExitosamente() {
        String csvContent = "contenido\nTexto de prueba CSV 1\nTexto de prueba CSV 2\n";
        MockMultipartFile file = new MockMultipartFile("file", "test.csv", "text/csv", csvContent.getBytes(StandardCharsets.UTF_8));

        FastApiResponse res1 = new FastApiResponse("DevOps", 0.94, List.of("docker"), 3.2);
        FastApiResponse res2 = new FastApiResponse("Backend", 0.88, List.of("spring"), 3.5);

        Nota n1 = new Nota();
        n1.setId(1L);
        n1.setContenidoOriginal("Texto de prueba CSV 1");

        Nota n2 = new Nota();
        n2.setId(2L);
        n2.setContenidoOriginal("Texto de prueba CSV 2");

        when(mlClient.analizarLote(anyList())).thenReturn(List.of(res1, res2));
        when(notaRepository.saveAll(anyList())).thenReturn(List.of(n1, n2));
        when(notaMapper.toResponse(n1)).thenReturn(new NotaResponse(1L, "Texto de prueba CSV 1", "DevOps", 0.94, List.of("docker"), LocalDateTime.now(), 3.2));
        when(notaMapper.toResponse(n2)).thenReturn(new NotaResponse(2L, "Texto de prueba CSV 2", "Backend", 0.88, List.of("spring"), LocalDateTime.now(), 3.5));

        LoteResponse response = notaService.procesarLote(file, null);

        assertEquals(2, response.archivosProcesados());
        verify(notaRepository).saveAll(anyList());
    }

    @Test
    void procesarLote_debeLanzarExcepcion_siNoSeProveenEntradas() {
        assertThrows(IllegalArgumentException.class, () -> notaService.procesarLote(null, null));
    }

    @Test
    void procesar_noDebeGuardarNada_siFastApiFalla() {

        NotaRequest request = new NotaRequest("Descripcion con mas de 30 caracteres valida sin titulo");

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

        when(notaRepository.findByCategoriaIgnoreCase("DevOps", pageable)).thenReturn(notaPage);
        when(notaMapper.toResponse(nota)).thenReturn(
                new NotaResponse(1L, "Contenido", "DevOps", 0.9, List.of("test"), LocalDateTime.now(), null)
        );

        Page<NotaResponse> resultado = notaService.obtenerHistorial("DevOps", pageable);

        assertEquals(1, resultado.getTotalElements());
        verify(notaRepository).findByCategoriaIgnoreCase("DevOps", pageable);
    }

    @Test
    void obtenerEstadisticas_debeCalcularTotalYPromedio() {
        when(notaRepository.count()).thenReturn(5L);
        when(notaRepository.findConfianzaPromedio()).thenReturn(0.912345);

        EstadisticasResponse response = notaService.obtenerEstadisticas();

        assertEquals(5L, response.totalIndexados());
        assertEquals(0.9123, response.confianzaPromedio());
    }

    @Test
    void obtenerEstadisticas_debeManejarBaseDatosVacia() {
        when(notaRepository.count()).thenReturn(0L);
        when(notaRepository.findConfianzaPromedio()).thenReturn(null);

        EstadisticasResponse response = notaService.obtenerEstadisticas();

        assertEquals(0L, response.totalIndexados());
        assertNull(response.confianzaPromedio());
    }

    @Test
    void obtenerHistorial_debeRechazarPageSizeExcesivo() {
        Pageable pageableInvalido = PageRequest.of(0, 200);

        assertThrows(IllegalArgumentException.class,
                () -> notaService.obtenerHistorial(null, pageableInvalido));
    }

    @Test
    void obtenerHistorial_debeRechazarCampoDeOrdenNoPermitido() {
        Pageable pageableInvalido = PageRequest.of(0, 10, Sort.by("campoInexistente"));

        assertThrows(IllegalArgumentException.class,
                () -> notaService.obtenerHistorial(null, pageableInvalido));
    }
}