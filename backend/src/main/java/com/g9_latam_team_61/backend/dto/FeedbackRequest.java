package com.g9_latam_team_61.backend.dto;

import jakarta.validation.constraints.NotBlank;

public record FeedbackRequest(
        @NotBlank(message = "La categoría sugerida no puede estar vacía")
        String categoriaSugerida,
        String comentario
) {
}
