const MENSAGENS = {
  SEM_CONEXAO: 'Não foi possível falar com o servidor. Tente de novo.',
  ERRO_INTERNO: 'Não foi possível falar com o servidor. Tente de novo.',
  VALIDACAO: 'Verifique os dados informados.',
  NAO_IDENTIFICADO: 'Sua sessão expirou. Entre novamente.',
  RN03_ACESSO_NEGADO: 'Apenas o organizador pode fazer isso.',
  PEDIDO_NAO_ENCONTRADO: 'Esse pedido não está mais na fila.',
  RN00_MUSICA_INDISPONIVEL: 'Esta música não está disponível.',
  RN01_MUSICA_JA_NA_FILA: 'Esta música já está na fila.',
  RN04_JA_REPRODUZINDO: 'Já existe uma música tocando.',
  RN04_FILA_VAZIA: 'A fila está vazia.',
  RN04_NADA_REPRODUZINDO: 'Nenhuma música está tocando.',
  RN04_PEDIDO_NAO_REMOVIVEL: 'Esse pedido já está tocando. Use Próxima música.',
};

export function mensagemDoErro(codigo, detalhe) {
  return MENSAGENS[codigo] ?? detalhe ?? MENSAGENS.ERRO_INTERNO;
}
