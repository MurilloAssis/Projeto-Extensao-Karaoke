package br.edu.ifsp.karaoke.event;

import br.edu.ifsp.karaoke.config.WebSocketConfig;
import br.edu.ifsp.karaoke.dto.response.FilaAtualizadaMensagem;
import br.edu.ifsp.karaoke.dto.response.FilaResponse;
import br.edu.ifsp.karaoke.service.ConsultaFilaService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Component;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.TransactionDefinition;
import org.springframework.transaction.event.TransactionalEventListener;
import org.springframework.transaction.support.TransactionTemplate;

import java.time.Clock;
import java.time.Instant;

/** Envia o estado da fila a todas as telas depois que cada alteração é confirmada no banco. */
@Component
public class FilaWebSocketPublisher {

    private static final Logger log = LoggerFactory.getLogger(FilaWebSocketPublisher.class);

    private final ConsultaFilaService consultaFilaService;
    private final SimpMessagingTemplate mensageiro;
    private final Clock relogio;
    private final TransactionTemplate leitura;
    private long versao;

    public FilaWebSocketPublisher(ConsultaFilaService consultaFilaService,
                                  SimpMessagingTemplate mensageiro,
                                  Clock relogio,
                                  PlatformTransactionManager transactionManager) {
        this.consultaFilaService = consultaFilaService;
        this.mensageiro = mensageiro;
        this.relogio = relogio;
        this.leitura = new TransactionTemplate(transactionManager);
        this.leitura.setPropagationBehavior(TransactionDefinition.PROPAGATION_REQUIRES_NEW);
        this.leitura.setReadOnly(true);
    }

    /** Leitura e envio serializados: as versões saem sempre na ordem dos estados salvos. */
    @TransactionalEventListener
    public synchronized void aoAlterarFila(FilaAlteradaEvent evento) {
        try {
            FilaResponse fila = leitura.execute(s -> consultaFilaService.visao(false));
            var mensagem = new FilaAtualizadaMensagem(FilaAtualizadaMensagem.EVENTO, evento.motivo(),
                    evento.idFila(), ++versao, Instant.now(relogio), fila);
            mensageiro.convertAndSend(WebSocketConfig.TOPICO_FILA, mensagem);
        } catch (RuntimeException e) {
            // A fila já foi salva; uma falha no aviso não pode desfazer nem quebrar a operação.
            log.error("Falha ao enviar fila-atualizada ({})", evento.motivo(), e);
        }
    }
}
