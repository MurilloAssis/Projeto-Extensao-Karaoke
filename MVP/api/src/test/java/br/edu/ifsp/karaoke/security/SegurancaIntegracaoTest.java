package br.edu.ifsp.karaoke.security;

import br.edu.ifsp.karaoke.IntegracaoTest;
import org.junit.jupiter.api.Test;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/** RN03: controle de palco exclusivo do admin (TST-07). */
class SegurancaIntegracaoTest extends IntegracaoTest {

    @Test
    void visitanteNaoControlaOPalco() throws Exception {
        int ana = criarVisitante("Ana");
        for (MockHttpServletRequestBuilder comando : new MockHttpServletRequestBuilder[]{
                post("/api/fila/play"), post("/api/fila/proxima"), delete("/api/fila/1"),
                delete("/api/fila"), get("/api/fila/admin")}) {
            mvc.perform(comando.header(IdentificacaoProvisoriaFilter.CABECALHO, ana))
                    .andExpect(status().isForbidden())
                    .andExpect(jsonPath("$.codigo").value("RN03_ACESSO_NEGADO"));
        }
    }

    @Test
    void clienteComContaNaoControlaOPalco() throws Exception {
        mvc.perform(post("/api/fila/proxima")
                        .header(IdentificacaoProvisoriaFilter.CABECALHO, criarUsuario("Bruno", "cliente")))
                .andExpect(status().isForbidden());
    }

    @Test
    void adminNaoFazPedidos() throws Exception {
        pedir(criarAdmin(), "aaaaaaaaaa1", "Música").andExpect(status().isForbidden());
    }

    @Test
    void pedidoSemIdentificacaoRetorna401() throws Exception {
        mvc.perform(post("/api/fila").contentType("application/json")
                        .content("{\"videoId\":\"aaaaaaaaaa1\",\"titulo\":\"Música\"}"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.codigo").value("NAO_IDENTIFICADO"));
    }

    @Test
    void usuarioInexistenteNaoEIdentificado() throws Exception {
        pedir(999999, "aaaaaaaaaa1", "Música").andExpect(status().isUnauthorized());
    }

    @Test
    void consultaDaFilaEPublica() throws Exception {
        mvc.perform(get("/api/fila")).andExpect(status().isOk());
        mvc.perform(get("/api/fila/atual")).andExpect(status().isNoContent());
    }

    @Test
    void concluirExigeChaveDoReprodutor() throws Exception {
        mvc.perform(post("/api/fila/1/concluir")).andExpect(status().isUnauthorized());
        mvc.perform(post("/api/fila/1/concluir").header(ChaveReprodutorFilter.CABECALHO, "errada"))
                .andExpect(status().isUnauthorized());
        mvc.perform(post("/api/fila/1/concluir").header(IdentificacaoProvisoriaFilter.CABECALHO, criarAdmin()))
                .andExpect(status().isForbidden());
    }
}
