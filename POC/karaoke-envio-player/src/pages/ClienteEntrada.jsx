import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { User, AlertCircle, QrCode, ArrowRight } from 'lucide-react';
import logoApache from '../assets/logo-apache.png';
import { clienteApi } from '../api/clienteApi';
import { encerrarSessaoCliente, iniciarSessaoCliente } from '../auth/sessaoCliente';

const PALAVRAS_BLOQUEADAS = [
  'admin', 'administrador', 'dj', 'palco', 'sistema', 'moderador',
  'troll', 'teste', 'null', 'undefined', 'palavrao', 'idiota', 'otario', 'babaca'
];

export function ClienteEntrada() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const sessaoId = searchParams.get('sessao') || 'NOITE-APACHE-01';
  const [nome, setNome] = useState('');
  const [focado, setFocado] = useState(false);
  const [erro, setErro] = useState('');
  const [entrando, setEntrando] = useState(false);

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

    // Até o card 1.2, entra como visitante de desenvolvimento e confere o acesso na API.
    setEntrando(true);
    iniciarSessaoCliente(nome.trim(), searchParams.get('visitante'));
    try {
      await clienteApi.meusPedidos();
    } catch (falha) {
      encerrarSessaoCliente();
      setErro(falha.message);
      setEntrando(false);
      return;
    }

    sessionStorage.setItem('apache_cantor', nome.trim());
    sessionStorage.setItem('apache_sessao', sessaoId);
    navigate(`/cliente/painel?sessao=${sessaoId}`);
  };

  return (
    <div style={styles.container}>
      <div style={styles.ambientGlow} />

      <div style={styles.content}>
        {/* Identidade visual */}
        <img src={logoApache} alt="Apache Gru Rock Bar" style={styles.logo} />
        <h1 style={styles.title}>APACHE</h1>
        <span style={styles.subtitle}>GRU ROCK BAR • KARAOKÊ</span>

        <div style={styles.sessaoPill}>
          <QrCode size={12} color="#93C5FD" />
          <span>{sessaoId}</span>
        </div>

        {/* Formulário de identificação */}
        <form onSubmit={handleEntrar} style={styles.form}>
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