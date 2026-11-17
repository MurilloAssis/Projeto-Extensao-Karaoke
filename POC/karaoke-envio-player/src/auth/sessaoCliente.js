import { useSyncExternalStore } from 'react';

// Até o card 1.2 (POST /api/auth/visitante), o cliente usa um visitante dos dados de
// desenvolvimento, identificado pelo cabeçalho X-Usuario-Id (perfil dev da API).
const CHAVE = 'apache_cliente';
const ouvintes = new Set();

function ler() {
  try {
    const texto = sessionStorage.getItem(CHAVE);
    return texto ? JSON.parse(texto) : null;
  } catch {
    return null;
  }
}

let sessaoAtual = ler();

function gravar(sessao) {
  try {
    if (sessao) sessionStorage.setItem(CHAVE, JSON.stringify(sessao));
    else sessionStorage.removeItem(CHAVE);
  } catch {
    // sem sessionStorage a sessão vale só enquanto a página estiver aberta
  }
  sessaoAtual = sessao;
  ouvintes.forEach((ouvinte) => ouvinte());
}

/** `idVisitante` permite testar com outro visitante (ex.: /cliente?visitante=3). */
export function iniciarSessaoCliente(nome, idVisitante) {
  const idUsuario = Number(idVisitante || import.meta.env.VITE_VISITANTE_ID_DEV || 2);
  gravar({ modo: 'provisorio', idUsuario, nome });
}

export function encerrarSessaoCliente() {
  if (sessaoAtual) gravar(null);
}

export const identidadeCliente = {
  cabecalhos: () => (sessaoAtual ? { 'X-Usuario-Id': String(sessaoAtual.idUsuario) } : {}),
  aoNaoAutorizado: encerrarSessaoCliente,
};

function assinar(ouvinte) {
  ouvintes.add(ouvinte);
  return () => ouvintes.delete(ouvinte);
}

export function useSessaoCliente() {
  return useSyncExternalStore(assinar, () => sessaoAtual);
}
