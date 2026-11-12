package br.edu.ifsp.karaoke.repository;

import br.edu.ifsp.karaoke.model.MusicaModel;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;

import java.util.Optional;

public interface MusicaRepository extends JpaRepository<MusicaModel, Integer> {

    Optional<MusicaModel> findByYoutubeId(String youtubeId);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select m from MusicaModel m where m.idMusica = :id")
    Optional<MusicaModel> travarPorId(Integer id);
}
