package br.edu.ifsp.karaoke.security;

import br.edu.ifsp.karaoke.config.WebSocketConfig;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.MessageDeliveryException;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;

/**
 * As telas só podem assinar o tópico da fila. Comandos vão sempre por HTTP (Seção 4.5),
 * então qualquer SEND ou assinatura de outro destino é recusado.
 */
public class SomenteLeituraStompInterceptor implements ChannelInterceptor {

    @Override
    public Message<?> preSend(Message<?> mensagem, MessageChannel canal) {
        StompHeaderAccessor cabecalhos = MessageHeaderAccessor.getAccessor(mensagem, StompHeaderAccessor.class);
        if (cabecalhos == null || cabecalhos.getCommand() == null) {
            return mensagem;
        }
        if (cabecalhos.getCommand() == StompCommand.SEND) {
            throw new MessageDeliveryException("Envio de mensagens não é permitido. Use a API HTTP.");
        }
        if (cabecalhos.getCommand() == StompCommand.SUBSCRIBE
                && !WebSocketConfig.TOPICO_FILA.equals(cabecalhos.getDestination())) {
            throw new MessageDeliveryException("Destino não permitido: " + cabecalhos.getDestination());
        }
        return mensagem;
    }
}
