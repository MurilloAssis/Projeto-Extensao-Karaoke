package br.edu.ifsp.karaoke.security;

import br.edu.ifsp.karaoke.repository.UsuarioRepository;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;

/**
 * PROVISÓRIO, só nos perfis dev e test: identifica o usuário pelo cabeçalho X-Usuario-Id.
 * Será substituído pelo filtro de JWT no card de autenticação.
 */
public class IdentificacaoProvisoriaFilter extends OncePerRequestFilter {

    public static final String CABECALHO = "X-Usuario-Id";

    private final UsuarioRepository usuarioRepository;

    public IdentificacaoProvisoriaFilter(UsuarioRepository usuarioRepository) {
        this.usuarioRepository = usuarioRepository;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {
        String valor = request.getHeader(CABECALHO);
        if (valor != null && valor.matches("\\d{1,9}")) {
            usuarioRepository.findById(Integer.valueOf(valor)).ifPresent(usuario -> {
                var principal = new UsuarioAutenticado(usuario.getIdUsuario(), usuario.getNome(), usuario.getTipoPerfil());
                var autenticacao = UsernamePasswordAuthenticationToken.authenticated(principal, null,
                        List.of(new SimpleGrantedAuthority(usuario.getTipoPerfil().getRole())));
                SecurityContextHolder.getContext().setAuthentication(autenticacao);
            });
        }
        chain.doFilter(request, response);
    }
}
