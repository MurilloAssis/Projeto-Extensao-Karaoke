import { Play, SkipForward, Disc3, Mic2, BellRing } from 'lucide-react';
import { Miniatura } from './Miniatura';
import { cores, estilos } from './estilosAdmin';

export function TocandoAgora({ atual, proximo, fimDoVideo, podePlay, podeProxima, acao, onPlay, onProxima }) {
  const ocupado = acao !== null;
  const chamadaProximo = proximo
    ? `${proximo.solicitante?.nome ?? 'próximo da fila'} — ${proximo.musica.titulo}`
    : null;

  return (
    <section style={estilos.cardAtual} aria-label="Tocando agora">
      <div style={estilos.rotuloAtual}>
        <Disc3 size={12} color={cores.azulTexto} />
        <span>TOCANDO AGORA</span>
      </div>

      {atual ? (
        <div style={estilos.trackRow}>
          <Miniatura youtubeId={atual.musica.youtubeId} titulo={atual.musica.titulo} />
          <div style={estilos.trackMeta}>
            <h3 style={estilos.trackTitle}>{atual.musica.titulo}</h3>
            {atual.musica.artista && <p style={estilos.trackSub}>{atual.musica.artista}</p>}
            <p style={{ ...estilos.trackSub, marginTop: '3px' }}>
              <Mic2 size={11} color={cores.azulTexto} style={{ verticalAlign: '-1px' }} />{' '}
              Chamar ao palco: <span style={estilos.solicitante}>{atual.solicitante?.nome ?? '—'}</span>
            </p>
          </div>
        </div>
      ) : (
        <>
          {fimDoVideo && (
            <div style={estilos.avisoFim} role="status">
              <BellRing size={14} color={cores.vermelho} style={{ flexShrink: 0 }} />
              <span>
                O vídeo terminou.{' '}
                {chamadaProximo ? 'Aperte Play quando o próximo cantor estiver pronto.' : 'A fila está vazia.'}
              </span>
            </div>
          )}
          <p style={{ ...estilos.emptyState, padding: '6px 0', textAlign: 'left' }}>
            Palco livre.{' '}
            {chamadaProximo ? (
              <>
                Próximo: <span style={estilos.solicitante}>{chamadaProximo}</span>
              </>
            ) : (
              'Aguardando pedidos.'
            )}
          </p>
        </>
      )}

      <div style={estilos.botoesAtual}>
        <button
          type="button"
          onClick={onPlay}
          disabled={!podePlay || ocupado}
          style={{ ...estilos.botaoPlay, ...(!podePlay || ocupado ? estilos.botaoInativo : {}) }}
        >
          <Play size={15} />
          <span>{acao === 'play' ? 'Iniciando…' : 'Play'}</span>
        </button>
        <button
          type="button"
          onClick={onProxima}
          disabled={!podeProxima || ocupado}
          style={{ ...estilos.botaoProxima, ...(!podeProxima || ocupado ? estilos.botaoInativo : {}) }}
        >
          <SkipForward size={15} />
          <span>{acao === 'proxima' ? 'Avançando…' : 'Próxima música'}</span>
        </button>
      </div>
    </section>
  );
}
