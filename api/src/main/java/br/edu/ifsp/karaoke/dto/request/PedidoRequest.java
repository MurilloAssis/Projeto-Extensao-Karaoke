package br.edu.ifsp.karaoke.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

/** Corpo de POST /api/fila (Figura 7: videoId e título). */
public record PedidoRequest(
        @NotBlank
        @Pattern(regexp = "^[A-Za-z0-9_-]{11}$", message = "deve ser um videoId do YouTube com 11 caracteres")
        String videoId,

        @NotBlank
        @Size(max = 180)
        String titulo) {
}
