import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { User, AlertCircle, QrCode, ArrowRight, KeyRound, Info } from 'lucide-react';
import logoApache from '../assets/logo-apache.png';
import { entrarCliente, lerRecadoCliente } from '../auth/sessaoCliente';

const CODIGO_VALIDO = /^\d{6}$/;

const PALAVRAS_BLOQUEADAS = [
  'admin', 'administrador', 'dj', 'palco', 'sistema', 'moderador',
  'troll', 'teste', 'null', 'undefined', 'palavrao', 'idiota', 'otario', 'babaca'
];

export function ClienteEntrada() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  // O QR Code do telão traz o código (?sessao=123456); sem ele, o cliente digita.
  const codigoDoQr = CODIGO_VALIDO.test(searchParams.get('sessao') ?? '') ? searchParams.get('sessao') : '';
  const [codigo, setCodigo] = useState(codigoDoQr);
  const [nome, setNome] = useState('');
  const [focado, setFocado] = useState(false);
  const [codigoFocado, setCodigoFocado] = useState(false);
  const [erro, setErro] = useState('');
  const [entrando, setEntrando] = useState(false);
  const [recado] = useState(lerRecadoCliente);

  useEffect(() => {
    const nomeSalvo = sessionStorage.getItem('apache_cantor');
    if (nomeSalvo) setNome(nomeSalvo);
  }, []);

  const validarNome = (texto) => {
    const limpo = texto.trim().toLowerCase();
    if (limpo.length < 2) return 'Digite pelo menos 2 letras para ser chamado no palco.';
    if (limpo.length > 25) return 'Nome muito longo (máximo 25 caracteres).';

    const bloqueado = PALAVRAS_BLOQUEADAS.some((palavra) => limpo.includes(palavra));
    if (bloqueado) {
      return 'Esse nome não é permitido no palco do Apache. Escolha outro.';
    }
    return null;
  };

  const handleEntrar = async (e) => {
    e.preventDefault();
    const mensagemErro = validarNome(nome);
    if (mensagemErro) {
      setErro(mensagemErro);
      return;
    }

    if (!CODIGO_VALIDO.test(codigo)) {
      setErro('Digite o código de 6 números mostrado no telão.');
      return;
    }

    setEntrando(true);
    try {
      await entrarCliente(nome.trim(), codigo);
    } catch (falha) {
      setErro(falha.message);
      setEntrando(false);
      return;
    }

    sessionStorage.setItem('apache_cantor', nome.trim());
    navigate('/cliente/painel');
  };

  return (
    <div style={styles.container}>
      <div style={styles.ambientGlow} />

      <div style={styles.content}>
        {/* Identidade visual */}
        <img src={logoApache} alt="Apache Gru Rock Bar" style={styles.logo} />
        <h1 style={styles.title}>APACHE</h1>
        <span style={styles.subtitle}>GRU ROCK BAR • KARAOKÊ</span>

        {codigoDoQr ? (
          <div style={styles.sessaoPill}>
            <QrCode size={12} color="#93C5FD" />
            <span>Sessão {codigoDoQr}</span>
          </div>
        ) : (
          <div style={{ marginBottom: '24px' }} />
        )}

        {recado && (
          <div style={styles.recadoBox} role="status">
            <Info size={14} color="#93C5FD" style={{ flexShrink: 0 }} />
            <span>{recado}</span>
          </div>
        )}

        {/* Formulário de identificação */}
        <form onSubmit={handleEntrar} style={styles.form}>
          {!codigoDoQr && (
            <>
              <label style={styles.label}>Código da sessão (no telão)</label>
              <div
                style={{
                  ...styles.inputPill,
                  borderColor: codigoFocado ? '#1A4B84' : 'transparent',
                  backgroundColor: codigoFocado ? '#1A202E' : '#161B26'
                }}
              >
                <KeyRound size={17} color={codigoFocado ? '#FFFFFF' : '#71717A'} />
                <input
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={6}
                  placeholder="000000"
                  value={codigo}
                  onChange={(e) => {
                    setCodigo(e.target.value.replace(/\D/g, '').slice(0, 6));
                    if (erro) setErro('');
                  }}
                  onFocus={() => setCodigoFocado(true)}
                  onBlur={() => setCodigoFocado(false)}
                  style={{ ...styles.input, letterSpacing: '3px' }}
                />
              </div>
            </>
          )}

          <label style={styles.label}>Como você quer ser chamado no palco?</label>

          <div
            style={{
              ...styles.inputPill,
              borderColor: erro ? '#D91C24' : focado ? '#1A4B84' : 'transparent',
              backgroundColor: focado ? '#1A202E' : '#161B26'
            }}
          >
            <User size={17} color={focado ? '#FFFFFF' : '#71717A'} />
            <input
              type="text"
              placeholder="Ex: Yasmin - Mesa 04"
              value={nome}
              onChange={(e) => {
                setNome(e.target.value);
                if (erro) setErro('');
              }}
              onFocus={() => setFocado(true)}
              onBlur={() => setFocado(false)}
              style={styles.input}
            />
          </div>

          {erro && (
            <div style={styles.errorBox}>
              <AlertCircle size={14} color="#D91C24" style={{ flexShrink: 0 }} />
              <span>{erro}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={entrando}
            style={{ ...styles.btnSubmit, ...(entrando ? { opacity: 0.7, cursor: 'wait' } : {}) }}
          >
            <span>{entrando ? 'Entrando…' : 'Entrar no Karaokê'}</span>
            <ArrowRight size={16} />
          </button>
        </form>
      </div>
    </div>
  );
}

const styles = {
  container: {
    backgroundColor: '#0B0E14',
    color: '#FFFFFF',
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '24px 20px',
    fontFamily: "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif",
    position: 'relative',
    boxSizing: 'border-box'
  },
  ambientGlow: {
    position: 'absolute',
    top: '14%',
    width: '280px',
    height: '180px',
    background: 'radial-gradient(circle, rgba(217,28,36,0.18) 0%, rgba(11,14,20,0) 70%)',
    pointerEvents: 'none'
  },
  content: {
    width: '100%',
    maxWidth: '360px',
    textAlign: 'center',
    zIndex: 1
  },
  logo: {
    width: '72px',
    height: '72px',
    objectFit: 'contain',
    marginBottom: '10px'
  },
  title: {
    fontSize: '26px',
    fontWeight: '800',
    margin: 0,
    letterSpacing: '-0.3px'
  },
  subtitle: {
    fontSize: '10px',
    color: '#D91C24',
    fontWeight: '700',
    letterSpacing: '2px',
    display: 'block',
    marginBottom: '14px'
  },
  sessaoPill: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    backgroundColor: 'rgba(26, 75, 132, 0.22)',
    border: '1px solid #1A4B84',
    padding: '4px 12px',
    borderRadius: '999px',
    fontSize: '11px',
    fontWeight: '600',
    color: '#93C5FD',
    marginBottom: '34px'
  },
  form: {
    textAlign: 'left',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px'
  },
  label: {
    fontSize: '12px',
    fontWeight: '600',
    color: '#94A3B8',
    paddingLeft: '4px'
  },
  inputPill: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    borderRadius: '999px',
    padding: '14px 18px',
    border: '1px solid transparent',
    transition: 'all 0.2s ease'
  },
  input: {
    flex: 1,
    background: 'transparent',
    border: 'none',
    color: '#FFFFFF',
    fontSize: '14px',
    outline: 'none',
    minWidth: 0
  },
  recadoBox: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    backgroundColor: 'rgba(26, 75, 132, 0.22)',
    border: '1px solid #1A4B84',
    borderRadius: '12px',
    padding: '10px 14px',
    fontSize: '12px',
    color: '#93C5FD',
    textAlign: 'left',
    marginBottom: '16px'
  },
  errorBox: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    backgroundColor: 'rgba(217, 28, 36, 0.14)',
    borderRadius: '12px',
    padding: '10px 14px',
    fontSize: '12px',
    color: '#FCA5A5'
  },
  btnSubmit: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    backgroundColor: '#D91C24',
    color: '#FFFFFF',
    border: 'none',
    borderRadius: '999px',
    padding: '15px',
    fontSize: '14px',
    fontWeight: '700',
    cursor: 'pointer',
    marginTop: '6px'
  }
};

export default ClienteEntrada;