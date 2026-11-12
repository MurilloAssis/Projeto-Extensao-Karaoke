package br.edu.ifsp.karaoke.service;

import br.edu.ifsp.karaoke.IntegracaoTest;
import br.edu.ifsp.karaoke.exception.RegraNegocioException;
import br.edu.ifsp.karaoke.security.ChaveReprodutorFilter;
import br.edu.ifsp.karaoke.security.IdentificacaoProvisoriaFilter;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutionException;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/** RF06–RF09 e IEventoReproducao: controle do palco (RN03) e ciclo de vida (RN04). */
class ControleFilaIntegracaoTest extends IntegracaoTest {

    private static final String CHAVE_REPRODUTOR = "chave-de-teste";

    @Autowired
    private ControleFilaService controleFilaService;

    private int admin;
    private int primeiro;
    private int segundo;

    @BeforeEach
    void criarFila() {
        admin = criarAdmin();
        LocalDateTime base = agora().minusMinutes(10);
        primeiro = criarPedido(criarVisitante("Ana"), criarMusica("aaaaaaaaaa1", "Música 1", true), "na_fila", base);
        segundo = criarPedido(criarVisitante("Bruno"), criarMusica("aaaaaaaaaa2", "Música 2", true), "na_fila",
                base.plusMinutes(1));
    }

    @Test
    void playIniciaOPrimeiroDaFila() throws Exception {
        mvc.perform(post("/api/fila/play").header(IdentificacaoProvisoriaFilter.CABECALHO, admin))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.atual.idFila").value(primeiro))
                .andExpect(jsonPath("$.atual.status").value("reproduzindo"))
                .andExpect(jsonPath("$.proximos[0].idFila").value(segundo))
                .andExpect(jsonPath("$.proximos[0].posicao").value(1))
                .andExpect(jsonPath("$.total").value(1));
    }

    @Test
    void playComMusicaTocandoERecusado() throws Exception {
        controleFilaService.play("teste");

        mvc.perform(post("/api/fila/play").header(IdentificacaoProvisoriaFilter.CABECALHO, admin))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.codigo").value("RN04_JA_REPRODUZINDO"));
    }

    @Test
    void playComFilaVaziaERecusado() throws Exception {
        jdbc.update("delete from fila");

        mvc.perform(post("/api/fila/play").header(IdentificacaoProvisoriaFilter.CABECALHO, admin))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.codigo").value("RN04_FILA_VAZIA"));
    }

    @Test
    void proximaConcluiOAtualEPromoveOSeguinte() throws Exception {
        controleFilaService.play("teste");

        mvc.perform(post("/api/fila/proxima").header(IdentificacaoProvisoriaFilter.CABECALHO, admin))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.atual.idFila").value(segundo))
                .andExpect(jsonPath("$.total").value(0));
        assertThat(statusDe(primeiro)).isEqualTo("concluido");
    }

    @Test
    void proximaNoUltimoPedidoDeixaOTelaoEmEspera() throws Exception {
        controleFilaService.play("teste");
        controleFilaService.proxima("teste");
        controleFilaService.proxima("teste");

        mvc.perform(get("/api/fila/atual")).andExpect(status().isNoContent());
        assertThat(statusDe(segundo)).isEqualTo("concluido");
    }

    @Test
    void proximaSemMusicaTocandoERecusada() throws Exception {
        mvc.perform(post("/api/fila/proxima").header(IdentificacaoProvisoriaFilter.CABECALHO, admin))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.codigo").value("RN04_NADA_REPRODUZINDO"));
    }

    @Test
    void removerCancelaPedidoNaFila() throws Exception {
        mvc.perform(delete("/api/fila/{id}", segundo).header(IdentificacaoProvisoriaFilter.CABECALHO, admin))
                .andExpect(status().isNoContent());
        assertThat(statusDe(segundo)).isEqualTo("cancelado");
    }

    @Test
    void removerPedidoEmReproducaoERecusado() throws Exception {
        controleFilaService.play("teste");

        mvc.perform(delete("/api/fila/{id}", primeiro).header(IdentificacaoProvisoriaFilter.CABECALHO, admin))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.codigo").value("RN04_PEDIDO_NAO_REMOVIVEL"));
    }

    @Test
    void removerPedidoInexistenteRetorna404() throws Exception {
        mvc.perform(delete("/api/fila/{id}", 999999).header(IdentificacaoProvisoriaFilter.CABECALHO, admin))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.codigo").value("PEDIDO_NAO_ENCONTRADO"));
    }

    @Test
    void limparCancelaAFilaEConcluiOAtual() throws Exception {
        controleFilaService.play("teste");

        mvc.perform(delete("/api/fila").header(IdentificacaoProvisoriaFilter.CABECALHO, admin))
                .andExpect(status().isNoContent());
        assertThat(statusDe(primeiro)).isEqualTo("concluido");
        assertThat(statusDe(segundo)).isEqualTo("cancelado");
    }

    @Test
    void empateDeHorarioEDesempatadoPeloIdFila() throws Exception {
        jdbc.update("delete from fila");
        LocalDateTime mesmoHorario = agora();
        int a = criarPedido(criarVisitante("C1"), criarMusica("bbbbbbbbbb1", "M1", true), "na_fila", mesmoHorario);
        int b = criarPedido(criarVisitante("C2"), criarMusica("bbbbbbbbbb2", "M2", true), "na_fila", mesmoHorario);

        mvc.perform(get("/api/fila"))
                .andExpect(jsonPath("$.proximos[0].idFila").value(a))
                .andExpect(jsonPath("$.proximos[1].idFila").value(b));
    }

    @Test
    void visaoPublicaNaoMostraNomesEVisaoAdminMostra() throws Exception {
        mvc.perform(get("/api/fila"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.proximos[0].solicitante").doesNotExist());

        mvc.perform(get("/api/fila/admin").header(IdentificacaoProvisoriaFilter.CABECALHO, admin))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.proximos[0].solicitante.nome").value("Ana"));
    }

    @Test
    void reprodutorConcluiOPedidoAtual() throws Exception {
        controleFilaService.play("teste");

        mvc.perform(post("/api/fila/{id}/concluir", primeiro).header(ChaveReprodutorFilter.CABECALHO, CHAVE_REPRODUTOR))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.atual.idFila").value(segundo));
        assertThat(statusDe(primeiro)).isEqualTo("concluido");
    }

    @Test
    void reprodutorNaoConcluiPedidoQueNaoEOAtual() throws Exception {
        controleFilaService.play("teste");

        mvc.perform(post("/api/fila/{id}/concluir", segundo).header(ChaveReprodutorFilter.CABECALHO, CHAVE_REPRODUTOR))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.codigo").value("RN04_PEDIDO_NAO_ATIVO"));
        assertThat(statusDe(segundo)).isEqualTo("na_fila");
    }

    @Test
    void playsSimultaneosIniciamApenasUmaMusica() throws Exception {
        ExecutorService executor = Executors.newFixedThreadPool(10);
        CountDownLatch largada = new CountDownLatch(1);
        try {
            List<Future<?>> resultados = new ArrayList<>();
            for (int i = 0; i < 10; i++) {
                resultados.add(executor.submit(() -> {
                    largada.await();
                    controleFilaService.play("teste");
                    return null;
                }));
            }
            largada.countDown();
            int aceitos = 0;
            for (Future<?> resultado : resultados) {
                try {
                    resultado.get();
                    aceitos++;
                } catch (ExecutionException e) {
                    assertThat(e.getCause()).isInstanceOf(RegraNegocioException.class);
                }
            }
            assertThat(aceitos).isEqualTo(1);
        } finally {
            executor.shutdownNow();
        }
        assertThat(jdbc.queryForObject("select count(*) from fila where status = 'reproduzindo'", Integer.class))
                .isEqualTo(1);
    }
}
