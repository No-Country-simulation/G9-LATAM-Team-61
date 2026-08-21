package com.g9_latam_team_61.backend.client;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record FastApiRequest(
        @NotBlank(message = "El contenido_crudo es obligatorio")
        @Size(min = 30, max = 5000, message = "El contenido_crudo debe tener entre 30 y 5000 caracteres")
        String contenido_crudo
) {
}
