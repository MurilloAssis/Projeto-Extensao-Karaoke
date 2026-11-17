package br.edu.ifsp.karaoke.dto.response;

import java.time.Instant;

/**
 * Mensagem "sessao-atualizada": avisa que a sessão abriu ou encerrou.
 * Não leva o código (o WebSocket é público); admin e telão consultam GET /api/sessoes/atual.
 */
public record SessaoAtualizadaMensagem(String evento, String status, Instant emitidoEm) {

    public static final String EVENTO = "sessao-atualizada";
}
