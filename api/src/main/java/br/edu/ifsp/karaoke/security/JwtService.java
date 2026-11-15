package br.edu.ifsp.karaoke.security;

import br.edu.ifsp.karaoke.model.TipoPerfil;
import br.edu.ifsp.karaoke.model.UsuarioModel;
import com.auth0.jwt.JWT;
import com.auth0.jwt.JWTVerifier;
import com.auth0.jwt.algorithms.Algorithm;
import com.auth0.jwt.exceptions.JWTVerificationException;
import com.auth0.jwt.interfaces.DecodedJWT;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.Optional;

@Service
public class JwtService {

    private static final String EMISSOR = "karaoke-api";

    private final Algorithm algoritmo;
    private final JWTVerifier verificador;
    private final Clock relogio;
    private final Duration validade;

    public JwtService(@Value("${karaoke.jwt.segredo}") String segredo,
                      @Value("${karaoke.jwt.validade-minutos:480}") long validadeMinutos,
                      Clock relogio) {
        if (segredo == null || segredo.length() < 32) {
            throw new IllegalArgumentException("JWT_SECRET deve ter pelo menos 32 caracteres.");
        }
        this.algoritmo = Algorithm.HMAC256(segredo);
        this.verificador = JWT.require(algoritmo).withIssuer(EMISSOR).build();
        this.relogio = relogio;
        this.validade = Duration.ofMinutes(validadeMinutos);
    }

    public TokenEmitido emitir(UsuarioModel usuario, String idSessao) {
        Instant emitidoEm = relogio.instant();
        Instant expiraEm = emitidoEm.plus(validade);
        var construtor = JWT.create()
                .withIssuer(EMISSOR)
                .withSubject(usuario.getIdUsuario().toString())
                .withClaim("perfil", usuario.getTipoPerfil().getValor())
                .withIssuedAt(emitidoEm)
                .withExpiresAt(expiraEm);
        if (idSessao != null) {
            construtor.withClaim("sessao", idSessao);
        }
        return new TokenEmitido(construtor.sign(algoritmo), expiraEm);
    }

    public Optional<Claims> validar(String token) {
        try {
            DecodedJWT jwt = verificador.verify(token);
            int idUsuario = Integer.parseInt(jwt.getSubject());
            TipoPerfil perfil = TipoPerfil.deValor(jwt.getClaim("perfil").asString());
            String idSessao = jwt.getClaim("sessao").isNull() ? null : jwt.getClaim("sessao").asString();
            return Optional.of(new Claims(idUsuario, perfil, idSessao));
        } catch (JWTVerificationException | IllegalArgumentException e) {
            return Optional.empty();
        }
    }

    public record TokenEmitido(String valor, Instant expiraEm) {
    }

    public record Claims(Integer idUsuario, TipoPerfil perfil, String idSessao) {
    }
}
