package br.edu.ifsp.karaoke.event;

import org.springframework.messaging.converter.JacksonJsonMessageConverter;
import org.springframework.messaging.simp.stomp.StompFrameHandler;
import org.springframework.messaging.simp.stomp.StompHeaders;
import org.springframework.messaging.simp.stomp.StompSession;
import org.springframework.messaging.simp.stomp.StompSessionHandlerAdapter;
import org.springframework.scheduling.concurrent.ThreadPoolTaskScheduler;
import org.springframework.web.socket.WebSocketHttpHeaders;
import org.springframework.web.socket.client.standard.StandardWebSocketClient;
import org.springframework.web.socket.messaging.WebSocketStompClient;
import tools.jackson.databind.JsonNode;

import java.lang.reflect.Type;
import java.time.Duration;
import java.util.concurrent.BlockingQueue;
import java.util.concurrent.LinkedBlockingQueue;
import java.util.concurrent.TimeUnit;

import static org.assertj.core.api.Assertions.assertThat;

/** Tela de teste: conecta no /ws, assina um destino e guarda as mensagens recebidas. */
class ClienteStomp implements AutoCloseable {

    final BlockingQueue<JsonNode> mensagens = new LinkedBlockingQueue<>();
    final BlockingQueue<String> erros = new LinkedBlockingQueue<>();
    private final ThreadPoolTaskScheduler agendador = new ThreadPoolTaskScheduler();
    private final StompSession sessao;

    private ClienteStomp(int porta, WebSocketHttpHeaders cabecalhos) throws Exception {
        agendador.initialize();
        WebSocketStompClient cliente = new WebSocketStompClient(new StandardWebSocketClient());
        cliente.setMessageConverter(new JacksonJsonMessageConverter());
        cliente.setTaskScheduler(agendador);
        this.sessao = cliente.connectAsync("ws://localhost:" + porta + "/ws", cabecalhos, new StompSessionHandlerAdapter() {
            @Override
            public void handleFrame(StompHeaders headers, Object payload) {
                erros.add(String.valueOf(headers.getFirst("message")));
            }

            @Override
            public void handleTransportError(StompSession session, Throwable exception) {
                erros.add("transporte: " + exception.getMessage());
            }
        }).get(5, TimeUnit.SECONDS);
    }

    static ClienteStomp conectar(int porta) throws Exception {
        return new ClienteStomp(porta, new WebSocketHttpHeaders());
    }

    static ClienteStomp conectar(int porta, WebSocketHttpHeaders cabecalhos) throws Exception {
        return new ClienteStomp(porta, cabecalhos);
    }

    /** Envia o SUBSCRIBE (o broker simples não confirma com RECEIPT; o teste verifica no broker). */
    ClienteStomp assinar(String destino) {
        sessao.subscribe(destino, new StompFrameHandler() {
            @Override
            public Type getPayloadType(StompHeaders headers) {
                return JsonNode.class;
            }

            @Override
            public void handleFrame(StompHeaders headers, Object payload) {
                mensagens.add((JsonNode) payload);
            }
        });
        return this;
    }

    void enviar(String destino, Object corpo) {
        StompHeaders cabecalhos = new StompHeaders();
        cabecalhos.setDestination(destino);
        sessao.send(cabecalhos, corpo);
    }

    JsonNode proximaMensagem(Duration espera) throws InterruptedException {
        JsonNode mensagem = mensagens.poll(espera.toMillis(), TimeUnit.MILLISECONDS);
        assertThat(mensagem).as("mensagem fila-atualizada recebida em %s", espera).isNotNull();
        return mensagem;
    }

    void semMensagens(Duration espera) throws InterruptedException {
        assertThat(mensagens.poll(espera.toMillis(), TimeUnit.MILLISECONDS)).isNull();
    }

    boolean conectado() {
        return sessao.isConnected();
    }

    @Override
    public void close() {
        if (sessao.isConnected()) {
            sessao.disconnect();
        }
        agendador.shutdown();
    }
}
