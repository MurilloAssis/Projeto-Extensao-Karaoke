package br.edu.ifsp.karaoke.dto.response;

import java.time.LocalDateTime;

public record SessaoResponse(
        String idSessao,
        String codigo,
        String status,
        LocalDateTime abertaEm,
        LocalDateTime encerradaEm) {
}
