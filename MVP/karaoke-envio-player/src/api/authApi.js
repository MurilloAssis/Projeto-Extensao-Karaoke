import { requisitar } from './http';

export const authApi = {
  login: (email, senha) => requisitar('/api/auth/login', { method: 'POST', corpo: { email, senha } }),
  visitante: (nome, codigoSessao) =>
    requisitar('/api/auth/visitante', { method: 'POST', corpo: { nome, codigoSessao } }),
};
