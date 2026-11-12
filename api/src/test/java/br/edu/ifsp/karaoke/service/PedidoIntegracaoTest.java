package br.edu.ifsp.karaoke.service;

import br.edu.ifsp.karaoke.IntegracaoTest;
import br.edu.ifsp.karaoke.dto.request.PedidoRequest;
import br.edu.ifsp.karaoke.event.FilaAlteradaEvent;
import br.edu.ifsp.karaoke.event.MotivoAlteracao;
import br.edu.ifsp.karaoke.exception.RegraNegocioException;
import br.edu.ifsp.karaoke.security.IdentificacaoProvisoriaFilter;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.test.context.event.ApplicationEvents;
import org.springframework.test.context.event.RecordApplicationEvents;

import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.Callable;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.endsWith;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/** RF04/RF05: pedido de música com RN00, RN01 e RN02. */
@RecordApplicationEvents
class PedidoIntegracaoTest extends IntegracaoTest {

    @Autowired
    private PedidoService pedidoService;

    @Autowired
    private ApplicationEvents eventos;

    @Test
    void pedidoValidoEntraNoFimDaFila() throws Exception {
        int ana = criarVisitante("Ana");
        int bruno = criarVisitante("Bruno");

        pedir(ana, "aaaaaaaaaa1", "Still Loving You")
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.status").value("na_fila"))
                .andExpect(jsonPath("$.posicao").value(1))
                .andExpect(jsonPath("$.dtPedido").value(endsWith("Z")))
                .andExpect(jsonPath("$.musica.youtubeId").value("aaaaaaaaaa1"))
                .andExpect(jsonPath("$.musica.urlVideo").value("https://www.youtube.com/watch?v=aaaaaaaaaa1"))
                .andExpect(jsonPath("$.solicitante").doesNotExist());

        pedir(bruno, "aaaaaaaaaa2", "Tempo Perdido")
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.posicao").value(2));
    }

    @Test
    void musicaNovaECadastradaNoCatalogo() throws Exception {
        pedir(criarVisitante("Ana"), "aaaaaaaaaa1", "  Still Loving You  ").andExpect(status().isCreated());

        assertThat(jdbc.queryForObject("select titulo from musica where youtube_id = 'aaaaaaaaaa1'", String.class))
                .isEqualTo("Still Loving You");
    }

    @Test
    void youtubeIdDiferenciaMaiusculas() throws Exception {
        pedir(criarVisitante("Ana"), "abcdefghijk", "Versão 1").andExpect(status().isCreated());
        pedir(criarVisitante("Bruno"), "ABCDEFGHIJK", "Versão 2").andExpect(status().isCreated());

        assertThat(jdbc.queryForObject("select count(*) from musica", Integer.class)).isEqualTo(2);
    }

    @Test
    void rn01RecusaMusicaQueJaEstaNaFila() throws Exception {
        pedir(criarVisitante("Ana"), "aaaaaaaaaa1", "Still Loving You").andExpect(status().isCreated());

        pedir(criarVisitante("Bruno"), "aaaaaaaaaa1", "Still Loving You")
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.codigo").value("RN01_MUSICA_JA_NA_FILA"));
    }

    @Test
    void rn01RecusaMusicaEmReproducao() throws Exception {
        int musica = criarMusica("aaaaaaaaaa1", "Still Loving You", true);
        criarPedido(criarVisitante("Ana"), musica, "reproduzindo", agora());

        pedir(criarVisitante("Bruno"), "aaaaaaaaaa1", "Still Loving You")
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.codigo").value("RN01_MUSICA_JA_NA_FILA"));
    }

    @Test
    void musicaConcluidaOuCanceladaPodeSerPedidaDeNovo() throws Exception {
        int musica = criarMusica("aaaaaaaaaa1", "Still Loving You", true);
        criarPedido(criarVisitante("Ana"), musica, "concluido", agora());
        criarPedido(criarVisitante("Carla"), musica, "cancelado", agora());

        pedir(criarVisitante("Bruno"), "aaaaaaaaaa1", "Still Loving You").andExpect(status().isCreated());
    }

    @Test
    void rn02LimiteContaPedidoEmReproducao() throws Exception {
        int ana = criarVisitante("Ana");
        criarPedido(ana, criarMusica("aaaaaaaaaa1", "Música 1", true), "reproduzindo", agora());
        pedir(ana, "aaaaaaaaaa2", "Música 2").andExpect(status().isCreated());

        pedir(ana, "aaaaaaaaaa3", "Música 3")
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.codigo").value("RN02_LIMITE_PEDIDOS"));
    }

    @Test
    void rn02PedidosEncerradosNaoContam() throws Exception {
        int ana = criarVisitante("Ana");
        criarPedido(ana, criarMusica("aaaaaaaaaa1", "Música 1", true), "concluido", agora());
        criarPedido(ana, criarMusica("aaaaaaaaaa2", "Música 2", true), "cancelado", agora());

        pedir(ana, "aaaaaaaaaa3", "Música 3").andExpect(status().isCreated());
        pedir(ana, "aaaaaaaaaa4", "Música 4").andExpect(status().isCreated());
    }

    @Test
    void rn00RecusaMusicaIndisponivel() throws Exception {
        criarMusica("aaaaaaaaaa1", "Indisponível", false);

        pedir(criarVisitante("Ana"), "aaaaaaaaaa1", "Indisponível")
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.codigo").value("RN00_MUSICA_INDISPONIVEL"));
    }

    @Test
    void videoIdInvalidoRetornaErroDeValidacao() throws Exception {
        pedir(criarVisitante("Ana"), "curto", "Música")
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.codigo").value("VALIDACAO"))
                .andExpect(jsonPath("$.campos.videoId").exists());
    }

    @Test
    void meusPedidosTrazPosicaoNaFila() throws Exception {
        int ana = criarVisitante("Ana");
        int bruno = criarVisitante("Bruno");
        pedir(bruno, "aaaaaaaaaa1", "Música 1");
        pedir(ana, "aaaaaaaaaa2", "Música 2");

        mvc.perform(get("/api/fila/meus-pedidos").header(IdentificacaoProvisoriaFilter.CABECALHO, ana))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].posicao").value(2))
                .andExpect(jsonPath("$[0].musica.titulo").value("Música 2"));
    }

    @Test
    void publicaEventoSomenteQuandoPedidoEAceito() throws Exception {
        int ana = criarVisitante("Ana");
        pedir(ana, "aaaaaaaaaa1", "Música 1").andExpect(status().isCreated());
        pedir(criarVisitante("Bruno"), "aaaaaaaaaa1", "Música 1").andExpect(status().isConflict());

        assertThat(eventos.stream(FilaAlteradaEvent.class))
                .extracting(FilaAlteradaEvent::motivo)
                .containsExactly(MotivoAlteracao.PEDIDO_ADICIONADO);
    }

    @Test
    void pedidosSimultaneosDaMesmaMusicaAceitamApenasUm() throws Exception {
        List<Integer> usuarios = new ArrayList<>();
        for (int i = 0; i < 10; i++) {
            usuarios.add(criarVisitante("Cantor " + i));
        }

        long aceitos = executarAoMesmoTempo(usuarios.stream()
                .map(id -> (Callable<Object>) () -> pedidoService.solicitar(id, new PedidoRequest("aaaaaaaaaa1", "Música")))
                .toList());

        assertThat(aceitos).isEqualTo(1);
        assertThat(jdbc.queryForObject("select count(*) from fila", Integer.class)).isEqualTo(1);
        assertThat(jdbc.queryForObject("select count(*) from musica", Integer.class)).isEqualTo(1);
    }

    @Test
    void pedidosSimultaneosDoMesmoClienteRespeitamOLimite() throws Exception {
        int ana = criarVisitante("Ana");
        List<Callable<Object>> pedidos = new ArrayList<>();
        for (int i = 0; i < 10; i++) {
            String videoId = "aaaaaaaaa%02d".formatted(i);
            pedidos.add(() -> pedidoService.solicitar(ana, new PedidoRequest(videoId, "Música")));
        }

        assertThat(executarAoMesmoTempo(pedidos)).isEqualTo(2);
        assertThat(jdbc.queryForObject("select count(*) from fila", Integer.class)).isEqualTo(2);
    }

    /** Dispara as tarefas juntas e retorna quantas terminaram sem RegraNegocioException. */
    private long executarAoMesmoTempo(List<Callable<Object>> tarefas) throws Exception {
        ExecutorService executor = Executors.newFixedThreadPool(tarefas.size());
        CountDownLatch largada = new CountDownLatch(1);
        try {
            List<Future<Object>> resultados = new ArrayList<>();
            for (Callable<Object> tarefa : tarefas) {
                resultados.add(executor.submit(() -> {
                    largada.await();
                    return tarefa.call();
                }));
            }
            largada.countDown();
            long aceitos = 0;
            for (Future<Object> resultado : resultados) {
                try {
                    resultado.get();
                    aceitos++;
                } catch (java.util.concurrent.ExecutionException e) {
                    assertThat(e.getCause()).isInstanceOf(RegraNegocioException.class);
                }
            }
            return aceitos;
        } finally {
            executor.shutdownNow();
        }
    }
}
