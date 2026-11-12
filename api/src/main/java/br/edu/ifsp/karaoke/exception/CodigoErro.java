package br.edu.ifsp.karaoke.exception;

import org.springframework.http.HttpStatus;

public enum CodigoErro {
    VALIDACAO(HttpStatus.BAD_REQUEST, "Dados inválidos"),
    NAO_IDENTIFICADO(HttpStatus.UNAUTHORIZED, "Identificação necessária"),
    RN03_ACESSO_NEGADO(HttpStatus.FORBIDDEN, "Acesso negado"),
    PEDIDO_NAO_ENCONTRADO(HttpStatus.NOT_FOUND, "Pedido não encontrado"),
    RN00_MUSICA_INDISPONIVEL(HttpStatus.CONFLICT, "Música indisponível"),
    RN01_MUSICA_JA_NA_FILA(HttpStatus.CONFLICT, "Música já está na fila"),
    RN02_LIMITE_PEDIDOS(HttpStatus.CONFLICT, "Limite de pedidos atingido"),
    RN04_JA_REPRODUZINDO(HttpStatus.CONFLICT, "Já existe uma música em reprodução"),
    RN04_FILA_VAZIA(HttpStatus.CONFLICT, "A fila está vazia"),
    RN04_NADA_REPRODUZINDO(HttpStatus.CONFLICT, "Nenhuma música em reprodução"),
    RN04_PEDIDO_NAO_REMOVIVEL(HttpStatus.CONFLICT, "Pedido não pode ser removido"),
    RN04_PEDIDO_NAO_ATIVO(HttpStatus.CONFLICT, "Pedido não está em reprodução"),
    RN04_TRANSICAO_INVALIDA(HttpStatus.CONFLICT, "Transição de estado inválida"),
    ERRO_INTERNO(HttpStatus.INTERNAL_SERVER_ERROR, "Erro interno");

    private final HttpStatus status;
    private final String titulo;

    CodigoErro(HttpStatus status, String titulo) {
        this.status = status;
        this.titulo = titulo;
    }

    public HttpStatus getStatus() {
        return status;
    }

    public String getTitulo() {
        return titulo;
    }
}
