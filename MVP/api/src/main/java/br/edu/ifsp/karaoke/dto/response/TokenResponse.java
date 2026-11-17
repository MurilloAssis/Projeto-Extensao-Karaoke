package br.edu.ifsp.karaoke.dto.response;

import br.edu.ifsp.karaoke.model.TipoPerfil;

import java.time.Instant;

public record TokenResponse(
        String token,
        String tipo,
        Instant expiraEm,
        Integer idUsuario,
        String nome,
        TipoPerfil perfil) {
}
