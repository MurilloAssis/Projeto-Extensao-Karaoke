package br.edu.ifsp.karaoke.exception;

import br.edu.ifsp.karaoke.model.StatusPedido;

public class TransicaoInvalidaException extends RuntimeException {

    public TransicaoInvalidaException(Integer idFila, StatusPedido de, StatusPedido para) {
        super("Pedido %d não pode passar de %s para %s.".formatted(idFila, de.getValor(), para.getValor()));
    }
}
