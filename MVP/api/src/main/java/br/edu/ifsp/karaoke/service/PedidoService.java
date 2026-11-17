package br.edu.ifsp.karaoke.service;

import br.edu.ifsp.karaoke.dto.request.PedidoRequest;
import br.edu.ifsp.karaoke.dto.response.ItemFilaResponse;
import br.edu.ifsp.karaoke.event.FilaAlteradaEvent;
import br.edu.ifsp.karaoke.event.MotivoAlteracao;
import br.edu.ifsp.karaoke.exception.CodigoErro;
import br.edu.ifsp.karaoke.exception.RegraNegocioException;
import br.edu.ifsp.karaoke.model.FilaModel;
import br.edu.ifsp.karaoke.model.MusicaModel;
import br.edu.ifsp.karaoke.model.StatusPedido;
import br.edu.ifsp.karaoke.model.UsuarioModel;
import br.edu.ifsp.karaoke.repository.FilaRepository;
import br.edu.ifsp.karaoke.repository.MusicaRepository;
import br.edu.ifsp.karaoke.repository.UsuarioRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.TransactionDefinition;
import org.springframework.transaction.support.TransactionTemplate;

import java.time.Clock;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;

/** Pedido de música: RN00, RN01 e RN02 validados na mesma transação (RNF06). */
@Service
public class PedidoService {

    private static final Logger log = LoggerFactory.getLogger(PedidoService.class);

    private final CatalogoService catalogoService;
    private final UsuarioRepository usuarioRepository;
    private final MusicaRepository musicaRepository;
    private final FilaRepository filaRepository;
    private final ConsultaFilaService consultaFilaService;
    private final ApplicationEventPublisher eventos;
    private final Clock relogio;
    private final int limitePedidos;
    private final TransactionTemplate transacao;

    public PedidoService(CatalogoService catalogoService,
                         UsuarioRepository usuarioRepository,
                         MusicaRepository musicaRepository,
                         FilaRepository filaRepository,
                         ConsultaFilaService consultaFilaService,
                         ApplicationEventPublisher eventos,
                         Clock relogio,
                         @Value("${karaoke.fila.limite-pedidos}") int limitePedidos,
                         PlatformTransactionManager transactionManager) {
        this.catalogoService = catalogoService;
        this.usuarioRepository = usuarioRepository;
        this.musicaRepository = musicaRepository;
        this.filaRepository = filaRepository;
        this.consultaFilaService = consultaFilaService;
        this.eventos = eventos;
        this.relogio = relogio;
        this.limitePedidos = limitePedidos;
        this.transacao = new TransactionTemplate(transactionManager);
        // READ_COMMITTED: depois de esperar o bloqueio, as verificações enxergam o que foi confirmado.
        this.transacao.setIsolationLevel(TransactionDefinition.ISOLATION_READ_COMMITTED);
    }

    public ItemFilaResponse solicitar(Integer idUsuario, PedidoRequest pedido) {
        Integer idMusica = catalogoService.obterOuCadastrar(pedido.videoId(), pedido.titulo().strip());
        return transacao.execute(s -> inserir(idUsuario, idMusica));
    }

    private ItemFilaResponse inserir(Integer idUsuario, Integer idMusica) {
        // Ordem fixa dos bloqueios (usuário, depois música) para evitar deadlock.
        UsuarioModel usuario = usuarioRepository.travarPorId(idUsuario)
                .orElseThrow(() -> new RegraNegocioException(CodigoErro.NAO_IDENTIFICADO, "Usuário não encontrado."));
        MusicaModel musica = musicaRepository.travarPorId(idMusica).orElseThrow();

        if (!musica.validarDisponibilidade()) {
            throw new RegraNegocioException(CodigoErro.RN00_MUSICA_INDISPONIVEL,
                    "\"%s\" não está disponível para pedidos.".formatted(musica.getTitulo()));
        }
        if (filaRepository.existsByMusicaAndStatusIn(musica, StatusPedido.ATIVOS)) {
            throw new RegraNegocioException(CodigoErro.RN01_MUSICA_JA_NA_FILA,
                    "\"%s\" já está na fila ou em reprodução.".formatted(musica.getTitulo()));
        }
        if (filaRepository.countByUsuarioAndStatusIn(usuario, StatusPedido.ATIVOS) >= limitePedidos) {
            throw new RegraNegocioException(CodigoErro.RN02_LIMITE_PEDIDOS,
                    "Você já tem %d música(s) ativa(s) na fila. Aguarde uma delas terminar.".formatted(limitePedidos));
        }

        LocalDateTime agora = LocalDateTime.now(relogio).truncatedTo(ChronoUnit.SECONDS);
        FilaModel novo = filaRepository.save(new FilaModel(usuario, musica, agora));
        log.info("Pedido {} criado: musica={}, usuario={}", novo.getIdFila(), idMusica, idUsuario);
        eventos.publishEvent(new FilaAlteradaEvent(MotivoAlteracao.PEDIDO_ADICIONADO, novo.getIdFila()));
        return consultaFilaService.itemPublico(novo);
    }
}
