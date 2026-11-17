import { requisitar } from './http';
import { identidadeCliente } from '../auth/sessaoCliente';

export const LIMITE_PEDIDOS = Number(import.meta.env.VITE_LIMITE_PEDIDOS ?? 2);

export const clienteApi = {
  fila: () => requisitar('/api/fila'),
  // Sugestões do catálogo cadastrado na API (até a busca no YouTube, card 2.1).
  musicas: (termo, pagina, tamanho) => {
    const consulta = new URLSearchParams({ pagina: String(pagina), tamanho: String(tamanho) });
    if (termo) consulta.set('q', termo);
    return requisitar(`/api/musicas?${consulta}`, { identidade: identidadeCliente });
  },
  meusPedidos: () => requisitar('/api/fila/meus-pedidos', { identidade: identidadeCliente }),
  pedir: (videoId, titulo) =>
    requisitar('/api/fila', { method: 'POST', corpo: { videoId, titulo }, identidade: identidadeCliente }),

  // Fila pública + pedidos ativos do cliente, lidos juntos a cada atualização.
  painel: async () => {
    const [fila, meusPedidos] = await Promise.all([clienteApi.fila(), clienteApi.meusPedidos()]);
    return { fila, meusPedidos };
  },
};
