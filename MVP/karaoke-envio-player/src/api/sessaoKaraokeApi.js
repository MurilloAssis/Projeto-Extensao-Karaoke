import { requisitar } from './http';
import { cabecalhosIdentificacao, encerrarSessao } from '../auth/sessaoAdmin';

const admin = { cabecalhos: cabecalhosIdentificacao, aoNaoAutorizado: encerrarSessao };

/** Sessão do karaokê (código de 6 dígitos que os clientes usam para entrar). */
export const sessaoKaraokeApi = {
  atual: () => requisitar('/api/sessoes/atual', { identidade: admin }), // null = nenhuma aberta (204)
  abrir: () => requisitar('/api/sessoes', { method: 'POST', identidade: admin }),
  encerrar: (idSessao) => requisitar(`/api/sessoes/${idSessao}/encerrar`, { method: 'POST', identidade: admin }),
};
