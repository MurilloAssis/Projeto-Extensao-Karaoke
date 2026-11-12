package br.edu.ifsp.karaoke.event;

import br.edu.ifsp.karaoke.IntegracaoTest;
import br.edu.ifsp.karaoke.dto.request.PedidoRequest;
import br.edu.ifsp.karaoke.security.ChaveReprodutorFilter;
import br.edu.ifsp.karaoke.security.IdentificacaoProvisoriaFilter;
import br.edu.ifsp.karaoke.service.ControleFilaService;
import br.edu.ifsp.karaoke.service.PedidoService;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.messaging.Message;
import org.springframework.messaging.simp.SimpMessageHeaderAccessor;
import org.springframework.messaging.simp.SimpMessageType;
import org.springframework.messaging.simp.broker.SimpleBrokerMessageHandler;
import org.springframework.messaging.support.MessageBuilder;
import org.springframework.web.socket.WebSocketHttpHeaders;
import tools.jackson.databind.JsonNode;

import java.time.Duration;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/** Card 2.2: evento fila-atualizada via WebSocket/STOMP (Seção 4.5, RNF02). */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
class FilaWebSocketIntegracaoTest extends IntegracaoTest {

    private static final String TOPICO = "/topic/fila-atualizada";
    private static final Duration ESPERA = Duration.ofSeconds(2);
    private static final Duration SILENCIO = Duration.ofMillis(800);

    @LocalServerPort
    private int porta;

    @Autowired
    private PedidoService pedidoService;

    @Autowired
    private ControleFilaService controleFilaService;

    @Autowired
    private SimpleBrokerMessageHandler broker;

    private final List<ClienteStomp> clientes = new ArrayList<>();
    private int admin;
    private int ana;

    @BeforeEach
    void preparar() {
        admin = criarAdmin();
        ana = criarVisitante("Ana");
    }

    @AfterEach
    void desconectar() throws InterruptedException {
        clientes.forEach(ClienteStomp::close);
        long limite = System.nanoTime() + Duration.ofSeconds(3).toNanos();
        while (assinantesDoTopico() > 0 && System.nanoTime() < limite) {
            Thread.sleep(10);
        }
    }

    /** Conecta uma tela e só retorna quando o broker já registrou a assinatura dela. */
    private ClienteStomp tela() throws Exception {
        int antes = assinantesDoTopico();
        ClienteStomp cliente = ClienteStomp.conectar(porta).assinar(TOPICO);
        clientes.add(cliente);
        long limite = System.nanoTime() + Duration.ofSeconds(3).toNanos();
        while (assinantesDoTopico() <= antes) {
            assertThat(System.nanoTime()).as("assinatura registrada no broker").isLessThan(limite);
            Thread.sleep(10);
        }
        return cliente;
    }

    private int assinantesDoTopico() {
        SimpMessageHeaderAccessor cabecalhos = SimpMessageHeaderAccessor.create(SimpMessageType.MESSAGE);
        cabecalhos.setDestination(TOPICO);
        Message<byte[]> sonda = MessageBuilder.createMessage(new byte[0], cabecalhos.getMessageHeaders());
        return broker.getSubscriptionRegistry().findSubscriptions(sonda).size();
    }

    @Test
    void pedidoAceitoAvisaAsTelas() throws Exception {
        ClienteStomp tela = tela();

        pedir(ana, "aaaaaaaaaa1", "Still Loving You").andExpect(status().isCreated());

        JsonNode mensagem = tela.proximaMensagem(ESPERA);
        assertThat(mensagem.get("evento").asString()).isEqualTo("fila-atualizada");
        assertThat(mensagem.get("motivo").asString()).isEqualTo("PEDIDO_ADICIONADO");
        assertThat(mensagem.get("versao").asLong()).isPositive();
        assertThat(mensagem.at("/fila/total").asInt()).isEqualTo(1);
        assertThat(mensagem.at("/fila/proximos/0/musica/youtubeId").asString()).isEqualTo("aaaaaaaaaa1");
        assertThat(mensagem.at("/fila/proximos/0/posicao").asInt()).isEqualTo(1);
    }

    @Test
    void mensagemNaoTemDadosPessoais() throws Exception {
        ClienteStomp tela = tela();

        pedir(ana, "aaaaaaaaaa1", "Still Loving You").andExpect(status().isCreated());

        String json = tela.proximaMensagem(ESPERA).toString();
        assertThat(json).doesNotContain("solicitante", "Ana", "email", "nome");
    }

    @Test
    void playAvisaComAMusicaAtualEOLink() throws Exception {
        pedidoService.solicitar(ana, new PedidoRequest("aaaaaaaaaa1", "Still Loving You"));
        ClienteStomp tela = tela();

        long inicio = System.nanoTime();
        mvc.perform(post("/api/fila/play").header(IdentificacaoProvisoriaFilter.CABECALHO, admin))
                .andExpect(status().isOk());
        JsonNode mensagem = tela.proximaMensagem(ESPERA);
        Duration atraso = Duration.ofNanos(System.nanoTime() - inicio);

        assertThat(mensagem.get("motivo").asString()).isEqualTo("REPRODUCAO_INICIADA");
        assertThat(mensagem.at("/fila/atual/status").asString()).isEqualTo("reproduzindo");
        assertThat(mensagem.at("/fila/atual/musica/urlVideo").asString())
                .isEqualTo("https://www.youtube.com/watch?v=aaaaaaaaaa1");
        assertThat(atraso).as("RNF02: menos de 2 segundos").isLessThan(Duration.ofSeconds(2));
    }

    @Test
    void cadaOperacaoDoPalcoGeraUmAvisoComOMotivoCerto() throws Exception {
        int idPrimeiro = pedidoService.solicitar(ana, new PedidoRequest("aaaaaaaaaa1", "Música 1")).idFila();
        int idSegundo = pedidoService.solicitar(criarVisitante("Bruno"), new PedidoRequest("aaaaaaaaaa2", "Música 2")).idFila();
        int idTerceiro = pedidoService.solicitar(criarVisitante("Carla"), new PedidoRequest("aaaaaaaaaa3", "Música 3")).idFila();
        ClienteStomp tela = tela();

        controleFilaService.play("teste");
        assertThat(tela.proximaMensagem(ESPERA).get("motivo").asString()).isEqualTo("REPRODUCAO_INICIADA");

        controleFilaService.proxima("teste");
        JsonNode proxima = tela.proximaMensagem(ESPERA);
        assertThat(proxima.get("motivo").asString()).isEqualTo("PROXIMA");
        assertThat(proxima.at("/fila/atual/idFila").asInt()).isEqualTo(idSegundo);

        mvc.perform(delete("/api/fila/{id}", idTerceiro).header(IdentificacaoProvisoriaFilter.CABECALHO, admin))
                .andExpect(status().isNoContent());
        assertThat(tela.proximaMensagem(ESPERA).get("motivo").asString()).isEqualTo("PEDIDO_REMOVIDO");

        mvc.perform(post("/api/fila/{id}/concluir", idSegundo)
                        .header(ChaveReprodutorFilter.CABECALHO, "chave-de-teste"))
                .andExpect(status().isOk());
        JsonNode concluido = tela.proximaMensagem(ESPERA);
        assertThat(concluido.get("motivo").asString()).isEqualTo("PEDIDO_CONCLUIDO");
        assertThat(concluido.at("/fila/atual").isNull()).isTrue();

        controleFilaService.limpar("teste");
        assertThat(tela.proximaMensagem(ESPERA).get("motivo").asString()).isEqualTo("FILA_LIMPA");

        tela.semMensagens(SILENCIO);
        assertThat(idPrimeiro).isPositive();
    }

    @Test
    void operacaoRecusadaNaoGeraAviso() throws Exception {
        pedidoService.solicitar(ana, new PedidoRequest("aaaaaaaaaa1", "Música 1"));
        ClienteStomp tela = tela();

        pedir(criarVisitante("Bruno"), "aaaaaaaaaa1", "Música 1").andExpect(status().isConflict());
        mvc.perform(post("/api/fila/proxima").header(IdentificacaoProvisoriaFilter.CABECALHO, admin))
                .andExpect(status().isConflict());

        tela.semMensagens(SILENCIO);
    }

    @Test
    void todasAsTelasRecebemAMesmaMensagem() throws Exception {
        ClienteStomp celular = tela();
        ClienteStomp telao = tela();

        pedir(ana, "aaaaaaaaaa1", "Música 1").andExpect(status().isCreated());

        assertThat(celular.proximaMensagem(ESPERA)).isEqualTo(telao.proximaMensagem(ESPERA));
    }

    @Test
    void alteracoesSimultaneasChegamEmOrdemCrescenteDeVersao() throws Exception {
        List<Integer> cantores = new ArrayList<>();
        for (int i = 0; i < 8; i++) {
            cantores.add(criarVisitante("Cantor " + i));
        }
        ClienteStomp tela = tela();

        ExecutorService executor = Executors.newFixedThreadPool(cantores.size());
        CountDownLatch largada = new CountDownLatch(1);
        for (int i = 0; i < cantores.size(); i++) {
            int cantor = cantores.get(i);
            String videoId = "aaaaaaaaa%02d".formatted(i);
            executor.submit(() -> {
                largada.await();
                return pedidoService.solicitar(cantor, new PedidoRequest(videoId, "Música"));
            });
        }
        largada.countDown();
        executor.shutdown();
        assertThat(executor.awaitTermination(10, TimeUnit.SECONDS)).isTrue();

        long versaoAnterior = 0;
        JsonNode ultima = null;
        for (int i = 0; i < cantores.size(); i++) {
            ultima = tela.proximaMensagem(ESPERA);
            assertThat(ultima.get("versao").asLong()).isGreaterThan(versaoAnterior);
            versaoAnterior = ultima.get("versao").asLong();
        }
        assertThat(ultima.at("/fila/total").asInt()).isEqualTo(cantores.size());
    }

    @Test
    void telaNaoConsegueEnviarMensagens() throws Exception {
        ClienteStomp intruso = tela();
        ClienteStomp telao = tela();

        intruso.enviar("/topic/fila-atualizada", "{\"evento\":\"falso\"}");

        assertThat(intruso.erros.poll(2, TimeUnit.SECONDS)).contains("não é permitido");
        telao.semMensagens(SILENCIO);
    }

    @Test
    void assinaturaDeOutroDestinoERecusada() throws Exception {
        ClienteStomp cliente = ClienteStomp.conectar(porta);
        clientes.add(cliente);

        cliente.assinar("/topic/outro");

        assertThat(cliente.erros.poll(2, TimeUnit.SECONDS)).contains("Destino não permitido");
    }

    @Test
    void origemNaoAutorizadaERecusada() {
        WebSocketHttpHeaders cabecalhos = new WebSocketHttpHeaders();
        cabecalhos.setOrigin("http://site-malicioso.example");

        assertThatThrownBy(() -> ClienteStomp.conectar(porta, cabecalhos)).isNotNull();
    }

    @Test
    void origemAutorizadaConecta() throws Exception {
        WebSocketHttpHeaders cabecalhos = new WebSocketHttpHeaders();
        cabecalhos.setOrigin("http://localhost:5173");

        try (ClienteStomp cliente = ClienteStomp.conectar(porta, cabecalhos)) {
            assertThat(cliente.conectado()).isTrue();
        }
    }
}
