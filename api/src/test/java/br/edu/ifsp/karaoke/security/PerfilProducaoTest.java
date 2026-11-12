package br.edu.ifsp.karaoke.security;

import br.edu.ifsp.karaoke.IntegracaoTest;
import org.junit.jupiter.api.Test;
import org.springframework.test.context.ActiveProfiles;

import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/** Fora de dev/test, a identificação provisória por X-Usuario-Id não pode funcionar. */
@ActiveProfiles(value = "prod", inheritProfiles = false)
class PerfilProducaoTest extends IntegracaoTest {

    @Test
    void cabecalhoProvisorioEIgnorado() throws Exception {
        pedir(criarVisitante("Ana"), "aaaaaaaaaa1", "Música").andExpect(status().isUnauthorized());
    }
}
