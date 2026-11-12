package br.edu.ifsp.karaoke.config;

import br.edu.ifsp.karaoke.security.SomenteLeituraStompInterceptor;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Lazy;
import org.springframework.messaging.simp.config.ChannelRegistration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.scheduling.TaskScheduler;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

/** Canal de avisos em tempo real (Seção 4.5): a API publica, as telas só assinam. */
@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    public static final String ENDPOINT = "/ws";
    public static final String TOPICO_FILA = "/topic/fila-atualizada";

    private static final long HEARTBEAT_MS = 10_000;

    private final CorsConfig corsConfig;
    private final TaskScheduler agendador;

    public WebSocketConfig(CorsConfig corsConfig,
                           @Lazy @Qualifier("messageBrokerTaskScheduler") TaskScheduler agendador) {
        this.corsConfig = corsConfig;
        this.agendador = agendador;
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registro) {
        registro.addEndpoint(ENDPOINT).setAllowedOriginPatterns(corsConfig.origens());
    }

    @Override
    public void configureMessageBroker(MessageBrokerRegistry registro) {
        registro.enableSimpleBroker("/topic")
                .setHeartbeatValue(new long[]{HEARTBEAT_MS, HEARTBEAT_MS})
                .setTaskScheduler(agendador);
    }

    @Override
    public void configureClientInboundChannel(ChannelRegistration registro) {
        registro.interceptors(new SomenteLeituraStompInterceptor());
    }
}
