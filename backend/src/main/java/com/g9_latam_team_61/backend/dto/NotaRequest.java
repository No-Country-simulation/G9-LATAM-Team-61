package com.g9_latam_team_61.backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record NotaRequest(
        @NotBlank(message = "La descripcion es obligatoria")
        @Size(min = 30, max = 5000, message = "La descripcion debe tener entre 30 y 5000 caracteres")
        String descripcion
) {
}
