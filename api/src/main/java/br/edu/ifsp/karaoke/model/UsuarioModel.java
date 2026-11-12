package br.edu.ifsp.karaoke.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "usuario")
public class UsuarioModel {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_usuario")
    private Integer idUsuario;

    @Column(name = "nome", nullable = false, length = 120)
    private String nome;

    @Column(name = "email", length = 150, unique = true)
    private String email;

    @Column(name = "senha_hash", length = 255)
    private String senhaHash;

    @Column(name = "tipo_perfil", nullable = false,
            columnDefinition = "enum('visitante','cliente','admin')")
    private TipoPerfil tipoPerfil = TipoPerfil.VISITANTE;

    protected UsuarioModel() {
    }

    public boolean isAdmin() {
        return tipoPerfil == TipoPerfil.ADMIN;
    }

    public Integer getIdUsuario() {
        return idUsuario;
    }

    public String getNome() {
        return nome;
    }

    public String getEmail() {
        return email;
    }

    public TipoPerfil getTipoPerfil() {
        return tipoPerfil;
    }
}
