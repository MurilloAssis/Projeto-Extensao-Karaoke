import { authApi } from '../api/authApi';
import { ErroApi } from '../api/http';
import { criarSessaoArmazenada } from './armazenamento';

const sessao = criarSessaoArmazenada('apache_admin');

export async function entrarAdmin(email, senha) {
  const resposta = await authApi.login(email.trim(), senha);
  if (resposta.perfil !== 'admin') throw new ErroApi(403, 'RN03_ACESSO_NEGADO');
  sessao.gravar({ token: resposta.token, expiraEm: resposta.expiraEm, nome: resposta.nome });
}

export const encerrarSessao = sessao.limpar;
export const cabecalhosIdentificacao = sessao.cabecalhos;
export const useSessaoAdmin = sessao.useSessao;
