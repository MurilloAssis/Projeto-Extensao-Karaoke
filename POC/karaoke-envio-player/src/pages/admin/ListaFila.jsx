import { Trash2, ListMusic } from 'lucide-react';
import { Miniatura } from './Miniatura';
import { cores, estilos } from './estilosAdmin';

function horaLocal(dtPedido) {
  const data = new Date(dtPedido);
  if (Number.isNaN(data.getTime())) return '';
  return data.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

export function ListaFila({ proximos, total, podeLimpar, acao, onRemover, onLimpar }) {
  const ocupado = acao !== null;
  const limparInativo = !podeLimpar || ocupado;

  return (
    <section aria-label="Fila">
      <div style={estilos.feedHeader}>
        <h2 style={estilos.feedTitle}>
          <ListMusic size={15} color={cores.vermelho} style={{ verticalAlign: '-2px', marginRight: '6px' }} />
          Fila ({total})
        </h2>
        <button
          type="button"
          onClick={onLimpar}
          disabled={limparInativo}
          style={{ ...estilos.buttonOutline, ...(limparInativo ? estilos.buttonOutlineInativo : {}) }}
        >
          <Trash2 size={13} />
          <span>Limpar fila</span>
        </button>
      </div>

      {proximos.length === 0 ? (
        <p style={estilos.emptyState}>Nenhum pedido aguardando.</p>
      ) : (
        <ol style={estilos.trackList}>
          {proximos.map((item) => (
            <li key={item.idFila} style={estilos.queueItem}>
              <span style={estilos.queueBadgePos}>{item.posicao}º</span>
              <Miniatura youtubeId={item.musica.youtubeId} titulo={item.musica.titulo} />
              <div style={estilos.trackMeta}>
                <h3 style={estilos.trackTitle}>{item.musica.titulo}</h3>
                <p style={estilos.trackSub}>
                  {item.musica.artista && `${item.musica.artista} · `}
                  <span style={estilos.solicitante}>{item.solicitante?.nome ?? '—'}</span>
                  {` · ${horaLocal(item.dtPedido)}`}
                </p>
              </div>
              <button
                type="button"
                onClick={() => onRemover(item)}
                disabled={ocupado}
                style={{ ...estilos.btnTrash, ...(ocupado ? { cursor: 'not-allowed', opacity: 0.4 } : {}) }}
                aria-label={`Remover ${item.musica.titulo}`}
                title="Remover"
              >
                <Trash2 size={16} color={cores.vermelho} />
              </button>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
