package br.edu.ifsp.karaoke.dto.response;

import br.edu.ifsp.karaoke.model.UsuarioModel;
import com.fasterxml.jackson.annotation.JsonInclude;

@JsonInclude(JsonInclude.Include.NON_NULL)
public record UsuarioResumoResponse(Integer idUsuario, String nome) {

    public static UsuarioResumoResponse de(UsuarioModel usuario) {
        return new UsuarioResumoResponse(usuario.getIdUsuario(), usuario.getNome());
    }

    /** Telão: só o nome da chamada ao palco. */
    public static UsuarioResumoResponse soNome(UsuarioModel usuario) {
        return new UsuarioResumoResponse(null, usuario.getNome());
    }
}
