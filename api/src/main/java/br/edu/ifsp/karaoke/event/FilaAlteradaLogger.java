package br.edu.ifsp.karaoke.event;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionalEventListener;

/** Ponto de extensão: o card 2.2 publica fila-atualizada via WebSocket a partir deste evento. */
@Component
public class FilaAlteradaLogger {

    private static final Logger log = LoggerFactory.getLogger(FilaAlteradaLogger.class);

    @TransactionalEventListener
    public void aoAlterarFila(FilaAlteradaEvent evento) {
        log.info("Fila alterada: {} (pedido {})", evento.motivo(), evento.idFila());
    }
}
