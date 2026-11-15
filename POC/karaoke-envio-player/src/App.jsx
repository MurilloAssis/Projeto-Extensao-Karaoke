import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ClienteEntrada } from './pages/ClienteEntrada';
import { ClientePainel } from './pages/ClientePainel';
import { AdminPainel } from './pages/AdminPainel';

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/cliente" replace />} />
        <Route path="/cliente" element={<ClienteEntrada />} />
        <Route path="/cliente/painel" element={<ClientePainel />} />

        {/* Painel do DJ */}
        <Route path="/admin" element={<AdminPainel />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;