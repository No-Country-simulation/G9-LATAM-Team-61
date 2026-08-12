package com.g9_latam_team_61.backend.controller;

import com.g9_latam_team_61.backend.dto.AgruparResponse;
import com.g9_latam_team_61.backend.dto.CategoriaConteoResponse;
import com.g9_latam_team_61.backend.dto.EstadisticasResponse;
import com.g9_latam_team_61.backend.dto.FeedbackRequest;
import com.g9_latam_team_61.backend.dto.HealthResponse;
import com.g9_latam_team_61.backend.dto.LoteRequest;
import com.g9_latam_team_61.backend.dto.LoteResponse;
import com.g9_latam_team_61.backend.dto.NotaRequest;
import com.g9_latam_team_61.backend.dto.NotaResponse;
import com.g9_latam_team_61.backend.dto.PaginaResponse;
import com.g9_latam_team_61.backend.service.NotaService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class NotaController {

    private final NotaService notaService;

    @PostMapping("/contenido")
    public ResponseEntity<NotaResponse> analizar(@Valid @RequestBody NotaRequest request){

        NotaResponse response  = notaService.procesar(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PostMapping(value = "/contenido/lote", consumes = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<LoteResponse> analizarLoteJson(@Valid @RequestBody LoteRequest request) {
        LoteResponse response = notaService.procesarLote(null, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PostMapping(value = "/contenido/lote", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<LoteResponse> analizarLoteCsv(@RequestParam("file") MultipartFile file) {
        LoteResponse response = notaService.procesarLote(file, null);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PostMapping("/contenido/agrupar")
    public ResponseEntity<AgruparResponse> agruparContenido(@RequestParam(value = "n_clusters", required = false) Integer nClusters) {
        AgruparResponse response = notaService.agruparContenido(nClusters);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/contenido/{id}/feedback")
    public ResponseEntity<NotaResponse> registrarFeedback(
            @PathVariable("id") Long id,
            @Valid @RequestBody FeedbackRequest request
    ) {
        NotaResponse response = notaService.registrarFeedback(id, request);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/health")
    public ResponseEntity<HealthResponse> verificarSalud() {
        HealthResponse response = notaService.verificarSaludSistema();
        return ResponseEntity.ok(response);
    }

    @GetMapping("/buscar")
    public ResponseEntity<List<NotaResponse>> buscar(@RequestParam("q") String query) {
        List<NotaResponse> resultados = notaService.buscar(query);
        return ResponseEntity.ok(resultados);
    }

    @GetMapping("/contenido/{id}/recomendados")
    public ResponseEntity<List<NotaResponse>> recomendados(@PathVariable("id") Long id) {
        List<NotaResponse> recomendados = notaService.obtenerRecomendados(id);
        return ResponseEntity.ok(recomendados);
    }

    @GetMapping("/categorias")
    public ResponseEntity<List<CategoriaConteoResponse>> obtenerCategorias() {
        List<CategoriaConteoResponse> categorias = notaService.obtenerConteoCategorias();
        return ResponseEntity.ok(categorias);
    }

    @GetMapping("/contenido")
    public ResponseEntity<PaginaResponse<NotaResponse>> historial(
            @RequestParam(required = false) String categoria,
            @PageableDefault(size = 10, sort = "fechaAnalisis", direction = Sort.Direction.DESC) Pageable pageable
    ){

        Page<NotaResponse> response = notaService.obtenerHistorial(categoria, pageable);
        return ResponseEntity.ok(PaginaResponse.from(response));
    }

    @GetMapping("/contenido/stats")
    public ResponseEntity<EstadisticasResponse> estadisticas() {
        EstadisticasResponse response = notaService.obtenerEstadisticas();
        return ResponseEntity.ok(response);
    }
}
