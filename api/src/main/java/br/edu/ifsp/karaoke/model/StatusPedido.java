package br.edu.ifsp.karaoke.model;

import com.fasterxml.jackson.annotation.JsonValue;

import java.util.Arrays;
import java.util.List;

/** Estados do pedido (RN04). */
public enum StatusPedido {
    NA_FILA("na_fila"),
    REPRODUZINDO("reproduzindo"),
    CONCLUIDO("concluido"),
    CANCELADO("cancelado");

    /** Estados que contam como pedido ativo (RN01 e RN02). */
    public static final List<StatusPedido> ATIVOS = List.of(NA_FILA, REPRODUZINDO);

    private final String valor;

    StatusPedido(String valor) {
        this.valor = valor;
    }

    @JsonValue
    public String getValor() {
        return valor;
    }

    public static StatusPedido deValor(String valor) {
        return Arrays.stream(values())
                .filter(s -> s.valor.equals(valor))
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException("Status desconhecido: " + valor));
    }
}
