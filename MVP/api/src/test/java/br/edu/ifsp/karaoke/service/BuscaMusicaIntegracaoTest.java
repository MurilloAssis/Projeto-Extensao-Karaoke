package br.edu.ifsp.karaoke.service;

import br.edu.ifsp.karaoke.IntegracaoTest;
import br.edu.ifsp.karaoke.integration.youtube.YoutubeDataApiClient;
import br.edu.ifsp.karaoke.integration.youtube.YoutubeVideo;
import br.edu.ifsp.karaoke.security.ChaveReprodutorFilter;
import br.edu.ifsp.karaoke.security.IdentificacaoProvisoriaFilter;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.test.context.bean.override.mockito.MockitoBean;

import java.util.List;

import static org.hamcrest.Matchers.contains;
import static org.hamcrest.Matchers.hasSize;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class BuscaMusicaIntegracaoTest extends IntegracaoTest {

    @MockitoBean
    private YoutubeDataApiClient youtube;

    private int visitante;

    @BeforeEach
    void criarCliente() {
        visitante = criarVisitante("Ana");
    }

    @Test
    void devolveCacheSemConsultarYoutube() throws Exception {
        criarMusica("aaaaaaaaaa1", "Evidências (Karaokê)", true);

        buscar("evidencias")
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[*].titulo").value(contains("Evidências (Karaokê)")));

        verify(youtube, never()).buscar(org.mockito.ArgumentMatchers.anyString());
    }

    @Test
    void musicaIndisponivelTambemEvitaConsultaExternaMasNaoAparece() throws Exception {
        criarMusica("aaaaaaaaaa1", "Música bloqueada", false);

        buscar("bloqueada")
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(0)));

        verify(youtube, never()).buscar(org.mockito.ArgumentMatchers.anyString());
    }

    @Test
    void acrescentaKaraokeSalvaTodosOsVideosEReutilizaCache() throws Exception {
        when(youtube.buscar("bohemian rhapsody karaoke")).thenReturn(List.of(
                new YoutubeVideo("aaaaaaaaaa1", "Bohemian Rhapsody Karaoke"),
                new YoutubeVideo("aaaaaaaaaa2", "Bohemian Rhapsody Instrumental Karaoke")));

        buscar("  bohemian   rhapsody ")
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[*].youtubeId").value(contains("aaaaaaaaaa1", "aaaaaaaaaa2")));

        org.assertj.core.api.Assertions.assertThat(
                jdbc.queryForObject("select count(*) from musica", Integer.class)).isEqualTo(2);
        verify(youtube).buscar("bohemian rhapsody karaoke");

        buscar("bohemian rhapsody").andExpect(status().isOk());
        verify(youtube).buscar("bohemian rhapsody karaoke");
    }

    @Test
    void rejeitaTermoVazioEExigePerfilPermitido() throws Exception {
        buscar("   ")
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.codigo").value("VALIDACAO"));
        mvc.perform(get("/api/musicas/busca").param("q", "queen"))
                .andExpect(status().isUnauthorized());
        mvc.perform(get("/api/musicas/busca").param("q", "queen")
                        .header(ChaveReprodutorFilter.CABECALHO, "chave-de-teste"))
                .andExpect(status().isForbidden());
    }

    private org.springframework.test.web.servlet.ResultActions buscar(String termo) throws Exception {
        return mvc.perform(get("/api/musicas/busca")
                .param("q", termo)
                .header(IdentificacaoProvisoriaFilter.CABECALHO, visitante));
    }
}
