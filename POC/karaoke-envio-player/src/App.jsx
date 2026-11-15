import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ClienteEntrada } from './pages/ClienteEntrada';
import { AdminPainel } from './pages/AdminPainel';

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/cliente" replace />} />
        <Route path="/cliente" element={<ClienteEntrada />} />
        
        {/* Tela cliente logado (posteriromente Card 2.3) */}
        <Route 
          path="/cliente/painel" 
          element={
            <div style={{ backgroundColor: '#0B0E14', color: '#FFF', minHeight: '100vh', padding: '24px', fontFamily: 'sans-serif' }}>
              <h2>Bem-vindo ao Karaokê, {sessionStorage.getItem('apache_cantor')}!</h2>
              <p style={{ color: '#94A3B8' }}>Sessão ativa: {sessionStorage.getItem('apache_sessao')}</p>
            </div>
          } 
        />

        {/* Painel do DJ */}
        <Route path="/admin" element={<AdminPainel />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;