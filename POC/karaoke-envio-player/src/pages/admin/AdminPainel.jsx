import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, Radio, AlertCircle, CheckCircle2, RotateCw } from 'lucide-react';
import logoApache from '../../assets/logo-apache.png';
import { filaApi } from '../../api/filaApi';
import { encerrarSessao } from '../../auth/sessaoAdmin';
import { useFilaAoVivo } from '../../hooks/useFilaAoVivo';
import { TocandoAgora } from './TocandoAgora';
import { ListaFila } from './ListaFila';
import { Confirmacao } from './Confirmacao';
import { cores, estilos } from './estilosAdmin';

function descricaoLimpar(total, tocando) {
  const partes = [];
  if (total > 0) partes.push(`cancela ${total} ${total === 1 ? 'pedido' : 'pedidos'} da fila`);
  if (tocando) partes.push('encerra a música atual');
  const texto = partes.join(' e ');
  return `${texto.charAt(0).toUpperCase()}${texto.slice(1)}. Não dá para desfazer.`;
}

export function AdminPainel() {
  const navigate = useNavigate();
  const [acao, setAcao] = useState(null);
  const [toast, setToast] = useState(null);
  const [confirmacao, setConfirmacao] = useState(null);
  const timerToast = useRef(null);

  const { fila, erroCarga, conectado, recarregar, aplicar } = useFilaAoVivo(filaApi.admin);

  useEffect(() => () => clearTimeout(timerToast.current), []);

  const exibirToast = (mensagem, tipo) => {
    clearTimeout(timerToast.current);
    setToast({ mensagem, tipo });
    timerToast.current = setTimeout(() => setToast(null), 3500);
  };

  const executar = async (nome, chamada, sucesso) => {
    setAcao(nome);
    try {
      const resposta = await chamada();
      if (resposta) aplicar(resposta);
      else await recarregar();
      exibirToast(sucesso, 'sucesso');
      return true;
    } catch (erro) {
      exibirToast(erro.message, 'erro');
      if (erro.status !== 401) recarregar();
      return false;
    } finally {
      setAcao(null);
    }
  };

  const handlePlay = () => executar('play', filaApi.play, 'Reprodução iniciada.');
  const handleProxima = () => executar('proxima', filaApi.proxima, 'Próxima música no palco.');

  const handleConfirmar = async () => {
    if (confirmacao.tipo === 'remover') {
      await executar('remover', () => filaApi.remover(confirmacao.item.idFila), 'Pedido removido da fila.');
    } else {
      await executar('limpar', filaApi.limpar, 'Fila limpa.');
    }
    setConfirmacao(null);
  };

  const handleSair = () => {
    encerrarSessao();
    navigate('/admin/login', { replace: true });
  };

  const atual = fila?.atual ?? null;
  const proximos = fila?.proximos ?? [];
  const total = fila?.total ?? 0;

  return (
    <div style={estilos.container}>
      <div style={estilos.bgImage} />
      <div style={estilos.bgOverlay} />

      {toast && (
        <div style={toast.tipo === 'erro' ? estilos.toastErro : estilos.toastSucesso} role="status">
          {toast.tipo === 'erro' ? (
            <AlertCircle size={15} color={cores.vermelho} style={{ flexShrink: 0 }} />
          ) : (
            <CheckCircle2 size={15} color={cores.sucesso} style={{ flexShrink: 0 }} />
          )}
          <span>{toast.mensagem}</span>
        </div>
      )}

      <div style={estilos.glassCardDesktop}>
        <header style={estilos.header}>
          <div style={estilos.headerBrand}>
            <img src={logoApache} alt="Apache" style={estilos.logoSmall} />
            <div>
              <h2 style={estilos.titleLeft}>Gerenciar Fila</h2>
              <span style={estilos.subtitleSmall}>APACHE GRU ROCK BAR • DJ</span>
            </div>
          </div>

          <div style={estilos.headerRight}>
            <span
              style={{ ...estilos.liveIndicator, color: conectado ? cores.vermelho : cores.apagado }}
              title={conectado ? 'Recebendo atualizações em tempo real' : 'Sem conexão em tempo real'}
            >
              <Radio size={12} />
              {conectado ? 'AO VIVO' : 'RECONECTANDO…'}
            </span>
            <button type="button" onClick={handleSair} style={estilos.buttonOutline}>
              <LogOut size={14} />
              <span>Sair</span>
            </button>
          </div>
        </header>

        {!fila && erroCarga && (
          <div style={{ ...estilos.errorBox, marginBottom: '16px', justifyContent: 'space-between' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <AlertCircle size={14} color={cores.vermelho} style={{ flexShrink: 0 }} />
              {erroCarga.message}
            </span>
            <button type="button" onClick={recarregar} style={estilos.buttonOutline}>
              <RotateCw size={13} />
              <span>Tentar de novo</span>
            </button>
          </div>
        )}

        {!fila && !erroCarga && <p style={estilos.emptyState}>Carregando fila…</p>}

        {fila && (
          <>
            <TocandoAgora
              atual={atual}
              podePlay={atual === null && total > 0}
              podeProxima={atual !== null}
              acao={acao}
              onPlay={handlePlay}
              onProxima={handleProxima}
            />
            <ListaFila
              proximos={proximos}
              total={total}
              podeLimpar={atual !== null || total > 0}
              acao={acao}
              onRemover={(item) => setConfirmacao({ tipo: 'remover', item })}
              onLimpar={() => setConfirmacao({ tipo: 'limpar' })}
            />
          </>
        )}
      </div>

      {confirmacao && (
        <Confirmacao
          titulo={confirmacao.tipo === 'remover' ? 'Remover pedido' : 'Limpar fila'}
          descricao={
            confirmacao.tipo === 'remover'
              ? `"${confirmacao.item.musica.titulo}", pedido de ${confirmacao.item.solicitante?.nome ?? 'cliente'}, sairá da fila.`
              : descricaoLimpar(total, atual !== null)
          }
          textoConfirmar={confirmacao.tipo === 'remover' ? 'Remover' : 'Limpar fila'}
          ocupado={acao !== null}
          onConfirmar={handleConfirmar}
          onCancelar={() => setConfirmacao(null)}
        />
      )}
    </div>
  );
}
