package br.edu.ifsp.karaoke.model;

import com.fasterxml.jackson.annotation.JsonValue;

import java.util.Arrays;

public enum TipoPerfil {
    VISITANTE("visitante"),
    CLIENTE("cliente"),
    ADMIN("admin");

    private final String valor;

    TipoPerfil(String valor) {
        this.valor = valor;
    }

    @JsonValue
    public String getValor() {
        return valor;
    }

    public String getRole() {
        return "ROLE_" + name();
    }

    public static TipoPerfil deValor(String valor) {
        return Arrays.stream(values())
                .filter(t -> t.valor.equals(valor))
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException("Perfil desconhecido: " + valor));
    }
}
