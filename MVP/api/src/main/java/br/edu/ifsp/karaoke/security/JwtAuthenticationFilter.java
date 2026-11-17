package br.edu.ifsp.karaoke.security;

import br.edu.ifsp.karaoke.model.TipoPerfil;
import br.edu.ifsp.karaoke.repository.UsuarioRepository;
import br.edu.ifsp.karaoke.service.SessaoService;
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

public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private static final String PREFIXO = "Bearer ";

    private final JwtService jwtService;
    private final UsuarioRepository usuarioRepository;
    private final SessaoService sessaoService;

    public JwtAuthenticationFilter(JwtService jwtService,
                                   UsuarioRepository usuarioRepository,
                                   SessaoService sessaoService) {
        this.jwtService = jwtService;
        this.usuarioRepository = usuarioRepository;
        this.sessaoService = sessaoService;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {
        String cabecalho = request.getHeader("Authorization");
        if (cabecalho != null && cabecalho.startsWith(PREFIXO)) {
            jwtService.validar(cabecalho.substring(PREFIXO.length()))
                    .filter(this::sessaoValida)
                    .flatMap(claims -> usuarioRepository.findById(claims.idUsuario())
                            .filter(usuario -> usuario.getTipoPerfil() == claims.perfil()))
                    .ifPresent(usuario -> {
                        UsuarioAutenticado principal = new UsuarioAutenticado(
                                usuario.getIdUsuario(), usuario.getNome(), usuario.getTipoPerfil());
                        var autenticacao = new UsernamePasswordAuthenticationToken(principal, null,
                                List.of(new SimpleGrantedAuthority(usuario.getTipoPerfil().getRole())));
                        SecurityContextHolder.getContext().setAuthentication(autenticacao);
                    });
        }
        chain.doFilter(request, response);
    }

    private boolean sessaoValida(JwtService.Claims claims) {
        if (claims.perfil() != TipoPerfil.VISITANTE) {
            return true;
        }
        if (claims.idSessao() == null) {
            return false;
        }
        return sessaoService.estaAberta(claims.idSessao());
    }
}
