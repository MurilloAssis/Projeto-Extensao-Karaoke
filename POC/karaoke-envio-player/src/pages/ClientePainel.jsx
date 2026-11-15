import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search, User, Plus, ChevronUp, ChevronDown,
  AlertCircle, CheckCircle2, Radio, ListMusic, Disc3, Trash2, X, Mic2, ArrowRight
} from 'lucide-react';
import logoApache from '../assets/logo-apache.png';

const CATALOGO_MOCK = [
  { id: 'yt-1', titulo: 'Evidências', artista: 'Chitãozinho & Xororó', duracao: '04:39', thumb: 'https://img.youtube.com/vi/ePjtnSPFWK8/mqdefault.jpg' },
  { id: 'yt-2', titulo: 'Bohemian Rhapsody', artista: 'Queen', duracao: '05:55', thumb: 'https://img.youtube.com/vi/fJ9rUzIMcZQ/mqdefault.jpg' },
  { id: 'yt-3', titulo: 'Tempo Perdido', artista: 'Legião Urbana', duracao: '05:02', thumb: 'https://img.youtube.com/vi/a658W4K8j10/mqdefault.jpg' },
  { id: 'yt-4', titulo: "Sweet Child O' Mine", artista: "Guns N' Roses", duracao: '05:03', thumb: 'https://img.youtube.com/vi/1w7OgIMMRc4/mqdefault.jpg' },
  { id: 'yt-5', titulo: 'Anna Júlia', artista: 'Los Hermanos', duracao: '03:32', thumb: 'https://img.youtube.com/vi/umj0gu5nEGs/mqdefault.jpg' },
  { id: 'yt-6', titulo: 'Mulher de Fases', artista: 'Raimundos', duracao: '03:33', thumb: 'https://img.youtube.com/vi/8w6X-t9F47Q/mqdefault.jpg' },
  { id: 'yt-7', titulo: 'Garota Nacional', artista: 'Skank', duracao: '05:17', thumb: 'https://img.youtube.com/vi/6M4_Ommfvv0/mqdefault.jpg' },
  { id: 'yt-8', titulo: 'Cheia de Manias', artista: 'Raça Negra', duracao: '03:28', thumb: 'https://img.youtube.com/vi/903hL2X033w/mqdefault.jpg' }
];

const LIMITE_MUSICAS_SIMULTANEAS = 2;

export function ClientePainel() {
  const navigate = useNavigate();
  const [nomeUsuario, setNomeUsuario] = useState('');
  const [sessaoId, setSessaoId] = useState('');
  const [inputBusca, setInputBusca] = useState('');
  const [termoBuscado, setTermoBuscado] = useState('');
  const [aguardandoDebounce, setAguardandoDebounce] = useState(false);
  const [buscaFocada, setBuscaFocada] = useState(false);
  const [resultados, setResultados] = useState(CATALOGO_MOCK);
  const [expandirFila, setExpandirFila] = useState(false);
  const [musicaModal, setMusicaModal] = useState(null);
  const [alerta, setAlerta] = useState(null);
  const timerRef = useRef(null);

  const [filaAtiva, setFilaAtiva] = useState([
    { idPedido: 101, titulo: 'Evidências', artista: 'Chitãozinho & Xororó', solicitante: 'Mesa 02' },
    { idPedido: 102, titulo: 'Bohemian Rhapsody', artista: 'Queen', solicitante: 'Mesa 05' }
  ]);

  useEffect(() => {
    const salvo = sessionStorage.getItem('apache_cantor');
    const sessao = sessionStorage.getItem('apache_sessao') || 'NOITE-APACHE-01';
    if (!salvo) {
      navigate('/cliente');
    } else {
      setNomeUsuario(salvo);
      setSessaoId(sessao);
    }
  }, [navigate]);

  const executarBusca = (termo) => {
    setAguardandoDebounce(false);
    const limpo = termo.trim();
    setTermoBuscado(limpo);

    if (!limpo) {
      setResultados(CATALOGO_MOCK);
      return;
    }

    const filtrados = CATALOGO_MOCK.filter(
      (item) =>
        item.titulo.toLowerCase().includes(limpo.toLowerCase()) ||
        item.artista.toLowerCase().includes(limpo.toLowerCase())
    );
    setResultados(filtrados);
  };

  // Debounce da busca (800ms)
  const handleInputChange = (e) => {
    const valor = e.target.value;
    setInputBusca(valor);
    setAguardandoDebounce(true);

    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      executarBusca(valor);
    }, 800);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (timerRef.current) clearTimeout(timerRef.current);
    executarBusca(inputBusca);
  };

  const handleAbrirConfirmacao = (musica) => {
    const jaNaFila = filaAtiva.some(
      (item) => item.titulo.toLowerCase() === musica.titulo.toLowerCase()
    );
    if (jaNaFila) {
      exibirAlerta(`"${musica.titulo}" já está na fila ativa.`, 'erro');
      return;
    }

    const meusPedidos = filaAtiva.filter((item) => item.solicitante === nomeUsuario);
    if (meusPedidos.length >= LIMITE_MUSICAS_SIMULTANEAS) {
      exibirAlerta(
        `Limite simultâneo atingido (${LIMITE_MUSICAS_SIMULTANEAS}/${LIMITE_MUSICAS_SIMULTANEAS}). Aguarde sua vez.`,
        'erro'
      );
      return;
    }

    setMusicaModal(musica);
  };

  const handleConfirmarPedido = () => {
    if (!musicaModal) return;

    const novoPedido = {
      idPedido: Date.now(),
      titulo: musicaModal.titulo,
      artista: musicaModal.artista,
      solicitante: nomeUsuario
    };

    setFilaAtiva((prev) => [...prev, novoPedido]);
    exibirAlerta(`"${musicaModal.titulo}" enviada para a fila!`, 'sucesso');
    setMusicaModal(null);
  };

  const handleRemoverPedido = (idPedido) => {
    setFilaAtiva((prev) => prev.filter((item) => item.idPedido !== idPedido));
    exibirAlerta('Pedido cancelado.', 'sucesso');
  };

  const exibirAlerta = (mensagem, tipo) => {
    setAlerta({ mensagem, tipo });
    setTimeout(() => setAlerta(null), 3500);
  };

  const tocandoAgora = filaAtiva[0] || { titulo: 'Palco Livre', artista: 'Peça a primeira música!' };
  const meusPedidosAtivos = filaAtiva.filter((item) => item.solicitante === nomeUsuario);
  const proximoMeuPedido = meusPedidosAtivos[0];
  const minhaPosicao = proximoMeuPedido ? filaAtiva.indexOf(proximoMeuPedido) : -1;

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
            <span style={styles.brandSub}>{sessaoId}</span>
          </div>
        </div>

        <div style={styles.headerRight}>
          <span
            style={{
              ...styles.quotaPill,
              color: meusPedidosAtivos.length >= LIMITE_MUSICAS_SIMULTANEAS ? '#FCA5A5' : '#93C5FD',
              borderColor: meusPedidosAtivos.length >= LIMITE_MUSICAS_SIMULTANEAS ? '#D91C24' : '#1A4B84'
            }}
          >
            {meusPedidosAtivos.length}/{LIMITE_MUSICAS_SIMULTANEAS} na fila
          </span>

          <button
            style={styles.userChip}
            onClick={() => navigate(`/cliente?sessao=${sessaoId}`)}
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
        {aguardandoDebounce && (
          <span style={styles.debounceText}>Buscando...</span>
        )}
      </form>

      {/* Catálogo de músicas */}
      <main style={styles.feed}>
        <div style={styles.feedHeader}>
          <h2 style={styles.feedTitle}>
            {termoBuscado ? `Resultados para "${termoBuscado}"` : 'Músicas sugeridas'}
          </h2>
          <span style={styles.feedCount}>{resultados.length} faixas</span>
        </div>

        {resultados.length === 0 ? (
          <div style={styles.emptyState}>
            Nenhuma faixa encontrada para "{termoBuscado}".
          </div>
        ) : (
          <div style={styles.trackList}>
            {resultados.map((item) => {
              const jaPedida = filaAtiva.some(
                (q) => q.titulo.toLowerCase() === item.titulo.toLowerCase()
              );
              const limiteAtingido = meusPedidosAtivos.length >= LIMITE_MUSICAS_SIMULTANEAS;

              return (
                <div key={item.id} style={styles.trackRow}>
                  <img src={item.thumb} alt={item.titulo} style={styles.trackThumb} />
                  <div style={styles.trackMeta}>
                    <h3 style={styles.trackTitle}>{item.titulo}</h3>
                    <p style={styles.trackSub}>
                      {item.artista} • {item.duracao}
                    </p>
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
              {filaAtiva.map((item, idx) => {
                const isMine = item.solicitante === nomeUsuario;
                return (
                  <div
                    key={item.idPedido}
                    style={{
                      ...styles.queueItem,
                      ...(isMine ? styles.queueItemHighlight : {})
                    }}
                  >
                    <div style={styles.queueItemLeft}>
                      <strong style={styles.queueSong}>{item.titulo}</strong>
                      <span style={styles.queueSinger}>
                        {isMine ? `${item.solicitante} • Seu pedido` : item.solicitante}
                      </span>
                    </div>

                    <div style={styles.queueItemRight}>
                      <span
                        style={{
                          ...styles.queueBadgePos,
                          color: idx === 0 ? '#D91C24' : isMine ? '#93C5FD' : '#71717A'
                        }}
                      >
                        {idx === 0 ? 'NOW' : `${idx}º`}
                      </span>
                      {isMine && idx > 0 && (
                        <button
                          onClick={() => handleRemoverPedido(item.idPedido)}
                          style={styles.btnTrash}
                        >
                          <Trash2 size={14} color="#D91C24" />
                        </button>
                      )}
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
              <span style={styles.miniArtist}>• {tocandoAgora.artista}</span>
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

          <div style={styles.liveIndicator}>
            <Radio size={11} color="#D91C24" />
            <span>AO VIVO</span>
          </div>
        </div>
      </div>

      {/* Modal de confirmação */}
      {musicaModal && (
        <div style={styles.modalBackdrop} onClick={() => setMusicaModal(null)}>
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
              <button style={styles.btnCloseModal} onClick={() => setMusicaModal(null)}>
                <X size={16} color="#94A3B8" />
              </button>
            </div>

            <div style={styles.selectedTrackBox}>
              <img src={musicaModal.thumb} alt={musicaModal.titulo} style={styles.modalThumb} />
              <div style={{ flex: 1, overflow: 'hidden' }}>
                <strong style={styles.modalSong}>{musicaModal.titulo}</strong>
                <span style={styles.modalArtist}>{musicaModal.artista}</span>
              </div>
              <span style={styles.modalDuration}>{musicaModal.duracao}</span>
            </div>

            <div style={styles.estimateBox}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ListMusic size={14} color="#D91C24" />
                <span>Posição estimada na fila:</span>
              </div>
              <strong style={{ color: '#FFFFFF' }}>
                #{filaAtiva.length} (~{filaAtiva.length * 4} min)
              </strong>
            </div>

            <div style={styles.sheetActions}>
              <button style={styles.btnCancel} onClick={() => setMusicaModal(null)}>
                Cancelar
              </button>
              <button style={styles.btnConfirm} onClick={handleConfirmarPedido}>
                <Plus size={15} />
                <span>Confirmar Pedido</span>
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
  modalDuration: { fontSize: '11px', color: '#71717A', fontWeight: '600' },
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