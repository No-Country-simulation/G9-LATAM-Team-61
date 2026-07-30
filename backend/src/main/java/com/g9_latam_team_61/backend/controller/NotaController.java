package com.g9_latam_team_61.backend.controller;

import com.g9_latam_team_61.backend.dto.NotaRequest;
import com.g9_latam_team_61.backend.dto.NotaResponse;
import com.g9_latam_team_61.backend.service.NotaService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
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
}
