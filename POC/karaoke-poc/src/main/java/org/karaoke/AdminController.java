package org.karaoke;

import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.web.bind.annotation.*;

import java.util.regex.Matcher;
import java.util.regex.Pattern;

@RestController
@RequestMapping("/api/admin")
@CrossOrigin("*")
public class AdminController {
    private final SimpMessagingTemplate websocket;

    public AdminController(SimpMessagingTemplate websocket) {
        this.websocket = websocket;
    }

    @PostMapping("/tocar")
    public void tocarVideo(@RequestBody String youtubeUrl) {
        try {
            String videoId = extrairIdDoYouTube(youtubeUrl);

            if (videoId != null && !videoId.isEmpty()) {
                // Envia apenas o ID puro para o Frontend fazer a busca no Invidious
                websocket.convertAndSend("/topico/player", videoId);
                System.out.println("ID enviado para a TV: " + videoId);
            } else {
                System.err.println("URL inválida ou ID não encontrado: " + youtubeUrl);
            }
        } catch (Exception e) {
            System.err.println("Erro ao processar requisição: " + e.getMessage());
        }
    }

    private String extrairIdDoYouTube(String url) {
        // Expressão regular para capturar o ID em links padrão (watch?v=) ou curtos (youtu.be/)
        String regex = "(?:v=|youtu\\.be\\/)([^&\\n]+)";
        Pattern pattern = Pattern.compile(regex);
        Matcher matcher = pattern.matcher(url);

        if (matcher.find()) {
            return matcher.group(1);
        }
        return null;
    }
}
