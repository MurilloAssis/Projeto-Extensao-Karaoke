package br.edu.ifsp.karaoke.event;

import br.edu.ifsp.karaoke.config.WebSocketConfig;
import br.edu.ifsp.karaoke.dto.response.SessaoAtualizadaMensagem;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.event.EventListener;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Component;

import java.time.Clock;
import java.time.Instant;

@Component
public class SessaoWebSocketPublisher {

    private static final Logger log = LoggerFactory.getLogger(SessaoWebSocketPublisher.class);

    private final SimpMessagingTemplate mensageiro;
    private final Clock relogio;

    public SessaoWebSocketPublisher(SimpMessagingTemplate mensageiro, Clock relogio) {
        this.mensageiro = mensageiro;
        this.relogio = relogio;
    }

    @EventListener
    public void aoAlterarSessao(SessaoAlteradaEvent evento) {
        try {
            mensageiro.convertAndSend(WebSocketConfig.TOPICO_SESSAO,
                    new SessaoAtualizadaMensagem(SessaoAtualizadaMensagem.EVENTO, evento.status(), Instant.now(relogio)));
        } catch (RuntimeException e) {
            log.error("Falha ao enviar sessao-atualizada ({})", evento.status(), e);
        }
    }
}
