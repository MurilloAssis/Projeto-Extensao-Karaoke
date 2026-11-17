package br.edu.ifsp.karaoke.model;

import br.edu.ifsp.karaoke.exception.TransicaoInvalidaException;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

import java.time.LocalDateTime;

@Entity
@Table(name = "fila")
public class FilaModel {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_fila")
    private Integer idFila;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "id_usuario", nullable = false)
    private UsuarioModel usuario;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "id_musica", nullable = false)
    private MusicaModel musica;

    @Column(name = "status", nullable = false,
            columnDefinition = "enum('na_fila','reproduzindo','concluido','cancelado')")
    private StatusPedido status = StatusPedido.NA_FILA;

    /** Data e hora do pedido em UTC; define a ordem FIFO. */
    @Column(name = "dt_pedido", nullable = false)
    private LocalDateTime dtPedido;

    protected FilaModel() {
    }

    public FilaModel(UsuarioModel usuario, MusicaModel musica, LocalDateTime dtPedido) {
        this.usuario = usuario;
        this.musica = musica;
        this.dtPedido = dtPedido;
    }

    public void iniciarReproducao() {
        transicionar(StatusPedido.NA_FILA, StatusPedido.REPRODUZINDO);
    }

    public void concluir() {
        transicionar(StatusPedido.REPRODUZINDO, StatusPedido.CONCLUIDO);
    }

    public void cancelar() {
        transicionar(StatusPedido.NA_FILA, StatusPedido.CANCELADO);
    }

    private void transicionar(StatusPedido esperado, StatusPedido novo) {
        if (status != esperado) {
            throw new TransicaoInvalidaException(idFila, status, novo);
        }
        status = novo;
    }

    public Integer getIdFila() {
        return idFila;
    }

    public UsuarioModel getUsuario() {
        return usuario;
    }

    public MusicaModel getMusica() {
        return musica;
    }

    public StatusPedido getStatus() {
        return status;
    }

    public LocalDateTime getDtPedido() {
        return dtPedido;
    }
}
