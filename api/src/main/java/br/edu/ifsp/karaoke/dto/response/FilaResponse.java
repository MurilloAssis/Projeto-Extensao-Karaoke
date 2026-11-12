package br.edu.ifsp.karaoke.dto.response;

import java.util.List;

/** Estado da fila: Tocando agora (atual, nulo = espera) e próximos em ordem FIFO. */
public record FilaResponse(
        ItemFilaResponse atual,
        List<ItemFilaResponse> proximos,
        int total) {
}
