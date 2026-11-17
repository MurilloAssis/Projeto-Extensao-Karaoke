package br.edu.ifsp.karaoke.service;

import br.edu.ifsp.karaoke.IntegracaoTest;
import br.edu.ifsp.karaoke.security.ChaveReprodutorFilter;
import br.edu.ifsp.karaoke.security.IdentificacaoProvisoriaFilter;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import org.springframework.test.web.servlet.ResultActions;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;

import java.util.HashMap;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.contains;
import static org.hamcrest.Matchers.hasSize;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/** GET /api/musicas: sugestões do catálogo cadastrado, filtradas e paginadas. */
class SugestaoMusicaIntegracaoTest extends IntegracaoTest {

    private int ana;

    @BeforeEach
    void criarCatalogo() {
        ana = criarVisitante("Ana");
        musica("aaaaaaaaaa1", "Evidências", "Chitãozinho & Xororó", true);
        musica("aaaaaaaaaa2", "Bohemian Rhapsody", "Queen", true);
        musica("aaaaaaaaaa3", "Tempo Perdido", "Legião Urbana", true);
        musica("aaaaaaaaaa4", "Pais e Filhos", "Legião Urbana", true);
        musica("aaaaaaaaaa5", "Vídeo removido", "Legião Urbana", false);
        musica("aaaaaaaaaa6", "100% Você", null, true);
    }

    @Test
    void semTermoTrazAsDisponiveisEmOrdemAlfabetica() throws Exception {
        sugestoes()
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.itens[*].titulo").value(contains(
                        "100% Você", "Bohemian Rhapsody", "Evidências", "Pais e Filhos", "Tempo Perdido")))
                .andExpect(jsonPath("$.itens[0].urlVideo").value("https://www.youtube.com/watch?v=aaaaaaaaaa6"))
                .andExpect(jsonPath("$.total").value(5))
                .andExpect(jsonPath("$.pagina").value(0))
                .andExpect(jsonPath("$.temMais").value(false));
    }

    @Test
    void buscaPorTituloOuArtistaSemDiferenciarMaiusculasNemAcentos() throws Exception {
        sugestoes("q", "EVIDENCIAS").andExpect(jsonPath("$.itens[*].titulo").value(contains("Evidências")));
        sugestoes("q", "legiao").andExpect(jsonPath("$.itens[*].titulo").value(contains("Pais e Filhos", "Tempo Perdido")));
        sugestoes("q", "  xororó  ").andExpect(jsonPath("$.itens[*].titulo").value(contains("Evidências")));
        sugestoes("q", "nada-a-ver").andExpect(jsonPath("$.itens", hasSize(0))).andExpect(jsonPath("$.total").value(0));
    }

    @Test
    void musicaIndisponivelNaoESugerida() throws Exception {
        sugestoes("q", "removido").andExpect(jsonPath("$.total").value(0));
    }

    @Test
    void curingasDigitadosSaoTratadosComoTexto() throws Exception {
        sugestoes("q", "%").andExpect(jsonPath("$.itens[*].titulo").value(contains("100% Você")));
        sugestoes("q", "_").andExpect(jsonPath("$.total").value(0));
    }

    @Test
    void paginaComTamanhoEPaginaSeguinte() throws Exception {
        sugestoes("tamanho", "2")
                .andExpect(jsonPath("$.itens[*].titulo").value(contains("100% Você", "Bohemian Rhapsody")))
                .andExpect(jsonPath("$.tamanho").value(2))
                .andExpect(jsonPath("$.total").value(5))
                .andExpect(jsonPath("$.temMais").value(true));
        sugestoes("tamanho", "2", "pagina", "2")
                .andExpect(jsonPath("$.itens[*].titulo").value(contains("Tempo Perdido")))
                .andExpect(jsonPath("$.temMais").value(false));
    }

    @Test
    void valoresForaDaFaixaSaoAjustados() throws Exception {
        sugestoes("tamanho", "500", "pagina", "-3")
                .andExpect(jsonPath("$.tamanho").value(SugestaoMusicaService.TAMANHO_MAXIMO))
                .andExpect(jsonPath("$.pagina").value(0));
        sugestoes("tamanho", "0").andExpect(jsonPath("$.tamanho").value(1));
        sugestoes("pagina", "abc").andExpect(status().isBadRequest());
    }

    @Test
    void exigeClienteOuAdminIdentificado() throws Exception {
        mvc.perform(get("/api/musicas")).andExpect(status().isUnauthorized());
        mvc.perform(get("/api/musicas").header(ChaveReprodutorFilter.CABECALHO, "chave-de-teste"))
                .andExpect(status().isForbidden());
        mvc.perform(get("/api/musicas").header(IdentificacaoProvisoriaFilter.CABECALHO, criarAdmin()))
                .andExpect(status().isOk());
    }

    @Test
    void padraoEscapaOsCuringas() {
        assertThat(SugestaoMusicaService.padrao(null)).isNull();
        assertThat(SugestaoMusicaService.padrao("   ")).isNull();
        assertThat(SugestaoMusicaService.padrao(" a  b ")).isEqualTo("%a b%");
        assertThat(SugestaoMusicaService.padrao("50%_!")).isEqualTo("%50!%!_!!%");
    }

    private ResultActions sugestoes(String... pares) throws Exception {
        MockHttpServletRequestBuilder requisicao = get("/api/musicas").header(IdentificacaoProvisoriaFilter.CABECALHO, ana);
        for (int i = 0; i < pares.length; i += 2) {
            requisicao.param(pares[i], pares[i + 1]);
        }
        return mvc.perform(requisicao);
    }

    private void musica(String youtubeId, String titulo, String artista, boolean disponivel) {
        var valores = new HashMap<String, Object>(Map.of(
                "youtube_id", youtubeId, "titulo", titulo, "disponivel", disponivel));
        if (artista != null) {
            valores.put("artista", artista);
        }
        inserir("musica", "id_musica", valores);
    }
}
