package br.edu.ifsp.karaoke.service;

import br.edu.ifsp.karaoke.dto.response.SessaoResponse;
import br.edu.ifsp.karaoke.exception.CodigoErro;
import br.edu.ifsp.karaoke.event.SessaoAlteradaEvent;
import br.edu.ifsp.karaoke.exception.RegraNegocioException;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;

import java.security.SecureRandom;
import java.time.Clock;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.time.temporal.ChronoUnit;
import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.locks.ReentrantLock;

/** Sessão operacional mantida apenas enquanto esta instância da API estiver em execução. */
@Service
public class SessaoService {

    private final Clock relogio;
    private final ApplicationEventPublisher eventos;
    private final SecureRandom aleatorio = new SecureRandom();
    private final ReentrantLock comandos = new ReentrantLock(true);
    private volatile SessaoEmMemoria aberta;
    private volatile SessaoEncerrada ultimaEncerrada;

    public SessaoService(Clock relogio, ApplicationEventPublisher eventos) {
        this.relogio = relogio;
        this.eventos = eventos;
    }

    public SessaoResponse abrir(Integer idAdmin) {
        comandos.lock();
        try {
            if (aberta != null) {
                throw new RegraNegocioException(CodigoErro.SESSAO_JA_ABERTA,
                        "Encerre a sessão atual antes de abrir outra.");
            }
            aberta = new SessaoEmMemoria(UUID.randomUUID().toString(), novoCodigo(), idAdmin, agora());
            eventos.publishEvent(new SessaoAlteradaEvent("aberta"));
            return respostaAberta(aberta);
        } finally {
            comandos.unlock();
        }
    }

    public SessaoResponse encerrar(String idSessao) {
        comandos.lock();
        try {
            if (ultimaEncerrada != null && ultimaEncerrada.sessao().id().equals(idSessao)) {
                throw new RegraNegocioException(CodigoErro.SESSAO_JA_ENCERRADA,
                        "A sessão já está encerrada.");
            }
            if (aberta == null || !aberta.id().equals(idSessao)) {
                throw new RegraNegocioException(CodigoErro.SESSAO_NAO_ENCONTRADA,
                        "Sessão não encontrada.");
            }
            ultimaEncerrada = new SessaoEncerrada(aberta, agora());
            SessaoResponse resposta = respostaEncerrada(ultimaEncerrada);
            aberta = null;
            eventos.publishEvent(new SessaoAlteradaEvent("encerrada"));
            return resposta;
        } finally {
            comandos.unlock();
        }
    }

    /** Sessão aberta agora, para o painel do admin e o QR Code do telão. */
    public Optional<SessaoResponse> atual() {
        return Optional.ofNullable(aberta).map(SessaoService::respostaAberta);
    }

    public Optional<SessaoAtiva> buscarAbertaPorCodigo(String codigo) {
        SessaoEmMemoria atual = aberta;
        return atual != null && atual.codigo().equals(codigo)
                ? Optional.of(new SessaoAtiva(atual.id()))
                : Optional.empty();
    }

    public boolean estaAberta(String idSessao) {
        SessaoEmMemoria atual = aberta;
        return atual != null && atual.id().equals(idSessao);
    }

    private String novoCodigo() {
        return "%06d".formatted(aleatorio.nextInt(1_000_000));
    }

    private LocalDateTime agora() {
        return LocalDateTime.ofInstant(relogio.instant(), ZoneOffset.UTC).truncatedTo(ChronoUnit.SECONDS);
    }

    private static SessaoResponse respostaAberta(SessaoEmMemoria sessao) {
        return new SessaoResponse(sessao.id(), sessao.codigo(), "aberta", sessao.abertaEm(), null);
    }

    private static SessaoResponse respostaEncerrada(SessaoEncerrada encerrada) {
        SessaoEmMemoria sessao = encerrada.sessao();
        return new SessaoResponse(sessao.id(), sessao.codigo(), "encerrada",
                sessao.abertaEm(), encerrada.encerradaEm());
    }

    private record SessaoEmMemoria(String id, String codigo, Integer idAdmin, LocalDateTime abertaEm) {
    }

    private record SessaoEncerrada(SessaoEmMemoria sessao, LocalDateTime encerradaEm) {
    }

    public record SessaoAtiva(String id) {
    }
}
