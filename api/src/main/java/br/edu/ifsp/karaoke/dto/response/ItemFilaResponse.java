package br.edu.ifsp.karaoke.dto.response;

import br.edu.ifsp.karaoke.model.FilaModel;
import br.edu.ifsp.karaoke.model.StatusPedido;
import com.fasterxml.jackson.annotation.JsonInclude;

import java.time.Instant;
import java.time.ZoneOffset;

/**
 * Um pedido da fila. {@code posicao} só existe para pedidos na_fila;
 * {@code solicitante} só é enviado na visão do administrador (RNF08).
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public record ItemFilaResponse(
        Integer idFila,
        StatusPedido status,
        Instant dtPedido,
        Integer posicao,
        MusicaResponse musica,
        UsuarioResumoResponse solicitante) {

    public static ItemFilaResponse de(FilaModel pedido, Integer posicao, boolean incluirSolicitante) {
        return new ItemFilaResponse(
                pedido.getIdFila(),
                pedido.getStatus(),
                pedido.getDtPedido().toInstant(ZoneOffset.UTC),
                posicao,
                MusicaResponse.de(pedido.getMusica()),
                incluirSolicitante ? UsuarioResumoResponse.de(pedido.getUsuario()) : null);
    }
}
