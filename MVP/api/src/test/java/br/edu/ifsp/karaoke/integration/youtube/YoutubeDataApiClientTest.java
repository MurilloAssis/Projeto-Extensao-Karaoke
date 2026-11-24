package br.edu.ifsp.karaoke.integration.youtube;

import br.edu.ifsp.karaoke.exception.IntegracaoYoutubeException;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.test.web.client.MockRestServiceServer;
import org.springframework.web.client.RestClient;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withSuccess;

class YoutubeDataApiClientTest {

    @Test
    void enviaParametrosOficiaisELêOsVideos() {
        RestClient.Builder builder = RestClient.builder();
        MockRestServiceServer servidor = MockRestServiceServer.bindTo(builder).build();
        YoutubeDataApiClient cliente = new YoutubeDataApiClient(
                builder.baseUrl(YoutubeDataApiClient.ENDPOINT).build(), "chave-teste");

        servidor.expect(request -> {
                    assertThat(request.getURI().getPath()).isEqualTo("/youtube/v3/search");
                    assertThat(request.getURI().getRawQuery())
                            .contains("part=snippet", "type=video", "maxResults=20",
                                    "q=Evid%C3%AAncias%20karaoke", "key=chave-teste");
                })
                .andRespond(withSuccess("""
                        {
                          "items": [
                            {"id": {"videoId": "aaaaaaaaaa1"},
                             "snippet": {"title": "Evidências &amp; Amigos"}}
                          ]
                        }
                        """, MediaType.APPLICATION_JSON));

        assertThat(cliente.buscar("Evidências karaoke"))
                .containsExactly(new YoutubeVideo("aaaaaaaaaa1", "Evidências & Amigos"));
        servidor.verify();
    }

    @Test
    void informaQuandoAChaveNaoFoiConfigurada() {
        YoutubeDataApiClient cliente = new YoutubeDataApiClient(RestClient.create(), "");

        assertThatThrownBy(() -> cliente.buscar("queen karaoke"))
                .isInstanceOf(IntegracaoYoutubeException.class)
                .hasMessageContaining("YOUTUBE_API_KEY");
    }
}
