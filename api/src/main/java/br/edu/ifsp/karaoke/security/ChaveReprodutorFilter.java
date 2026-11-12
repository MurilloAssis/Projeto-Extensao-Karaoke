package br.edu.ifsp.karaoke.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.List;

/** Identifica o Karaokê TV Player (Electron) pela chave X-Player-Key. */
public class ChaveReprodutorFilter extends OncePerRequestFilter {

    public static final String CABECALHO = "X-Player-Key";

    private final byte[] chave;

    public ChaveReprodutorFilter(String chave) {
        this.chave = chave == null ? new byte[0] : chave.getBytes(StandardCharsets.UTF_8);
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {
        String recebida = request.getHeader(CABECALHO);
        if (chave.length > 0 && recebida != null
                && MessageDigest.isEqual(chave, recebida.getBytes(StandardCharsets.UTF_8))) {
            var autenticacao = UsernamePasswordAuthenticationToken.authenticated("reprodutor", null,
                    List.of(new SimpleGrantedAuthority("ROLE_REPRODUTOR")));
            SecurityContextHolder.getContext().setAuthentication(autenticacao);
        }
        chain.doFilter(request, response);
    }
}
