package br.edu.ifsp.karaoke.security;

import br.edu.ifsp.karaoke.model.TipoPerfil;

/** Usuário da requisição. O card de autenticação passa a montá-lo a partir do JWT. */
public record UsuarioAutenticado(Integer idUsuario, String nome, TipoPerfil perfil) {
}
