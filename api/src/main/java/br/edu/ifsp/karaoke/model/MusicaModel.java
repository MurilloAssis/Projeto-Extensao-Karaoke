package br.edu.ifsp.karaoke.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "musica")
public class MusicaModel {

    private static final String URL_YOUTUBE = "https://www.youtube.com/watch?v=";

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_musica")
    private Integer idMusica;

    @Column(name = "youtube_id", nullable = false, unique = true, columnDefinition = "char(11)")
    private String youtubeId;

    @Column(name = "titulo", nullable = false, length = 180)
    private String titulo;

    @Column(name = "artista", length = 120)
    private String artista;

    @Column(name = "disponivel", nullable = false)
    private boolean disponivel = true;

    protected MusicaModel() {
    }

    public MusicaModel(String youtubeId, String titulo) {
        this.youtubeId = youtubeId;
        this.titulo = titulo;
    }

    public String montarUrlVideo() {
        return URL_YOUTUBE + youtubeId;
    }

    public boolean validarDisponibilidade() {
        return disponivel;
    }

    public Integer getIdMusica() {
        return idMusica;
    }

    public String getYoutubeId() {
        return youtubeId;
    }

    public String getTitulo() {
        return titulo;
    }

    public String getArtista() {
        return artista;
    }
}
