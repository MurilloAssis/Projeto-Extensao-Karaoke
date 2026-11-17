import { requisitar } from './http';
import { cabecalhosIdentificacao, encerrarSessao } from '../auth/sessaoAdmin';

const admin = { cabecalhos: cabecalhosIdentificacao, aoNaoAutorizado: encerrarSessao };

export const filaApi = {
  admin: () => requisitar('/api/fila/admin', { identidade: admin }),
  play: () => requisitar('/api/fila/play', { method: 'POST', identidade: admin }),
  proxima: () => requisitar('/api/fila/proxima', { method: 'POST', identidade: admin }),
  remover: (idFila) => requisitar(`/api/fila/${idFila}`, { method: 'DELETE', identidade: admin }),
  limpar: () => requisitar('/api/fila', { method: 'DELETE', identidade: admin }),
};
