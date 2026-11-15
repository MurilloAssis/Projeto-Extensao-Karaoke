import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { User, Music2, AlertCircle, QrCode } from 'lucide-react';
import logoApache from '../assets/logo-apache.png';

const PALAVRAS_BLOQUEADAS = [
  'admin', 'administrador', 'dj', 'palco', 'sistema', 'moderador',
  'troll', 'teste', 'null', 'undefined', 'palavrao', 'idiota', 'otario', 'babaca'
];

export function ClienteEntrada() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const sessaoId = searchParams.get('sessao') || 'NOITE-APACHE-01';
  const [nome, setNome] = useState('');
  const [erro, setErro] = useState('');

  useEffect(() => {
    const nomeSalvo = sessionStorage.getItem('apache_cantor');
    if (nomeSalvo) setNome(nomeSalvo);
  }, []);

  const validarNomeAntiTroll = (texto) => {
    const limpo = texto.trim().toLowerCase();
    if (limpo.length < 2) return 'Digite pelo menos 2 letras para ser chamado no palco.';
    if (limpo.length > 25) return 'Nome muito longo (máximo 25 caracteres).';
    
    const temPalavraProibida = PALAVRAS_BLOQUEADAS.some(palavra => limpo.includes(palavra));
    if (temPalavraProibida) {
      return 'Ops! Esse nome não é permitido no palco do Apache. Escolha um nome válido.';
    }
    return null;
  };

  const handleEntrar = (e) => {
    e.preventDefault();
    const mensagemErro = validarNomeAntiTroll(nome);
    if (mensagemErro) {
      setErro(mensagemErro);
      return;
    }

    sessionStorage.setItem('apache_cantor', nome.trim());
    sessionStorage.setItem('apache_sessao', sessaoId);
    navigate(`/cliente/painel?sessao=${sessaoId}`);
  };

  return (
    <div style={styles.container}>
      <div style={styles.glow} />
      
      <div style={styles.card}>
        <img src={logoApache} alt="Apache Gru Rock Bar" style={styles.logo} />
        <h1 style={styles.title}>APACHE</h1>
        <span style={styles.subtitle}>GRU ROCK BAR • KARAOKÊ</span>
        
        <div style={styles.sessaoBadge}>
          <QrCode size={12} color="#93C5FD" />
          <span>Sessão ativa: {sessaoId}</span>
        </div>

        <form onSubmit={handleEntrar} style={styles.form}>
          <label style={styles.label}>COMO VOCÊ QUER SER CHAMADO NO PALCO?</label>
          <div style={styles.inputBox}>
            <User size={18} color="#71717A" style={styles.icon} />
            <input
              type="text"
              placeholder="Ex: Ana - Mesa 04"
              value={nome}
              onChange={(e) => {
                setNome(e.target.value);
                if (erro) setErro('');
              }}
              style={styles.input}
            />
          </div>

          {erro && (
            <div style={styles.errorBox}>
              <AlertCircle size={15} color="#D91C24" style={{ flexShrink: 0 }} />
              <span>{erro}</span>
            </div>
          )}

          <button type="submit" style={styles.btnSubmit}>
            <Music2 size={16} />
            <span>Entrar na Noite de Karaokê</span>
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
    padding: '16px',
    fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
    position: 'relative',
    boxSizing: 'border-box'
  },
  glow: {
    position: 'absolute',
    top: '10%',
    width: '260px',
    height: '160px',
    background: 'radial-gradient(circle, rgba(217,28,36,0.22) 0%, rgba(11,14,20,0) 70%)',
    pointerEvents: 'none'
  },
  card: {
    width: '100%',
    maxWidth: '380px',
    textAlign: 'center',
    zIndex: 1
  },
  logo: {
    width: '76px',
    height: '76px',
    objectFit: 'contain',
    marginBottom: '12px'
  },
  title: {
    fontSize: '28px',
    fontWeight: '800',
    margin: 0,
    letterSpacing: '-0.5px'
  },
  subtitle: {
    fontSize: '10px',
    color: '#D91C24',
    fontWeight: '700',
    letterSpacing: '2px',
    display: 'block',
    marginBottom: '14px'
  },
  sessaoBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    backgroundColor: 'rgba(26, 75, 132, 0.25)',
    border: '1px solid #1A4B84',
    padding: '4px 12px',
    borderRadius: '20px',
    fontSize: '11px',
    color: '#93C5FD',
    marginBottom: '28px'
  },
  form: {
    textAlign: 'left',
    display: 'flex',
    flexDirection: 'column',
    gap: '10px'
  },
  label: {
    fontSize: '10px',
    fontWeight: '700',
    color: '#94A3B8',
    letterSpacing: '0.8px'
  },
  inputBox: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center'
  },
  icon: {
    position: 'absolute',
    left: '14px'
  },
  input: {
    width: '100%',
    backgroundColor: '#131822',
    border: '1px solid #1E293B',
    borderRadius: '12px',
    padding: '14px 14px 14px 44px',
    color: '#FFFFFF',
    fontSize: '14px',
    outline: 'none',
    boxSizing: 'border-box'
  },
  errorBox: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    backgroundColor: 'rgba(217, 28, 36, 0.15)',
    border: '1px solid #D91C24',
    borderRadius: '10px',
    padding: '10px 12px',
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
    borderRadius: '12px',
    padding: '14px',
    fontSize: '14px',
    fontWeight: '700',
    cursor: 'pointer',
    marginTop: '6px'
  }
};