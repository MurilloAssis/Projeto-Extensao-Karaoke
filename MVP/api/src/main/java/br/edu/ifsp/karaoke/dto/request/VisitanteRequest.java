package br.edu.ifsp.karaoke.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record VisitanteRequest(
        @NotBlank(message = "Informe o nome usado na chamada ao palco.")
        @Size(max = 120, message = "O nome deve ter no máximo 120 caracteres.")
        String nome,
        @NotBlank(message = "Informe o código da sessão.")
        @Pattern(regexp = "\\d{6}", message = "O código da sessão deve conter 6 dígitos.")
        String codigoSessao) {
}
