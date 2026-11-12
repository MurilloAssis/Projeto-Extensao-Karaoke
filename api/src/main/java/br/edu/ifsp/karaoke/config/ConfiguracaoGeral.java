package br.edu.ifsp.karaoke.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.time.Clock;

@Configuration
public class ConfiguracaoGeral {

    @Bean
    Clock relogio() {
        return Clock.systemUTC();
    }

    @Bean
    OpenAPI documentacao() {
        return new OpenAPI().info(new Info()
                .title("Karaokê Apache — API Orquestradora")
                .version("MVP"));
    }
}
