package com.g9_latam_team_61.backend.dto;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import java.util.List;

public record LoteRequest(
        @NotNull(message = "La lista de textos no puede ser nula")
        @NotEmpty(message = "La lista de textos no puede estar vacía")
        List<String> textos
) {
}
