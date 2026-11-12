package br.edu.ifsp.karaoke.repository;

import br.edu.ifsp.karaoke.model.FilaModel;
import br.edu.ifsp.karaoke.model.MusicaModel;
import br.edu.ifsp.karaoke.model.StatusPedido;
import br.edu.ifsp.karaoke.model.UsuarioModel;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface FilaRepository extends JpaRepository<FilaModel, Integer> {

    boolean existsByMusicaAndStatusIn(MusicaModel musica, Collection<StatusPedido> status);

    long countByUsuarioAndStatusIn(UsuarioModel usuario, Collection<StatusPedido> status);

    Optional<FilaModel> findFirstByStatusOrderByDtPedidoAscIdFilaAsc(StatusPedido status);

    List<FilaModel> findByStatusOrderByDtPedidoAscIdFilaAsc(StatusPedido status);

    @Query("""
            select f from FilaModel f join fetch f.musica join fetch f.usuario
            where f.status in :status
            order by f.dtPedido, f.idFila""")
    List<FilaModel> buscarComDetalhes(Collection<StatusPedido> status);

    @Query("""
            select f from FilaModel f join fetch f.musica join fetch f.usuario
            where f.usuario.idUsuario = :idUsuario and f.status in :status
            order by f.dtPedido, f.idFila""")
    List<FilaModel> buscarDoUsuario(Integer idUsuario, Collection<StatusPedido> status);

    /** Posição FIFO = pedidos na fila que chegaram antes + 1 (Seção 4.3). */
    @Query("""
            select count(f) + 1 from FilaModel f
            where f.status = br.edu.ifsp.karaoke.model.StatusPedido.NA_FILA
              and (f.dtPedido < :dtPedido or (f.dtPedido = :dtPedido and f.idFila < :idFila))""")
    long calcularPosicao(LocalDateTime dtPedido, Integer idFila);
}
