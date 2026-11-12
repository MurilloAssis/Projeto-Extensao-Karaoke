package br.edu.ifsp.karaoke.model;

import br.edu.ifsp.karaoke.exception.TransicaoInvalidaException;
import org.junit.jupiter.api.Test;

import java.time.LocalDateTime;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/** RN04: transições permitidas do pedido (Figura 9). */
class FilaModelTest {

    private FilaModel novoPedido() {
        return new FilaModel(null, null, LocalDateTime.now());
    }

    @Test
    void novoPedidoComecaNaFila() {
        assertThat(novoPedido().getStatus()).isEqualTo(StatusPedido.NA_FILA);
    }

    @Test
    void cicloCompletoAteConcluido() {
        FilaModel pedido = novoPedido();
        pedido.iniciarReproducao();
        assertThat(pedido.getStatus()).isEqualTo(StatusPedido.REPRODUZINDO);
        pedido.concluir();
        assertThat(pedido.getStatus()).isEqualTo(StatusPedido.CONCLUIDO);
    }

    @Test
    void pedidoNaFilaPodeSerCancelado() {
        FilaModel pedido = novoPedido();
        pedido.cancelar();
        assertThat(pedido.getStatus()).isEqualTo(StatusPedido.CANCELADO);
    }

    @Test
    void naoConcluiPedidoQueNaoEstaTocando() {
        assertThatThrownBy(() -> novoPedido().concluir()).isInstanceOf(TransicaoInvalidaException.class);
    }

    @Test
    void naoCancelaPedidoEmReproducao() {
        FilaModel pedido = novoPedido();
        pedido.iniciarReproducao();
        assertThatThrownBy(pedido::cancelar).isInstanceOf(TransicaoInvalidaException.class);
    }

    @Test
    void estadosFinaisNaoMudam() {
        FilaModel concluido = novoPedido();
        concluido.iniciarReproducao();
        concluido.concluir();
        assertThatThrownBy(concluido::iniciarReproducao).isInstanceOf(TransicaoInvalidaException.class);
        assertThatThrownBy(concluido::cancelar).isInstanceOf(TransicaoInvalidaException.class);

        FilaModel cancelado = novoPedido();
        cancelado.cancelar();
        assertThatThrownBy(cancelado::iniciarReproducao).isInstanceOf(TransicaoInvalidaException.class);
        assertThatThrownBy(cancelado::concluir).isInstanceOf(TransicaoInvalidaException.class);
    }
}
