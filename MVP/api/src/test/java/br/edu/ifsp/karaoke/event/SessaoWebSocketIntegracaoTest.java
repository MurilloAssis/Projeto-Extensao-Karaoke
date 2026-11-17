package br.edu.ifsp.karaoke.event;

import br.edu.ifsp.karaoke.IntegracaoTest;
import br.edu.ifsp.karaoke.service.SessaoService;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.messaging.Message;
import org.springframework.messaging.simp.SimpMessageHeaderAccessor;
import org.springframework.messaging.simp.SimpMessageType;
import org.springframework.messaging.simp.broker.SimpleBrokerMessageHandler;
import org.springframework.messaging.support.MessageBuilder;
import tools.jackson.databind.JsonNode;

import java.time.Duration;

import static org.assertj.core.api.Assertions.assertThat;

/** Aviso sessao-atualizada: telão e painel sabem que a sessão mudou, sem o código trafegar no canal público. */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
class SessaoWebSocketIntegracaoTest extends IntegracaoTest {

    private static final String TOPICO = "/topic/sessao-atualizada";
    private static final Duration ESPERA = Duration.ofSeconds(2);

    @LocalServerPort
    private int porta;

    @Autowired
    private SessaoService sessaoService;

    @Autowired
    private SimpleBrokerMessageHandler broker;

    private ClienteStomp tela;

    @AfterEach
    void desconectar() {
        if (tela != null) {
            tela.close();
        }
    }

    @Test
    void abrirEEncerrarAvisamAsTelasSemOCodigo() throws Exception {
        tela = ClienteStomp.conectar(porta).assinar(TOPICO);
        aguardarAssinatura();
        int admin = criarAdmin();

        String idSessao = sessaoService.abrir(admin).idSessao();
        JsonNode aberta = tela.proximaMensagem(ESPERA);
        assertThat(aberta.get("evento").asString()).isEqualTo("sessao-atualizada");
        assertThat(aberta.get("status").asString()).isEqualTo("aberta");
        assertThat(aberta.has("codigo")).isFalse();
        assertThat(aberta.has("idSessao")).isFalse();

        sessaoService.encerrar(idSessao);
        assertThat(tela.proximaMensagem(ESPERA).get("status").asString()).isEqualTo("encerrada");
    }

    private void aguardarAssinatura() throws InterruptedException {
        SimpMessageHeaderAccessor cabecalhos = SimpMessageHeaderAccessor.create(SimpMessageType.MESSAGE);
        cabecalhos.setDestination(TOPICO);
        Message<byte[]> sonda = MessageBuilder.createMessage(new byte[0], cabecalhos.getMessageHeaders());
        long limite = System.nanoTime() + Duration.ofSeconds(3).toNanos();
        while (broker.getSubscriptionRegistry().findSubscriptions(sonda).isEmpty()) {
            assertThat(System.nanoTime()).as("assinatura registrada no broker").isLessThan(limite);
            Thread.sleep(10);
        }
    }
}
