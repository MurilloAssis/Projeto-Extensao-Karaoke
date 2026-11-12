package br.edu.ifsp.karaoke.dto.response;

import br.edu.ifsp.karaoke.model.UsuarioModel;

public record UsuarioResumoResponse(Integer idUsuario, String nome) {

    public static UsuarioResumoResponse de(UsuarioModel usuario) {
        return new UsuarioResumoResponse(usuario.getIdUsuario(), usuario.getNome());
    }
}
