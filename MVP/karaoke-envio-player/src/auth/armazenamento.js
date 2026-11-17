import { useSyncExternalStore } from 'react';

function lerChave(chave) {
  try {
    const texto = sessionStorage.getItem(chave);
    return texto ? JSON.parse(texto) : null;
  } catch {
    return null;
  }
}

function gravarChave(chave, valor) {
  try {
    if (valor) sessionStorage.setItem(chave, JSON.stringify(valor));
    else sessionStorage.removeItem(chave);
  } catch {
    // sem sessionStorage o valor vale só enquanto a página estiver aberta
  }
}

const vencido = (sessao) => Boolean(sessao?.expiraEm) && Date.parse(sessao.expiraEm) <= Date.now();

/** Login guardado na aba (token JWT da API), com assinatura para o React. */
export function criarSessaoArmazenada(chave) {
  const ouvintes = new Set();
  let atual = lerChave(chave);
  if (vencido(atual)) {
    atual = null;
    gravarChave(chave, null);
  }

  const gravar = (sessao) => {
    gravarChave(chave, sessao);
    atual = sessao;
    ouvintes.forEach((ouvinte) => ouvinte());
  };

  const assinar = (ouvinte) => {
    ouvintes.add(ouvinte);
    return () => ouvintes.delete(ouvinte);
  };

  return {
    ler: () => atual,
    gravar,
    limpar: () => {
      if (atual) gravar(null);
    },
    cabecalhos: () => (atual && !vencido(atual) ? { Authorization: `Bearer ${atual.token}` } : {}),
    useSessao: () => useSyncExternalStore(assinar, () => atual),
  };
}

/** Recado de uma tela para a próxima (ex.: motivo de ter saído do painel). */
export const recado = {
  deixar: (chave, texto) => gravarChave(chave, { texto }),
  ler: (chave) => {
    const valor = lerChave(chave);
    gravarChave(chave, null);
    return valor?.texto ?? '';
  },
};
