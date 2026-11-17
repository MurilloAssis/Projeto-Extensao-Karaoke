package br.edu.ifsp.karaoke.security;

import br.edu.ifsp.karaoke.IntegracaoTest;
import br.edu.ifsp.karaoke.exception.RegraNegocioException;
import br.edu.ifsp.karaoke.service.SessaoService;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/** Consultas do telão: fila com o nome de quem canta e sessão aberta (QR Code). */
class TelaoIntegracaoTest extends IntegracaoTest {

    private static final String CHAVE_REPRODUTOR = "chave-de-teste";

    @Autowired
    private SessaoService sessaoService;

    private int admin;
    private int ana;
    private String idSessao;

    @BeforeEach
    void preparar() {
        admin = criarAdmin();
        ana = criarVisitante("Ana");
        criarPedido(ana, criarMusica("aaaaaaaaaa1", "Música 1", true), "reproduzindo", agora().minusMinutes(5));
        criarPedido(criarVisitante("Bruno"), criarMusica("aaaaaaaaaa2", "Música 2", true), "na_fila",
                agora().minusMinutes(4));
    }

    @AfterEach
    void encerrarSessao() {
        if (idSessao != null) {
            try {
                sessaoService.encerrar(idSessao);
            } catch (RegraNegocioException ignorada) {
                // já encerrada
            }
        }
    }

    @Test
    void telaoRecebeOsNomesSemOIdDoUsuario() throws Exception {
        mvc.perform(get("/api/fila/telao").header(ChaveReprodutorFilter.CABECALHO, CHAVE_REPRODUTOR))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.atual.solicitante.nome").value("Ana"))
                .andExpect(jsonPath("$.atual.solicitante.idUsuario").doesNotExist())
                .andExpect(jsonPath("$.proximos[0].solicitante.nome").value("Bruno"))
                .andExpect(jsonPath("$.proximos[0].posicao").value(1));
    }

    @Test
    void filaDoTelaoExigeAChaveDoReprodutor() throws Exception {
        mvc.perform(get("/api/fila/telao")).andExpect(status().isUnauthorized());
        mvc.perform(get("/api/fila/telao").header(ChaveReprodutorFilter.CABECALHO, "errada"))
                .andExpect(status().isUnauthorized());
        mvc.perform(get("/api/fila/telao").header(IdentificacaoProvisoriaFilter.CABECALHO, admin))
                .andExpect(status().isForbidden());
        mvc.perform(get("/api/fila/telao").header(IdentificacaoProvisoriaFilter.CABECALHO, ana))
                .andExpect(status().isForbidden());
    }

    @Test
    void filaPublicaContinuaSemNomes() throws Exception {
        mvc.perform(get("/api/fila"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.atual.solicitante").doesNotExist())
                .andExpect(jsonPath("$.proximos[0].solicitante").doesNotExist());
    }

    @Test
    void semSessaoAbertaRespondeSemConteudo() throws Exception {
        mvc.perform(get("/api/sessoes/atual").header(ChaveReprodutorFilter.CABECALHO, CHAVE_REPRODUTOR))
                .andExpect(status().isNoContent());
    }

    @Test
    void telaoEAdminConsultamASessaoAberta() throws Exception {
        var aberta = sessaoService.abrir(admin);
        idSessao = aberta.idSessao();

        mvc.perform(get("/api/sessoes/atual").header(ChaveReprodutorFilter.CABECALHO, CHAVE_REPRODUTOR))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.codigo").value(aberta.codigo()))
                .andExpect(jsonPath("$.status").value("aberta"));
        mvc.perform(get("/api/sessoes/atual").header(IdentificacaoProvisoriaFilter.CABECALHO, admin))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.idSessao").value(idSessao));
    }

    @Test
    void visitanteEAnonimoNaoVeemOCodigoDaSessao() throws Exception {
        idSessao = sessaoService.abrir(admin).idSessao();

        mvc.perform(get("/api/sessoes/atual")).andExpect(status().isUnauthorized());
        mvc.perform(get("/api/sessoes/atual").header(IdentificacaoProvisoriaFilter.CABECALHO, ana))
                .andExpect(status().isForbidden());
    }

    @Test
    void sessaoEncerradaDeixaDeAparecer() throws Exception {
        String id = sessaoService.abrir(admin).idSessao();
        sessaoService.encerrar(id);

        mvc.perform(get("/api/sessoes/atual").header(IdentificacaoProvisoriaFilter.CABECALHO, admin))
                .andExpect(status().isNoContent());
    }
}
