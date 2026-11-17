import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { Lock, Mail, AlertCircle } from 'lucide-react';
import logoApache from '../../assets/logo-apache.png';
import { entrarAdmin, useSessaoAdmin } from '../../auth/sessaoAdmin';
import { cores, estilos } from './estilosAdmin';

export function AdminLogin() {
  const navigate = useNavigate();
  const sessao = useSessaoAdmin();
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState('');
  const [entrando, setEntrando] = useState(false);

  if (sessao && !entrando) return <Navigate to="/admin" replace />;

  const handleEntrar = async (e) => {
    e.preventDefault();
    if (!email.trim() || !senha) {
      setErro('Informe o e-mail e a senha.');
      return;
    }
    setErro('');
    setEntrando(true);
    try {
      await entrarAdmin(email, senha);
      navigate('/admin', { replace: true });
    } catch (falha) {
      setErro(falha.message);
      setEntrando(false);
    }
  };

  return (
    <div style={estilos.container}>
      <div style={estilos.bgImage} />
      <div style={estilos.bgOverlay} />

      <div style={estilos.glassCard}>
        <img src={logoApache} alt="Apache Gru Rock Bar" style={estilos.logo} />
        <h2 style={estilos.title}>Painel do DJ - Karaokê</h2>
        <span style={estilos.subtitle}>APACHE GRU ROCK BAR</span>


        <form onSubmit={handleEntrar} style={estilos.form}>
          <div style={estilos.inputPill}>
            <Mail size={17} color={cores.apoioSuave} />
            <input
              type="email"
              placeholder="E-mail"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={estilos.input}
              autoComplete="username"
            />
          </div>

          <div style={estilos.inputPill}>
            <Lock size={17} color={cores.apoioSuave} />
            <input
              type="password"
              placeholder="Senha"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              style={estilos.input}
              autoComplete="current-password"
            />
          </div>

          {erro && (
            <div style={estilos.errorBox}>
              <AlertCircle size={14} color={cores.vermelho} style={{ flexShrink: 0 }} />
              <span>{erro}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={entrando}
            style={{ ...estilos.buttonPrimary, ...(entrando ? { opacity: 0.7, cursor: 'wait' } : {}) }}
          >
            {entrando ? 'Entrando…' : 'Entrar'}
          </button>
        </form>
      </div>
    </div>
  );
}
