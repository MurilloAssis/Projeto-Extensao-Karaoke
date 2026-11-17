package br.edu.ifsp.karaoke.event;

/** Sessão aberta ou encerrada; {@code status} é "aberta" ou "encerrada". */
public record SessaoAlteradaEvent(String status) {
}
