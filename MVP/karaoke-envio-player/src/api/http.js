import { mensagemDoErro } from './mensagens';

// Vazio = mesmo endereço da página (proxy do Vite em dev).
export const API_URL = import.meta.env.VITE_API_URL ?? '';

export class ErroApi extends Error {
  constructor(status, codigo, detalhe) {
    super(mensagemDoErro(codigo, detalhe));
    this.status = status;
    this.codigo = codigo;
  }
}

function lerJson(texto) {
  try {
    return texto ? JSON.parse(texto) : null;
  } catch {
    return null;
  }
}

/**
 * `identidade` (opcional): { cabecalhos(): object, aoNaoAutorizado(): void },
 * fornecida pela sessão de quem chama (admin ou cliente).
 */
export async function requisitar(caminho, { method = 'GET', corpo, identidade } = {}) {
  let resposta;
  try {
    resposta = await fetch(`${API_URL}${caminho}`, {
      method,
      headers: {
        Accept: 'application/json',
        ...(corpo !== undefined ? { 'Content-Type': 'application/json' } : {}),
        ...(identidade?.cabecalhos() ?? {}),
      },
      body: corpo !== undefined ? JSON.stringify(corpo) : undefined,
    });
  } catch {
    throw new ErroApi(0, 'SEM_CONEXAO');
  }

  const dados = lerJson(await resposta.text());

  if (!resposta.ok) {
    if (resposta.status === 401) identidade?.aoNaoAutorizado();
    throw new ErroApi(resposta.status, dados?.codigo ?? 'ERRO_INTERNO', dados?.detail);
  }
  return dados;
}
