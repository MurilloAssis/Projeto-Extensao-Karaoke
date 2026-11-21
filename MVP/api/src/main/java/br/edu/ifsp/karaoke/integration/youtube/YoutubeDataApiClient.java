package br.edu.ifsp.karaoke.integration.youtube;

import br.edu.ifsp.karaoke.exception.IntegracaoYoutubeException;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;
import org.springframework.web.util.HtmlUtils;

import java.util.List;

@Component
public class YoutubeDataApiClient {

    static final String ENDPOINT = "https://www.googleapis.com/youtube/v3/search";
    private static final int MAX_RESULTADOS = 20;

    private final RestClient cliente;
    private final String apiKey;

    @Autowired
    public YoutubeDataApiClient(@Value("${karaoke.youtube.api-key:}") String apiKey) {
        this(RestClient.create(ENDPOINT), apiKey);
    }

    YoutubeDataApiClient(RestClient cliente, String apiKey) {
        this.cliente = cliente;
        this.apiKey = apiKey;
    }

    public List<YoutubeVideo> buscar(String consulta) {
        if (apiKey == null || apiKey.isBlank()) {
            throw new IntegracaoYoutubeException("Configure YOUTUBE_API_KEY para pesquisar fora do catálogo local.");
        }

        try {
            RespostaYoutube resposta = cliente.get()
                    .uri(uri -> uri
                            .queryParam("part", "snippet")
                            .queryParam("type", "video")
                            .queryParam("maxResults", MAX_RESULTADOS)
                            .queryParam("q", consulta)
                            .queryParam("key", apiKey)
                            .build())
                    .retrieve()
                    .body(RespostaYoutube.class);

            if (resposta == null || resposta.items() == null) {
                return List.of();
            }
            return resposta.items().stream()
                    .filter(item -> item.id() != null && item.id().videoId() != null
                            && item.snippet() != null && item.snippet().title() != null)
                    .map(item -> new YoutubeVideo(item.id().videoId(),
                            HtmlUtils.htmlUnescape(item.snippet().title())))
                    .toList();
        } catch (RestClientException e) {
            throw new IntegracaoYoutubeException("Não foi possível pesquisar músicas no YouTube.", e);
        }
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    record RespostaYoutube(List<ItemYoutube> items) {
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    record ItemYoutube(IdYoutube id, SnippetYoutube snippet) {
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    record IdYoutube(String videoId) {
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    record SnippetYoutube(String title) {
    }
}
