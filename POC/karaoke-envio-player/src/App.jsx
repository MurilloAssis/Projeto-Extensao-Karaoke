import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ClienteEntrada } from './pages/ClienteEntrada';
import { ClientePainel } from './pages/ClientePainel';
import { AdminLogin } from './pages/admin/AdminLogin';
import { AdminPainel } from './pages/admin/AdminPainel';
import { RotaAdmin } from './auth/RotaAdmin';
import { RotaCliente } from './auth/RotaCliente';

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/cliente" replace />} />
        <Route path="/cliente" element={<ClienteEntrada />} />
        <Route
          path="/cliente/painel"
          element={
            <RotaCliente>
              <ClientePainel />
            </RotaCliente>
          }
        />

        {/* Painel do DJ */}
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route
          path="/admin"
          element={
            <RotaAdmin>
              <AdminPainel />
            </RotaAdmin>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;