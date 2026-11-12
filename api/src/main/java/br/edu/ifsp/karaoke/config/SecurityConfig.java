package br.edu.ifsp.karaoke.config;

import br.edu.ifsp.karaoke.repository.UsuarioRepository;
import br.edu.ifsp.karaoke.security.ChaveReprodutorFilter;
import br.edu.ifsp.karaoke.security.IdentificacaoProvisoriaFilter;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.env.Environment;
import org.springframework.core.env.Profiles;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.provisioning.InMemoryUserDetailsManager;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.AnonymousAuthenticationFilter;
import org.springframework.web.servlet.HandlerExceptionResolver;

import static org.springframework.http.HttpMethod.DELETE;
import static org.springframework.http.HttpMethod.GET;
import static org.springframework.http.HttpMethod.POST;

@Configuration
public class SecurityConfig {

    private static final String ADMIN = "ADMIN";
    private static final String[] CLIENTES = {"VISITANTE", "CLIENTE"};

    @Bean
    SecurityFilterChain filtros(HttpSecurity http,
                                Environment ambiente,
                                UsuarioRepository usuarioRepository,
                                @Value("${karaoke.reprodutor.chave:}") String chaveReprodutor,
                                @Qualifier("handlerExceptionResolver") HandlerExceptionResolver resolvedorErros)
            throws Exception {
        boolean perfilDev = ambiente.acceptsProfiles(Profiles.of("dev"));
        http
                .cors(Customizer.withDefaults())
                .csrf(AbstractHttpConfigurer::disable)
                .httpBasic(AbstractHttpConfigurer::disable)
                .formLogin(AbstractHttpConfigurer::disable)
                .logout(AbstractHttpConfigurer::disable)
                .sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(rotas -> {
                    if (perfilDev) {
                        rotas.requestMatchers(GET, "/dev/**").permitAll();
                    }
                    rotas
                        .requestMatchers(GET, WebSocketConfig.ENDPOINT).permitAll()
                        .requestMatchers(GET, "/api/fila", "/api/fila/atual").permitAll()
                        .requestMatchers(GET, "/api/fila/admin").hasRole(ADMIN)
                        .requestMatchers(GET, "/api/fila/meus-pedidos").hasAnyRole(CLIENTES)
                        .requestMatchers(POST, "/api/fila").hasAnyRole(CLIENTES)
                        .requestMatchers(POST, "/api/fila/play", "/api/fila/proxima").hasRole(ADMIN)
                        .requestMatchers(POST, "/api/fila/*/concluir").hasRole("REPRODUTOR")
                        .requestMatchers(DELETE, "/api/fila", "/api/fila/*").hasRole(ADMIN)
                        .requestMatchers("/actuator/health", "/swagger-ui.html", "/swagger-ui/**",
                                "/v3/api-docs/**", "/error").permitAll()
                        .anyRequest().denyAll();
                })
                .exceptionHandling(erros -> erros
                        .authenticationEntryPoint((req, res, e) -> resolvedorErros.resolveException(req, res, null, e))
                        .accessDeniedHandler((req, res, e) -> resolvedorErros.resolveException(req, res, null, e)))
                .addFilterBefore(new ChaveReprodutorFilter(chaveReprodutor), AnonymousAuthenticationFilter.class);

        if (ambiente.acceptsProfiles(Profiles.of("dev", "test"))) {
            http.addFilterBefore(new IdentificacaoProvisoriaFilter(usuarioRepository),
                    AnonymousAuthenticationFilter.class);
        }
        return http.build();
    }

    /** Evita o usuário/senha padrão gerado pelo Spring Boot. */
    @Bean
    UserDetailsService semUsuariosEmMemoria() {
        return new InMemoryUserDetailsManager();
    }
}
