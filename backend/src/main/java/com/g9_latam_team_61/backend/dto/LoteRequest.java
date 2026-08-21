package com.g9_latam_team_61.backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.util.List;

public record LoteRequest(
        @NotNull(message = "La lista de textos no puede ser nula")
        @NotEmpty(message = "La lista de textos no puede estar vacía")
        @Size(min = 1, max = 100, message = "El lote debe contener entre 1 y 100 elementos")
        List<@NotBlank(message = "Cada texto en el lote es obligatorio") @Size(min = 30, max = 5000, message = "Cada texto en el lote debe tener entre 30 y 5000 caracteres") String> textos
) {
}
