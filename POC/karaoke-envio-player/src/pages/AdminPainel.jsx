import { useState } from 'react';
import { Lock, User, Link2, LogOut, Send } from 'lucide-react';
import logoApache from '../assets/logo-apache.png';
import fundoPalco from '../assets/fundo-palco.jfif';

export function AdminPainel() {
  // Estados de Autenticação
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [usuario, setUsuario] = useState("");
  const [senha, setSenha] = useState("");
  
  // Estado da Fila
  const [inputUrl, setInputUrl] = useState("");

  // Envio de Login para o Spring Boot
  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('http://localhost:8080/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ usuario, senha })
      });

      if (response.ok) {
        setIsLoggedIn(true);
      } else {
        alert("Usuário ou senha incorretos!");
      }
    } catch (error) {
      console.error(error);
      alert("Erro ao conectar com a API.");
    }
  };

  // Envio de URL para a Fila
  const handleEnviarMusica = async () => {
    if (!inputUrl) return;
    try {
      const response = await fetch('http://localhost:8080/api/admin/tocar', {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: inputUrl
      });
      
      if (response.ok) {
        setInputUrl(""); // Limpa o campo após o envio
        // Feedback visual simples para o usuário
        alert("Música enviada para a fila com sucesso!"); 
      }
    } catch (error) {
      console.error("Erro ao enviar para o Spring Boot:", error);
      alert("Erro ao conectar com o backend.");
    }
  };

  // --- TELA 1: LOGIN ---
  if (!isLoggedIn) {
    return (
      <div style={styles.container}>
        <div style={styles.bgImage} />
        <div style={styles.bgOverlay} />

        <div style={styles.glassCard}>
          <img src={logoApache} alt="Apache Gru Rock Bar" style={styles.logo} />
          <h2 style={styles.title}>Painel do DJ - Karaokê</h2>
          <span style={styles.subtitle}>APACHE GRU ROCK BAR</span>

          <form onSubmit={handleLogin} style={styles.form}>
            <div style={styles.inputPill}>
              <User size={17} color="#94A3B8" />
              <input 
                type="text" 
                placeholder="Usuário" 
                value={usuario} 
                onChange={(e) => setUsuario(e.target.value)} 
                style={styles.input}
                required
              />
            </div>

            <div style={styles.inputPill}>
              <Lock size={17} color="#94A3B8" />
              <input 
                type="password" 
                placeholder="Senha" 
                value={senha} 
                onChange={(e) => setSenha(e.target.value)} 
                style={styles.input}
                required
              />
            </div>

            <button type="submit" style={styles.buttonPrimary}>
              Entrar
            </button>
          </form>
        </div>
      </div>
    );
  }

  // --- TELA 2: GERENCIAMENTO DE FILA ---
  return (
    <div style={styles.container}>
      <div style={styles.bgImage} />
      <div style={styles.bgOverlay} />

      <div style={styles.glassCardDesktop}>
        <div style={styles.header}>
          <div style={styles.headerBrand}>
            <img src={logoApache} alt="Apache" style={styles.logoSmall} />
            <div>
              <h2 style={styles.titleLeft}>Gerenciar Fila</h2>
              <span style={styles.subtitleSmall}>APACHE GRU ROCK BAR • DJ</span>
            </div>
          </div>

          <button onClick={() => setIsLoggedIn(false)} style={styles.buttonLogout}>
            <LogOut size={14} />
            <span>Sair</span>
          </button>
        </div>
        
        <div style={styles.form}>
          <p style={styles.helperText}>
            Cole o link do YouTube abaixo para adicionar à fila da TV.
          </p>

          <div style={styles.inputPill}>
            <Link2 size={17} color="#94A3B8" />
            <input
              type="text"
              placeholder="Ex: https://www.youtube.com/watch?v=..."
              value={inputUrl}
              onChange={(e) => setInputUrl(e.target.value)}
              style={styles.input}
            />
          </div>

          <button onClick={handleEnviarMusica} style={styles.buttonSuccess}>
            <Send size={15} />
            <span>Enviar Música</span>
          </button>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100vh',
    width: '100vw',
    backgroundColor: '#0B0E14',
    fontFamily: "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif",
    margin: 0,
    padding: '24px',
    boxSizing: 'border-box',
    position: 'relative',
    overflow: 'hidden'
  },
  bgImage: {
    position: 'absolute',
    inset: '-20px',
    backgroundImage: `url(${fundoPalco})`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    filter: 'blur(7px) brightness(0.65)',
    transform: 'scale(1.04)',
    zIndex: 0
  },
  bgOverlay: {
    position: 'absolute',
    inset: 0,
    background: 'radial-gradient(circle at center, rgba(11, 14, 20, 0.35) 0%, rgba(11, 14, 20, 0.85) 100%)',
    zIndex: 0
  },
  glassCard: {
    position: 'relative',
    zIndex: 1,
    width: '100%',
    maxWidth: '430px',
    padding: '42px 36px',
    borderRadius: '28px',
    backgroundColor: 'rgba(15, 20, 30, 0.72)',
    backdropFilter: 'blur(18px)',
    WebkitBackdropFilter: 'blur(18px)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    boxShadow: '0 25px 60px rgba(0, 0, 0, 0.75)',
    textAlign: 'center',
    boxSizing: 'border-box'
  },
  glassCardDesktop: {
    position: 'relative',
    zIndex: 1,
    width: '100%',
    maxWidth: '580px',
    padding: '38px 40px',
    borderRadius: '28px',
    backgroundColor: 'rgba(15, 20, 30, 0.76)',
    backdropFilter: 'blur(18px)',
    WebkitBackdropFilter: 'blur(18px)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    boxShadow: '0 25px 60px rgba(0, 0, 0, 0.75)',
    boxSizing: 'border-box'
  },
  logo: {
    width: '74px',
    height: '74px',
    objectFit: 'contain',
    marginBottom: '12px'
  },
  logoSmall: {
    width: '40px',
    height: '40px',
    objectFit: 'contain'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: '20px',
    marginBottom: '22px',
    borderBottom: '1px solid rgba(255, 255, 255, 0.08)'
  },
  headerBrand: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px'
  },
  title: {
    color: '#FFFFFF',
    margin: 0,
    fontSize: '25px',
    fontWeight: '800',
    letterSpacing: '-0.3px'
  },
  titleLeft: {
    color: '#FFFFFF',
    margin: 0,
    fontSize: '20px',
    fontWeight: '800',
    letterSpacing: '-0.3px'
  },
  subtitle: {
    color: '#D91C24',
    fontSize: '10px',
    fontWeight: '700',
    letterSpacing: '2px',
    display: 'block',
    marginTop: '6px',
    marginBottom: '30px'
  },
  subtitleSmall: {
    color: '#D91C24',
    fontSize: '10px',
    fontWeight: '700',
    letterSpacing: '1.2px',
    display: 'block',
    marginTop: '2px'
  },
  helperText: {
    margin: '0 0 4px 0',
    color: '#CBD5E1',
    fontSize: '14px',
    textAlign: 'left',
    paddingLeft: '4px'
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '14px'
  },
  inputPill: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    backgroundColor: 'rgba(11, 14, 20, 0.65)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '999px',
    padding: '14px 20px'
  },
  input: {
    flex: 1,
    background: 'transparent',
    border: 'none',
    fontSize: '14px',
    color: '#FFFFFF',
    outline: 'none',
    minWidth: 0
  },
  buttonPrimary: {
    padding: '15px',
    fontSize: '14px',
    cursor: 'pointer',
    backgroundColor: '#D91C24',
    color: '#FFFFFF',
    border: 'none',
    borderRadius: '999px',
    fontWeight: '700',
    marginTop: '6px'
  },
  buttonSuccess: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    padding: '15px',
    fontSize: '14px',
    cursor: 'pointer',
    backgroundColor: '#D91C24',
    color: '#FFFFFF',
    border: 'none',
    borderRadius: '999px',
    fontWeight: '700',
    marginTop: '4px'
  },
  buttonLogout: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '8px 16px',
    fontSize: '12px',
    cursor: 'pointer',
    backgroundColor: 'rgba(217, 28, 36, 0.18)',
    border: '1px solid #D91C24',
    color: '#FCA5A5',
    borderRadius: '999px',
    fontWeight: '700'
  }
};

export default AdminPainel;