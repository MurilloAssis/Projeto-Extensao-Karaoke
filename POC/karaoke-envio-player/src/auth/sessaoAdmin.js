import { useSyncExternalStore } from 'react';

// Até o card 1.2 (JWT), a API em perfil dev identifica o admin pelo cabeçalho X-Usuario-Id.
const CHAVE = 'apache_admin';
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

export function iniciarSessaoDesenvolvimento() {
  const idUsuario = Number(import.meta.env.VITE_ADMIN_ID_DEV ?? 1);
  gravar({ modo: 'provisorio', idUsuario });
}

export function encerrarSessao() {
  if (sessaoAtual) gravar(null);
}

export function cabecalhosIdentificacao() {
  if (!sessaoAtual) return {};
  return { 'X-Usuario-Id': String(sessaoAtual.idUsuario) };
}

function assinar(ouvinte) {
  ouvintes.add(ouvinte);
  return () => ouvintes.delete(ouvinte);
}

export function useSessaoAdmin() {
  return useSyncExternalStore(assinar, () => sessaoAtual);
}
