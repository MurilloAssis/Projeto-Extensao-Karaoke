package br.edu.ifsp.karaoke.dto.response;

import br.edu.ifsp.karaoke.event.MotivoAlteracao;

import java.time.Instant;

/**
 * Mensagem "fila-atualizada" enviada a todas as telas (Seção 4.5).
 * {@code versao} cresce a cada envio: a tela descarta mensagens com versão menor ou igual à última recebida.
 */
public record FilaAtualizadaMensagem(
        String evento,
        MotivoAlteracao motivo,
        Integer idFila,
        long versao,
        Instant emitidoEm,
        FilaResponse fila) {

    public static final String EVENTO = "fila-atualizada";
}
