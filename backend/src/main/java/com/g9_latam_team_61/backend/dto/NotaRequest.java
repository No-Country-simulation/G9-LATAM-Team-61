package com.g9_latam_team_61.backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record NotaRequest(

        @Size(max = 500, message = "El título no puede exceder 500 caracteres")
        String titulo,

        @NotBlank(message = "La descripcion es obligatoria")
        @Size(min = 30, max = 5000, message = "La descripcion debe tener entre 10 y 10000 caracteres")
        String descripcion
) {
}
