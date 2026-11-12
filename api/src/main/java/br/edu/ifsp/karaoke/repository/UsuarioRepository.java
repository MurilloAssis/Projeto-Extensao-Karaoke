package br.edu.ifsp.karaoke.repository;

import br.edu.ifsp.karaoke.model.UsuarioModel;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;

import java.util.Optional;

public interface UsuarioRepository extends JpaRepository<UsuarioModel, Integer> {

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select u from UsuarioModel u where u.idUsuario = :id")
    Optional<UsuarioModel> travarPorId(Integer id);
}
