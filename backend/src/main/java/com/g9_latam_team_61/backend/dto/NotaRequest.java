package com.g9_latam_team_61.backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record NotaRequest(

        @Size(max = 500, message = "El título no puede exceder 500 caracteres")
        String titulo,

        @NotBlank(message = "La descripcion es obligatorio")
        @Size(min = 10, message = "La descripcion debe tener al menos 10 caracteres")
        String descripcion
) {
}
