package com.g9_latam_team_61.backend.controller;

import com.g9_latam_team_61.backend.dto.EstadisticasResponse;
import com.g9_latam_team_61.backend.dto.NotaRequest;
import com.g9_latam_team_61.backend.dto.NotaResponse;
import com.g9_latam_team_61.backend.service.NotaService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor

public class NotaController {

    private final NotaService notaService;

    @PostMapping("/contenido")
    public ResponseEntity<NotaResponse> analizar(@Valid @RequestBody NotaRequest request){

        NotaResponse response  = notaService.procesar(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response );
    }

    @GetMapping("/contenido")
    public ResponseEntity<Page<NotaResponse>> historial(
            @RequestParam(required = false) String categoria,
            @PageableDefault(size = 10, sort = "fechaAnalisis", direction = Sort.Direction.DESC) Pageable pageable
            ){
        Page<NotaResponse> response =   notaService.obtenerHistorial(categoria, pageable);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/contenido/stats")
    public ResponseEntity<EstadisticasResponse> estadisticas() {
        EstadisticasResponse response = notaService.obtenerEstadisticas();
        return ResponseEntity.ok(response);
    }
}
