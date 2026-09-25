import { useState } from 'react';

function App() {
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
        <div style={styles.card}>
          <h2 style={styles.title}>Painel do DJ - Karaokê</h2>
          <form onSubmit={handleLogin} style={styles.form}>
            <input 
              type="text" 
              placeholder="Usuário" 
              value={usuario} 
              onChange={(e) => setUsuario(e.target.value)} 
              style={styles.input}
              required
            />
            <input 
              type="password" 
              placeholder="Senha" 
              value={senha} 
              onChange={(e) => setSenha(e.target.value)} 
              style={styles.input}
              required
            />
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
      <div style={styles.card}>
        <div style={styles.header}>
          <h2 style={styles.title}>Gerenciar Fila</h2>
          <button onClick={() => setIsLoggedIn(false)} style={styles.buttonLogout}>Sair</button>
        </div>
        
        <div style={styles.form}>
          <p style={{ margin: '0 0 10px 0', color: '#ccc' }}>
            Cole o link do YouTube abaixo para adicionar à fila da TV.
          </p>
          <input
            type="text"
            placeholder="Ex: https://www.youtube.com/watch?v=..."
            value={inputUrl}
            onChange={(e) => setInputUrl(e.target.value)}
            style={styles.input}
          />
          <button onClick={handleEnviarMusica} style={styles.buttonSuccess}>
            Enviar Música
          </button>
        </div>
      </div>
    </div>
  );
}

// Objeto de estilos para manter o código limpo e centralizado
const styles = {
  container: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100vh',
    width: '100vw',
    backgroundColor: '#1e1e1e',
    fontFamily: 'sans-serif',
    margin: 0
  },
  card: {
    backgroundColor: '#333',
    padding: '30px',
    borderRadius: '8px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
    width: '100%',
    maxWidth: '400px',
    boxSizing: 'border-box'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px'
  },
  title: {
    color: '#fff',
    margin: 0,
    fontSize: '1.5rem'
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '15px'
  },
  input: {
    padding: '12px',
    fontSize: '16px',
    borderRadius: '4px',
    border: '1px solid #555',
    backgroundColor: '#222',
    color: '#fff',
    outline: 'none'
  },
  buttonPrimary: {
    padding: '12px',
    fontSize: '16px',
    cursor: 'pointer',
    backgroundColor: '#007BFF',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    fontWeight: 'bold'
  },
  buttonSuccess: {
    padding: '12px',
    fontSize: '16px',
    cursor: 'pointer',
    backgroundColor: '#4CAF50',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    fontWeight: 'bold'
  },
  buttonLogout: {
    padding: '6px 12px',
    fontSize: '14px',
    cursor: 'pointer',
    backgroundColor: '#dc3545',
    color: 'white',
    border: 'none',
    borderRadius: '4px'
  }
};

export default App;