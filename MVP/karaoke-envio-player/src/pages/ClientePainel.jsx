import { useState, useRef, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search, User, Plus, ChevronUp, ChevronDown,
  AlertCircle, CheckCircle2, Radio, ListMusic, Disc3, X, Mic2, ArrowRight
} from 'lucide-react';
import logoApache from '../assets/logo-apache-vetorizado.svg';
import { clienteApi, LIMITE_PEDIDOS } from '../api/clienteApi';
import { useSessaoCliente } from '../auth/sessaoCliente';
import { useFilaAoVivo } from '../hooks/useFilaAoVivo';

// Ao digitar, filtra o catálogo local. Ao confirmar, usa a busca cache-first com fallback para o YouTube.
const TAMANHO_PAGINA = 20;
const ATRASO_BUSCA_MS = 350;

const sugestaoDe = (musica) => ({ videoId: musica.youtubeId, titulo: musica.titulo, artista: musica.artista ?? '' });

const miniatura = (videoId) => `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`;

export function ClientePainel() {
  const navigate = useNavigate();
  const sessao = useSessaoCliente();
  const nomeUsuario = sessao?.nome ?? '';
  const codigoSessao = sessao?.codigoSessao ?? '';
  const [inputBusca, setInputBusca] = useState('');
  const [termoBuscado, setTermoBuscado] = useState('');
  const [aguardandoDebounce, setAguardandoDebounce] = useState(false);
  const [buscaFocada, setBuscaFocada] = useState(false);
  const [resultados, setResultados] = useState([]);
  const [paginaBusca, setPaginaBusca] = useState({ pagina: 0, total: 0, temMais: false });
  const [carregandoBusca, setCarregandoBusca] = useState(true);
  const [carregandoMais, setCarregandoMais] = useState(false);
  const [erroBusca, setErroBusca] = useState(null);
  const ultimaBusca = useRef(0);
  const [expandirFila, setExpandirFila] = useState(false);
  const [musicaModal, setMusicaModal] = useState(null);
  const [enviando, setEnviando] = useState(false);
  const [alerta, setAlerta] = useState(null);
  const timerRef = useRef(null);
  const timerAlerta = useRef(null);

  const { fila: painel, conectado, recarregar } = useFilaAoVivo(clienteApi.painel);

  const atual = painel?.fila.atual ?? null;
  const proximos = painel?.fila.proximos ?? [];
  const total = painel?.fila.total ?? 0;
  const meusPedidosAtivos = painel?.meusPedidos ?? [];
  const meusIds = new Set(meusPedidosAtivos.map((p) => p.idFila));
  const filaAtiva = atual ? [atual, ...proximos] : proximos;
  const videosNaFila = new Set(filaAtiva.map((item) => item.musica.youtubeId));
  const limiteAtingido = meusPedidosAtivos.length >= LIMITE_PEDIDOS;

  // Só a resposta da busca mais recente é exibida (o cliente pode digitar mais rápido que a rede).
  const buscarSugestoes = useCallback((termo, pagina, incluirYoutube = false) => {
    const busca = ++ultimaBusca.current;
    const recente = () => busca === ultimaBusca.current;
    const requisicao = incluirYoutube && termo
      ? clienteApi.buscarMusicas(termo).then((itens) => ({
          itens, pagina: 0, total: itens.length, temMais: false,
        }))
      : clienteApi.musicas(termo, pagina, TAMANHO_PAGINA);
    return requisicao
      .then((resposta) => {
        if (!recente()) return;
        const novas = resposta.itens.map(sugestaoDe);
        setResultados((anteriores) => (pagina === 0 ? novas : [...anteriores, ...novas]));
        setPaginaBusca({ pagina: resposta.pagina, total: resposta.total, temMais: resposta.temMais });
        setErroBusca(null);
      })
      .catch((erro) => {
        if (recente()) setErroBusca(erro.message);
      })
      .finally(() => {
        if (recente()) {
          setCarregandoBusca(false);
          setCarregandoMais(false);
        }
      });
  }, []);

  useEffect(() => {
    buscarSugestoes('', 0);
  }, [buscarSugestoes]);

  useEffect(() => () => clearTimeout(timerRef.current), []);

  const executarBusca = (termo, incluirYoutube = false) => {
    setAguardandoDebounce(false);
    const limpo = termo.trim();
    setTermoBuscado(limpo);
    setCarregandoBusca(true);
    buscarSugestoes(limpo, 0, incluirYoutube);
  };

  const carregarMais = () => {
    setCarregandoMais(true);
    buscarSugestoes(termoBuscado, paginaBusca.pagina + 1);
  };

  // As sugestões mudam enquanto o cliente digita (espera uma pausa curta para não buscar a cada tecla).
  const handleInputChange = (e) => {
    const valor = e.target.value;
    setInputBusca(valor);
    setAguardandoDebounce(true);

    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      executarBusca(valor);
    }, ATRASO_BUSCA_MS);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (timerRef.current) clearTimeout(timerRef.current);
    executarBusca(inputBusca, true);
  };

  const exibirAlerta = (mensagem, tipo) => {
    clearTimeout(timerAlerta.current);
    setAlerta({ mensagem, tipo });
    timerAlerta.current = setTimeout(() => setAlerta(null), 3500);
  };

  // Pré-checagem para orientar o cliente; quem decide RN01 e RN02 é a API.
  const handleAbrirConfirmacao = (musica) => {
    if (videosNaFila.has(musica.videoId)) {
      exibirAlerta(`"${musica.titulo}" já está na fila ativa.`, 'erro');
      return;
    }
    if (limiteAtingido) {
      exibirAlerta(`Limite simultâneo atingido (${LIMITE_PEDIDOS}/${LIMITE_PEDIDOS}). Aguarde sua vez.`, 'erro');
      return;
    }
    setMusicaModal(musica);
  };

  const handleConfirmarPedido = async () => {
    if (!musicaModal || enviando) return;
    setEnviando(true);
    try {
      await clienteApi.pedir(musicaModal.videoId, musicaModal.titulo);
      exibirAlerta(`"${musicaModal.titulo}" enviada para a fila!`, 'sucesso');
      setMusicaModal(null);
      recarregar();
    } catch (erro) {
      exibirAlerta(erro.message, 'erro');
      if (erro.status === 401) {
        navigate('/cliente');
        return;
      }
      setMusicaModal(null);
      recarregar();
    } finally {
      setEnviando(false);
    }
  };

  const tocandoAgora = atual
    ? { titulo: atual.musica.titulo, artista: atual.musica.artista ?? '' }
    : { titulo: 'Palco Livre', artista: 'Peça a primeira música!' };
  const cantandoAgora = meusPedidosAtivos.some((p) => p.status === 'reproduzindo');
  const posicoes = meusPedidosAtivos.filter((p) => p.status === 'na_fila').map((p) => p.posicao);
  const minhaPosicao = cantandoAgora ? 0 : posicoes.length ? Math.min(...posicoes) : -1;
  const posicaoEstimada = total + 1;
  const minutosEstimados = (total + (atual ? 1 : 0)) * 4;

  return (
    <div style={styles.container}>
      {/* Notificações */}
      {alerta && (
        <div style={alerta.tipo === 'erro' ? styles.toastErro : styles.toastSucesso}>
          {alerta.tipo === 'erro' ? (
            <AlertCircle size={15} color="#D91C24" style={{ flexShrink: 0 }} />
          ) : (
            <CheckCircle2 size={15} color="#10B981" style={{ flexShrink: 0 }} />
          )}
          <span>{alerta.mensagem}</span>
        </div>
      )}

      {/* Cabeçalho */}
      <header style={styles.header}>
        <div style={styles.brandRow}>
          <img src={logoApache} alt="Apache" style={styles.logo} />
          <div>
            <h1 style={styles.brandTitle}>APACHE</h1>
            <span style={styles.brandSub}>Sessão {codigoSessao}</span>
          </div>
        </div>

        <div style={styles.headerRight}>
          <span
            style={{
              ...styles.quotaPill,
              color: limiteAtingido ? '#FCA5A5' : '#93C5FD',
              borderColor: limiteAtingido ? '#D91C24' : '#1A4B84'
            }}
          >
            {meusPedidosAtivos.length}/{LIMITE_PEDIDOS} na fila
          </span>

          <button
            style={styles.userChip}
            onClick={() => navigate(`/cliente?sessao=${codigoSessao}`)}
          >
            <User size={12} color="#93C5FD" />
            <span>{nomeUsuario}</span>
          </button>
        </div>
      </header>

      {/* Barra de busca */}
      <form onSubmit={handleSearchSubmit} style={styles.searchForm}>
        <div
          style={{
            ...styles.searchPill,
            borderColor: buscaFocada ? '#1A4B84' : 'transparent',
            backgroundColor: buscaFocada ? '#1A202E' : '#161B26'
          }}
        >
          <Search size={18} color={buscaFocada ? '#FFFFFF' : '#71717A'} style={{ flexShrink: 0 }} />
          <input
            type="text"
            placeholder="O que você quer cantar hoje?"
            value={inputBusca}
            onChange={handleInputChange}
            onFocus={() => setBuscaFocada(true)}
            onBlur={() => setBuscaFocada(false)}
            style={styles.searchInput}
          />
          {inputBusca && (
            <button
              type="button"
              onClick={() => {
                setInputBusca('');
                executarBusca('');
              }}
              style={styles.iconBtn}
              aria-label="Limpar busca"
            >
              <X size={16} color="#71717A" />
            </button>
          )}
          <button
            type="submit"
            style={styles.submitIconBtn}
            aria-label="Buscar"
          >
            <ArrowRight size={16} color="#FFFFFF" />
          </button>
        </div>
        {(aguardandoDebounce || (carregandoBusca && resultados.length > 0)) && (
          <span style={styles.debounceText}>Buscando...</span>
        )}
      </form>

      {/* Catálogo de músicas */}
      <main style={styles.feed}>
        <div style={styles.feedHeader}>
          <h2 style={styles.feedTitle}>
            {termoBuscado ? `Resultados para "${termoBuscado}"` : 'Músicas sugeridas'}
          </h2>
          <span style={styles.feedCount}>
            {paginaBusca.total} {paginaBusca.total === 1 ? 'faixa' : 'faixas'}
          </span>
        </div>

        {erroBusca && (
          <div style={styles.erroBusca}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <AlertCircle size={14} color="#D91C24" style={{ flexShrink: 0 }} />
              {erroBusca}
            </span>
            <button type="button" style={styles.btnCarregarMais} onClick={() => executarBusca(inputBusca, true)}>
              Tentar de novo
            </button>
          </div>
        )}

        {resultados.length === 0 ? (
          !erroBusca && (
            <div style={styles.emptyState}>
              {carregandoBusca
                ? 'Carregando músicas…'
                : termoBuscado
                  ? `Nenhuma faixa encontrada para "${termoBuscado}".`
                  : 'Nenhuma música no catálogo ainda.'}
            </div>
          )
        ) : (
          <div style={styles.trackList}>
            {resultados.map((item) => {
              const jaPedida = videosNaFila.has(item.videoId);

              return (
                <div key={item.videoId} style={styles.trackRow}>
                  <img src={miniatura(item.videoId)} alt={item.titulo} style={styles.trackThumb} />
                  <div style={styles.trackMeta}>
                    <h3 style={styles.trackTitle}>{item.titulo}</h3>
                    {item.artista && <p style={styles.trackSub}>{item.artista}</p>}
                  </div>
                  <button
                    style={{
                      ...styles.btnPedirPill,
                      ...(jaPedida || limiteAtingido ? styles.btnPedirMuted : {})
                    }}
                    onClick={() => handleAbrirConfirmacao(item)}
                  >
                    <Plus size={13} strokeWidth={2.5} />
                    <span>{jaPedida ? 'Na fila' : 'Pedir'}</span>
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {paginaBusca.temMais && resultados.length > 0 && (
          <button
            type="button"
            style={{ ...styles.btnCarregarMais, ...(carregandoMais ? { opacity: 0.7, cursor: 'wait' } : {}) }}
            onClick={carregarMais}
            disabled={carregandoMais}
          >
            {carregandoMais ? 'Carregando…' : `Carregar mais (${resultados.length} de ${paginaBusca.total})`}
          </button>
        )}
      </main>

      {/* Barra fixa da fila */}
      <div style={styles.stickyDock}>
        {expandirFila && (
          <div style={styles.queueSheet}>
            <div style={styles.queueHeader}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ListMusic size={15} color="#D91C24" />
                <span>Fila de Apresentações ({filaAtiva.length})</span>
              </div>
              <button
                onClick={() => setExpandirFila(false)}
                style={styles.btnCloseSheet}
              >
                <ChevronDown size={16} color="#94A3B8" />
              </button>
            </div>

            <div style={styles.queueScroll}>
              {filaAtiva.length === 0 && (
                <div style={styles.emptyState}>A fila está vazia.</div>
              )}
              {filaAtiva.map((item) => {
                const isMine = meusIds.has(item.idFila);
                const tocando = item.status === 'reproduzindo';
                return (
                  <div
                    key={item.idFila}
                    style={{
                      ...styles.queueItem,
                      ...(isMine ? styles.queueItemHighlight : {})
                    }}
                  >
                    <div style={styles.queueItemLeft}>
                      <strong style={styles.queueSong}>{item.musica.titulo}</strong>
                      <span style={styles.queueSinger}>
                        {[item.musica.artista, isMine ? 'Seu pedido' : null].filter(Boolean).join(' • ')}
                      </span>
                    </div>

                    <div style={styles.queueItemRight}>
                      <span
                        style={{
                          ...styles.queueBadgePos,
                          color: tocando ? '#D91C24' : isMine ? '#93C5FD' : '#71717A'
                        }}
                      >
                        {tocando ? 'NOW' : `${item.posicao}º`}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div
          style={{
            ...styles.miniBar,
            borderRadius: expandirFila ? '0 0 16px 16px' : '16px'
          }}
          onClick={() => setExpandirFila(!expandirFila)}
        >
          <div style={styles.miniChevron}>
            {expandirFila ? (
              <ChevronDown size={17} color="#94A3B8" />
            ) : (
              <ChevronUp size={17} color="#94A3B8" />
            )}
          </div>

          <div style={styles.miniCenter}>
            <div style={styles.miniTopLine}>
              <Disc3 size={14} color="#D91C24" style={{ flexShrink: 0 }} />
              <span style={styles.miniTitle}>{tocandoAgora.titulo}</span>
              {tocandoAgora.artista && <span style={styles.miniArtist}>• {tocandoAgora.artista}</span>}
            </div>
            <div style={styles.miniSubLine}>
              {minhaPosicao > 0 ? (
                <span>
                  Você é o <strong style={{ color: '#93C5FD' }}>{minhaPosicao}º da fila</strong>
                </span>
              ) : minhaPosicao === 0 ? (
                <span style={{ color: '#10B981', fontWeight: '600' }}>
                  Você está cantando agora!
                </span>
              ) : (
                <span>Você não possui pedidos ativos na fila</span>
              )}
            </div>
          </div>

          <div style={{ ...styles.liveIndicator, ...(conectado ? {} : { color: '#64748B' }) }}>
            <Radio size={11} color={conectado ? '#D91C24' : '#64748B'} />
            <span>{conectado ? 'AO VIVO' : 'RECONECTANDO'}</span>
          </div>
        </div>
      </div>

      {/* Modal de confirmação */}
      {musicaModal && (
        <div style={styles.modalBackdrop} onClick={() => !enviando && setMusicaModal(null)}>
          <div style={styles.bottomSheet} onClick={(e) => e.stopPropagation()}>
            <div style={styles.sheetHandle} />

            <div style={styles.sheetHeader}>
              <div style={styles.sheetTitleGroup}>
                <div style={styles.micBadge}>
                  <Mic2 size={15} color="#D91C24" />
                </div>
                <div>
                  <h3 style={styles.sheetTitle}>Confirmar Pedido</h3>
                  <span style={styles.sheetSub}>APACHE GRU ROCK BAR</span>
                </div>
              </div>
              <button style={styles.btnCloseModal} onClick={() => setMusicaModal(null)} disabled={enviando}>
                <X size={16} color="#94A3B8" />
              </button>
            </div>

            <div style={styles.selectedTrackBox}>
              <img src={miniatura(musicaModal.videoId)} alt={musicaModal.titulo} style={styles.modalThumb} />
              <div style={{ flex: 1, overflow: 'hidden' }}>
                <strong style={styles.modalSong}>{musicaModal.titulo}</strong>
                {musicaModal.artista && <span style={styles.modalArtist}>{musicaModal.artista}</span>}
              </div>
            </div>

            <div style={styles.estimateBox}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ListMusic size={14} color="#D91C24" />
                <span>Posição estimada na fila:</span>
              </div>
              <strong style={{ color: '#FFFFFF' }}>
                #{posicaoEstimada} (~{minutosEstimados} min)
              </strong>
            </div>

            <div style={styles.sheetActions}>
              <button style={styles.btnCancel} onClick={() => setMusicaModal(null)} disabled={enviando}>
                Cancelar
              </button>
              <button
                style={{ ...styles.btnConfirm, ...(enviando ? { opacity: 0.7, cursor: 'wait' } : {}) }}
                onClick={handleConfirmarPedido}
                disabled={enviando}
              >
                <Plus size={15} />
                <span>{enviando ? 'Enviando…' : 'Confirmar Pedido'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  container: {
    backgroundColor: '#0B0E14',
    color: '#FFFFFF',
    minHeight: '100vh',
    padding: '16px 16px 115px 16px',
    fontFamily: "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif",
    maxWidth: '430px',
    margin: '0 auto',
    boxSizing: 'border-box'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '18px'
  },
  brandRow: { display: 'flex', alignItems: 'center', gap: '10px' },
  logo: { width: '32px', height: '32px', objectFit: 'contain' },
  brandTitle: { fontSize: '15px', fontWeight: '800', margin: 0, letterSpacing: '0.3px' },
  brandSub: { fontSize: '9px', color: '#D91C24', fontWeight: '700', letterSpacing: '1px', display: 'block' },
  headerRight: { display: 'flex', alignItems: 'center', gap: '8px' },
  quotaPill: {
    fontSize: '11px',
    fontWeight: '700',
    padding: '4px 9px',
    borderRadius: '14px',
    border: '1px solid',
    backgroundColor: 'rgba(19, 24, 34, 0.8)'
  },
  userChip: {
    display: 'flex',
    alignItems: 'center',
    gap: '5px',
    backgroundColor: '#131822',
    border: '1px solid #1E293B',
    borderRadius: '16px',
    padding: '5px 10px',
    color: '#E2E8F0',
    fontSize: '12px',
    fontWeight: '600',
    cursor: 'pointer'
  },
  searchForm: { marginBottom: '22px' },
  searchPill: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    borderRadius: '999px',
    padding: '6px 6px 6px 16px',
    border: '1px solid transparent',
    transition: 'all 0.2s ease'
  },
  searchInput: {
    flex: 1,
    background: 'transparent',
    border: 'none',
    color: '#FFFFFF',
    fontSize: '14px',
    outline: 'none',
    minWidth: 0
  },
  iconBtn: {
    background: 'none',
    border: 'none',
    padding: '4px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center'
  },
  submitIconBtn: {
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    backgroundColor: '#1A4B84',
    border: 'none',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    flexShrink: 0
  },
  debounceText: {
    display: 'block',
    fontSize: '11px',
    color: '#64748B',
    marginTop: '6px',
    paddingLeft: '14px'
  },
  feedHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: '14px'
  },
  feedTitle: { fontSize: '15px', fontWeight: '700', margin: 0, color: '#F8FAFC' },
  feedCount: { fontSize: '12px', color: '#64748B' },
  emptyState: {
    textAlign: 'center',
    padding: '40px 16px',
    color: '#64748B',
    fontSize: '13px'
  },
  erroBusca: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '10px',
    flexWrap: 'wrap',
    backgroundColor: 'rgba(217, 28, 36, 0.14)',
    borderRadius: '12px',
    padding: '10px 14px',
    fontSize: '12px',
    color: '#FCA5A5',
    marginBottom: '12px'
  },
  btnCarregarMais: {
    display: 'block',
    margin: '16px auto 0 auto',
    backgroundColor: '#161B26',
    color: '#93C5FD',
    border: '1px solid #1A4B84',
    borderRadius: '999px',
    padding: '9px 18px',
    fontSize: '12px',
    fontWeight: '700',
    cursor: 'pointer'
  },
  trackList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '14px'
  },
  trackRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px'
  },
  trackThumb: {
    width: '50px',
    height: '50px',
    borderRadius: '8px',
    objectFit: 'cover',
    backgroundColor: '#161B26',
    flexShrink: 0
  },
  trackMeta: {
    flex: 1,
    overflow: 'hidden'
  },
  trackTitle: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#FFFFFF',
    margin: '0 0 3px 0',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis'
  },
  trackSub: {
    fontSize: '12px',
    color: '#71717A',
    margin: 0,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis'
  },
  btnPedirPill: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    backgroundColor: '#D91C24',
    color: '#FFFFFF',
    border: 'none',
    borderRadius: '20px',
    padding: '7px 14px',
    fontSize: '12px',
    fontWeight: '700',
    cursor: 'pointer',
    flexShrink: 0
  },
  btnPedirMuted: {
    backgroundColor: '#161B26',
    color: '#64748B'
  },
  stickyDock: {
    position: 'fixed',
    bottom: '12px',
    left: '50%',
    transform: 'translateX(-50%)',
    width: 'calc(100% - 24px)',
    maxWidth: '406px',
    zIndex: 100
  },
  queueSheet: {
    backgroundColor: '#121620',
    border: '1px solid #1E293B',
    borderRadius: '16px 16px 0 0',
    padding: '14px 16px',
    boxShadow: '0 -12px 32px rgba(0,0,0,0.75)'
  },
  queueHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    fontSize: '13px',
    fontWeight: '700',
    marginBottom: '12px',
    color: '#F8FAFC'
  },
  btnCloseSheet: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    display: 'flex',
    padding: '2px'
  },
  queueScroll: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    maxHeight: '190px',
    overflowY: 'auto'
  },
  queueItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '8px 10px',
    borderRadius: '10px',
    backgroundColor: 'rgba(255, 255, 255, 0.02)'
  },
  queueItemHighlight: {
    backgroundColor: 'rgba(26, 75, 132, 0.3)',
    border: '1px solid #1A4B84'
  },
  queueItemLeft: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px'
  },
  queueSong: {
    fontSize: '13px',
    color: '#FFFFFF',
    fontWeight: '600'
  },
  queueSinger: {
    fontSize: '11px',
    color: '#71717A'
  },
  queueItemRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px'
  },
  queueBadgePos: {
    fontSize: '11px',
    fontWeight: '800'
  },
  btnTrash: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: '4px',
    display: 'flex'
  },
  miniBar: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    backgroundColor: '#161B26',
    border: '1px solid #1E293B',
    padding: '11px 14px',
    cursor: 'pointer',
    boxShadow: '0 10px 28px rgba(0, 0, 0, 0.85)'
  },
  miniChevron: { display: 'flex', alignItems: 'center' },
  miniCenter: { flex: 1, overflow: 'hidden' },
  miniTopLine: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '13px',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis'
  },
  miniTitle: { fontWeight: '700', color: '#FFFFFF' },
  miniArtist: { color: '#71717A', fontSize: '12px' },
  miniSubLine: { fontSize: '11px', color: '#71717A', marginTop: '2px' },
  liveIndicator: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    fontSize: '9px',
    fontWeight: '800',
    color: '#D91C24',
    letterSpacing: '0.5px'
  },
  modalBackdrop: {
    position: 'fixed',
    inset: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.72)',
    backdropFilter: 'blur(4px)',
    display: 'flex',
    alignItems: 'flex-end',
    justifyContent: 'center',
    zIndex: 999
  },
  bottomSheet: {
    width: '100%',
    maxWidth: '430px',
    backgroundColor: '#121620',
    borderTop: '1px solid #1E293B',
    borderRadius: '22px 22px 0 0',
    padding: '12px 20px 26px 20px',
    boxSizing: 'border-box'
  },
  sheetHandle: {
    width: '36px',
    height: '4px',
    backgroundColor: '#27272A',
    borderRadius: '4px',
    margin: '0 auto 14px auto'
  },
  sheetHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px'
  },
  sheetTitleGroup: { display: 'flex', alignItems: 'center', gap: '10px' },
  micBadge: {
    width: '34px',
    height: '34px',
    borderRadius: '10px',
    backgroundColor: 'rgba(217, 28, 36, 0.15)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  sheetTitle: { fontSize: '15px', fontWeight: '700', margin: 0 },
  sheetSub: { fontSize: '10px', color: '#71717A', fontWeight: '700', letterSpacing: '0.8px' },
  btnCloseModal: {
    width: '30px',
    height: '30px',
    borderRadius: '50%',
    backgroundColor: '#161B26',
    border: 'none',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer'
  },
  selectedTrackBox: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    backgroundColor: '#161B26',
    borderRadius: '12px',
    padding: '10px',
    marginBottom: '12px'
  },
  modalThumb: { width: '48px', height: '48px', borderRadius: '8px', objectFit: 'cover' },
  modalSong: { display: 'block', fontSize: '14px', color: '#FFFFFF', marginBottom: '2px' },
  modalArtist: { display: 'block', fontSize: '12px', color: '#94A3B8' },
  estimateBox: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#161B26',
    borderRadius: '10px',
    padding: '11px 14px',
    fontSize: '12px',
    color: '#94A3B8',
    marginBottom: '18px'
  },
  sheetActions: {
    display: 'flex',
    gap: '10px'
  },
  btnCancel: {
    flex: 1,
    backgroundColor: '#161B26',
    color: '#E2E8F0',
    border: 'none',
    borderRadius: '12px',
    padding: '13px',
    fontSize: '13px',
    fontWeight: '700',
    cursor: 'pointer'
  },
  btnConfirm: {
    flex: 2,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
    backgroundColor: '#D91C24',
    color: '#FFFFFF',
    border: 'none',
    borderRadius: '12px',
    padding: '13px',
    fontSize: '13px',
    fontWeight: '700',
    cursor: 'pointer'
  },
  toastErro: {
    position: 'fixed',
    top: '16px',
    left: '50%',
    transform: 'translateX(-50%)',
    backgroundColor: '#161B26',
    border: '1px solid #D91C24',
    color: '#FFF',
    padding: '10px 14px',
    borderRadius: '12px',
    fontSize: '12px',
    fontWeight: '600',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    zIndex: 9999,
    maxWidth: '380px'
  },
  toastSucesso: {
    position: 'fixed',
    top: '16px',
    left: '50%',
    transform: 'translateX(-50%)',
    backgroundColor: '#161B26',
    border: '1px solid #10B981',
    color: '#FFF',
    padding: '10px 14px',
    borderRadius: '12px',
    fontSize: '12px',
    fontWeight: '600',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    zIndex: 9999,
    maxWidth: '380px'
  }
};

export default ClientePainel;
