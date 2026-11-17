import { QRCodeSVG } from 'qrcode.react';
import { KeyRound, Power, QrCode } from 'lucide-react';
import { cores, estilos } from './estilosAdmin';

// Vazio: o link do QR usa o endereço do próprio painel (ex.: o túnel, quando aberto por ele).
const CLIENTE_URL = (import.meta.env.VITE_CLIENTE_URL || window.location.origin).replace(/\/$/, '');

const linkDoCliente = (codigo) => `${CLIENTE_URL}/cliente?sessao=${codigo}`;

export function SessaoKaraoke({ sessao, carregando, acao, onAbrir, onEncerrar }) {
  const ocupado = acao !== null;

  return (
    <section style={estilos.cardSessao} aria-label="Sessão do karaokê">
      <div style={{ ...estilos.rotuloAtual, color: cores.apoioSuave }}>
        <KeyRound size={12} color={cores.apoioSuave} />
        <span>SESSÃO DO KARAOKÊ</span>
      </div>

      {carregando && <p style={{ ...estilos.emptyState, padding: '4px 0', textAlign: 'left' }}>Consultando sessão…</p>}

      {!carregando && !sessao && (
        <div style={estilos.sessaoLinha}>
          <p style={{ ...estilos.trackSub, whiteSpace: 'normal', flex: 1 }}>
            Nenhuma sessão aberta. Abra para liberar a entrada dos clientes pelo QR Code do telão.
          </p>
          <button
            type="button"
            onClick={onAbrir}
            disabled={ocupado}
            style={{ ...estilos.botaoPlay, flex: 'none', ...(ocupado ? estilos.botaoInativo : {}) }}
          >
            <QrCode size={15} />
            <span>{acao === 'abrir-sessao' ? 'Abrindo…' : 'Abrir sessão'}</span>
          </button>
        </div>
      )}

      {!carregando && sessao && (
        <div style={estilos.sessaoLinha}>
          <div style={estilos.qrBox}>
            <QRCodeSVG value={linkDoCliente(sessao.codigo)} size={88} bgColor="#FFFFFF" fgColor={cores.fundo} />
          </div>
          <div style={estilos.trackMeta}>
            <span style={estilos.sessaoRotuloCodigo}>Código para entrar</span>
            <strong style={estilos.sessaoCodigo}>{sessao.codigo}</strong>
            <p style={{ ...estilos.trackSub, whiteSpace: 'normal' }}>O mesmo QR Code aparece no telão.</p>
          </div>
          <button
            type="button"
            onClick={onEncerrar}
            disabled={ocupado}
            style={{ ...estilos.buttonOutline, ...(ocupado ? estilos.buttonOutlineInativo : {}) }}
          >
            <Power size={14} />
            <span>Encerrar</span>
          </button>
        </div>
      )}
    </section>
  );
}
