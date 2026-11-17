package br.edu.ifsp.karaoke.dto.response;

import br.edu.ifsp.karaoke.model.MusicaModel;
import com.fasterxml.jackson.annotation.JsonInclude;

@JsonInclude(JsonInclude.Include.NON_NULL)
public record MusicaResponse(
        Integer idMusica,
        String youtubeId,
        String titulo,
        String artista,
        String urlVideo) {

    public static MusicaResponse de(MusicaModel musica) {
        return new MusicaResponse(musica.getIdMusica(), musica.getYoutubeId(), musica.getTitulo(),
                musica.getArtista(), musica.montarUrlVideo());
    }
}
