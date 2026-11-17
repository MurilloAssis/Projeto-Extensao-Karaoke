package br.edu.ifsp.karaoke.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.Arrays;
import java.util.List;

/** Origens autorizadas (React e Electron), lidas de CORS_ORIGINS. Valem para HTTP e WebSocket. */
@Configuration
public class CorsConfig {

    private final List<String> origens;

    public CorsConfig(@Value("${karaoke.cors.origens}") String origens) {
        this.origens = Arrays.stream(origens.split(","))
                .map(String::strip)
                .filter(origem -> !origem.isEmpty())
                .toList();
    }

    public String[] origens() {
        return origens.toArray(String[]::new);
    }

    @Bean
    CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuracao = new CorsConfiguration();
        configuracao.setAllowedOriginPatterns(origens);
        configuracao.setAllowedMethods(List.of("GET", "POST", "DELETE", "OPTIONS"));
        configuracao.setAllowedHeaders(List.of("*"));
        configuracao.setExposedHeaders(List.of("Location"));
        UrlBasedCorsConfigurationSource fonte = new UrlBasedCorsConfigurationSource();
        fonte.registerCorsConfiguration("/api/**", configuracao);
        return fonte;
    }
}
