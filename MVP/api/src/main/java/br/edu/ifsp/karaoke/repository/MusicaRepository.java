package br.edu.ifsp.karaoke.repository;

import br.edu.ifsp.karaoke.model.MusicaModel;
import jakarta.persistence.LockModeType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface MusicaRepository extends JpaRepository<MusicaModel, Integer> {

    /**
     * Sugestões do catálogo: só músicas disponíveis (RN00), filtradas por título ou artista.
     * {@code padrao} nulo traz todas; a collation do banco ignora maiúsculas e acentos.
     */
    @Query("""
            select m from MusicaModel m
            where m.disponivel = true
              and (:padrao is null or m.titulo like :padrao escape '!' or m.artista like :padrao escape '!')
            """)
    Page<MusicaModel> buscarSugestoes(@Param("padrao") String padrao, Pageable pagina);

    Optional<MusicaModel> findByYoutubeId(String youtubeId);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select m from MusicaModel m where m.idMusica = :id")
    Optional<MusicaModel> travarPorId(Integer id);
}
