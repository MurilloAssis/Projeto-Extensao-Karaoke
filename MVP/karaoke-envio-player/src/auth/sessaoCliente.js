import { authApi } from '../api/authApi';
import { criarSessaoArmazenada, recado } from './armazenamento';

const sessao = criarSessaoArmazenada('apache_cliente');
const RECADO = 'apache_cliente_recado';

export async function entrarCliente(nome, codigoSessao) {
  const resposta = await authApi.visitante(nome, codigoSessao);
  sessao.gravar({ token: resposta.token, expiraEm: resposta.expiraEm, nome: resposta.nome, codigoSessao });
}

export const encerrarSessaoCliente = sessao.limpar;
export const useSessaoCliente = sessao.useSessao;

/** Aviso exibido na entrada quando o painel perde o acesso (sessão encerrada, API reiniciada). */
export const lerRecadoCliente = () => recado.ler(RECADO);

export const identidadeCliente = {
  cabecalhos: sessao.cabecalhos,
  aoNaoAutorizado: () => {
    if (!sessao.ler()) return;
    recado.deixar(RECADO, 'A sessão do karaokê terminou. Entre de novo com o código do telão.');
    sessao.limpar();
  },
};
