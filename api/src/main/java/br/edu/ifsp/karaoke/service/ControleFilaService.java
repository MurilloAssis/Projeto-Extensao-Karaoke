package br.edu.ifsp.karaoke.service;

import br.edu.ifsp.karaoke.event.FilaAlteradaEvent;
import br.edu.ifsp.karaoke.event.MotivoAlteracao;
import br.edu.ifsp.karaoke.exception.CodigoErro;
import br.edu.ifsp.karaoke.exception.RegraNegocioException;
import br.edu.ifsp.karaoke.model.FilaModel;
import br.edu.ifsp.karaoke.model.StatusPedido;
import br.edu.ifsp.karaoke.repository.FilaRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.TransactionDefinition;
import org.springframework.transaction.support.TransactionTemplate;

import java.util.List;
import java.util.concurrent.locks.ReentrantLock;
import java.util.function.Consumer;

/**
 * Controle do palco (RN03) e transições do pedido (RN04).
 * Os comandos são executados um de cada vez: dois cliques simultâneos nunca
 * deixam dois pedidos em reprodução (o MVP roda em uma única instância da API).
 */
@Service
public class ControleFilaService {

    private static final Logger log = LoggerFactory.getLogger(ControleFilaService.class);

    private final FilaRepository filaRepository;
    private final ApplicationEventPublisher eventos;
    private final TransactionTemplate transacao;
    private final ReentrantLock comandos = new ReentrantLock(true);

    public ControleFilaService(FilaRepository filaRepository,
                               ApplicationEventPublisher eventos,
                               PlatformTransactionManager transactionManager) {
        this.filaRepository = filaRepository;
        this.eventos = eventos;
        this.transacao = new TransactionTemplate(transactionManager);
        this.transacao.setIsolationLevel(TransactionDefinition.ISOLATION_READ_COMMITTED);
    }

    /** RF07: inicia o primeiro pedido da fila, se nada estiver tocando. */
    public void play(String autor) {
        executar(() -> {
            if (filaRepository.findFirstByStatusOrderByDtPedidoAscIdFilaAsc(StatusPedido.REPRODUZINDO).isPresent()) {
                throw new RegraNegocioException(CodigoErro.RN04_JA_REPRODUZINDO,
                        "Já existe uma música em reprodução. Use Próxima música.");
            }
            FilaModel primeiro = filaRepository.findFirstByStatusOrderByDtPedidoAscIdFilaAsc(StatusPedido.NA_FILA)
                    .orElseThrow(() -> new RegraNegocioException(CodigoErro.RN04_FILA_VAZIA, "Não há pedidos na fila."));
            transicionar(primeiro, FilaModel::iniciarReproducao, autor);
            publicar(MotivoAlteracao.REPRODUCAO_INICIADA, primeiro.getIdFila());
        });
    }

    /** RF08: conclui o atual e promove o próximo (FIFO). */
    public void proxima(String autor) {
        executar(() -> {
            FilaModel atual = filaRepository.findFirstByStatusOrderByDtPedidoAscIdFilaAsc(StatusPedido.REPRODUZINDO)
                    .orElseThrow(() -> new RegraNegocioException(CodigoErro.RN04_NADA_REPRODUZINDO,
                            "Nenhuma música em reprodução. Use Play."));
            concluirEPromover(atual, autor);
            publicar(MotivoAlteracao.PROXIMA, atual.getIdFila());
        });
    }

    /** Aviso de término do vídeo enviado pelo reprodutor (IEventoReproducao). */
    public void concluir(Integer idFila, String autor) {
        executar(() -> {
            FilaModel atual = filaRepository.findFirstByStatusOrderByDtPedidoAscIdFilaAsc(StatusPedido.REPRODUZINDO)
                    .filter(pedido -> pedido.getIdFila().equals(idFila))
                    .orElseThrow(() -> new RegraNegocioException(CodigoErro.RN04_PEDIDO_NAO_ATIVO,
                            "O pedido %d não é o que está em reprodução.".formatted(idFila)));
            concluirEPromover(atual, autor);
            publicar(MotivoAlteracao.PEDIDO_CONCLUIDO, atual.getIdFila());
        });
    }

    /** RF09: remove um pedido que ainda aguarda na fila. */
    public void remover(Integer idFila, String autor) {
        executar(() -> {
            FilaModel pedido = filaRepository.findById(idFila)
                    .orElseThrow(() -> new RegraNegocioException(CodigoErro.PEDIDO_NAO_ENCONTRADO,
                            "Pedido %d não encontrado.".formatted(idFila)));
            if (pedido.getStatus() != StatusPedido.NA_FILA) {
                throw new RegraNegocioException(CodigoErro.RN04_PEDIDO_NAO_REMOVIVEL,
                        "Só é possível remover pedidos que aguardam na fila.");
            }
            transicionar(pedido, FilaModel::cancelar, autor);
            publicar(MotivoAlteracao.PEDIDO_REMOVIDO, idFila);
        });
    }

    /** RF09: limpa a fila ao final do evento. */
    public void limpar(String autor) {
        executar(() -> {
            List<FilaModel> aguardando = filaRepository.findByStatusOrderByDtPedidoAscIdFilaAsc(StatusPedido.NA_FILA);
            aguardando.forEach(pedido -> transicionar(pedido, FilaModel::cancelar, autor));
            // O diagrama de estados não prevê reproduzindo -> cancelado.
            filaRepository.findFirstByStatusOrderByDtPedidoAscIdFilaAsc(StatusPedido.REPRODUZINDO)
                    .ifPresent(atual -> transicionar(atual, FilaModel::concluir, autor));
            publicar(MotivoAlteracao.FILA_LIMPA, null);
        });
    }

    private void concluirEPromover(FilaModel atual, String autor) {
        transicionar(atual, FilaModel::concluir, autor);
        filaRepository.findFirstByStatusOrderByDtPedidoAscIdFilaAsc(StatusPedido.NA_FILA)
                .ifPresent(proximo -> transicionar(proximo, FilaModel::iniciarReproducao, autor));
    }

    private void transicionar(FilaModel pedido, Consumer<FilaModel> transicao, String autor) {
        StatusPedido anterior = pedido.getStatus();
        transicao.accept(pedido);
        filaRepository.saveAndFlush(pedido);
        log.info("Pedido {}: {} -> {} (autor: {})",
                pedido.getIdFila(), anterior.getValor(), pedido.getStatus().getValor(), autor);
    }

    private void publicar(MotivoAlteracao motivo, Integer idFila) {
        eventos.publishEvent(new FilaAlteradaEvent(motivo, idFila));
    }

    private void executar(Runnable comando) {
        comandos.lock();
        try {
            transacao.executeWithoutResult(s -> comando.run());
        } finally {
            comandos.unlock();
        }
    }
}
