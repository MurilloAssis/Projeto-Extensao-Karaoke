package br.edu.ifsp.karaoke.security;

import br.edu.ifsp.karaoke.IntegracaoTest;
import br.edu.ifsp.karaoke.exception.RegraNegocioException;
import br.edu.ifsp.karaoke.service.SessaoService;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.web.servlet.MvcResult;

import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class AutenticacaoSessaoIntegracaoTest extends IntegracaoTest {

    private static final Pattern TOKEN = Pattern.compile("\\\"token\\\":\\\"([^\\\"]+)\\\"");
    private static final Pattern CODIGO = Pattern.compile("\\\"codigo\\\":\\\"(\\d{6})\\\"");
    private static final Pattern ID_SESSAO = Pattern.compile("\\\"idSessao\\\":\\\"([^\\\"]+)\\\"");

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private SessaoService sessaoService;

    private String idSessaoAberta;

    @AfterEach
    void encerrarSessaoAberta() {
        if (idSessaoAberta != null) {
            try {
                sessaoService.encerrar(idSessaoAberta);
            } catch (RegraNegocioException ignored) {
                // A sessão já foi encerrada pelo próprio cenário.
            }
        }
    }

    @Test
    void fluxoCompletoAdminSessaoEVisitante() throws Exception {
        criarAdminComSenha("admin@karaoke.local", "1234");

        String tokenAdmin = login("admin@karaoke.local", "1234");
        MvcResult abertura = mvc.perform(post("/api/sessoes")
                        .header("Authorization", bearer(tokenAdmin)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("aberta"))
                .andReturn();
        String corpoSessao = abertura.getResponse().getContentAsString();
        String codigo = extrair(CODIGO, corpoSessao);
        String idSessao = extrair(ID_SESSAO, corpoSessao);
        idSessaoAberta = idSessao;

        String tokenVisitante = visitante("Ana", codigo, 200);
        assertEquals(2, jdbc.queryForObject("select count(*) from usuario", Integer.class));

        mvc.perform(get("/api/fila/meus-pedidos")
                        .header("Authorization", bearer(tokenVisitante)))
                .andExpect(status().isOk());

        mvc.perform(post("/api/sessoes/{id}/encerrar", idSessao)
                        .header("Authorization", bearer(tokenAdmin)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("encerrada"));

        mvc.perform(get("/api/fila/meus-pedidos")
                        .header("Authorization", bearer(tokenVisitante)))
                .andExpect(status().isUnauthorized());
        visitante("Bruno", codigo, 404);
    }

    @Test
    void somenteAdminAutenticadoAbreEEncerraSessao() throws Exception {
        criarAdminComSenha("admin@karaoke.local", "1234");
        String admin = login("admin@karaoke.local", "1234");
        MvcResult abertura = mvc.perform(post("/api/sessoes").header("Authorization", bearer(admin)))
                .andExpect(status().isOk()).andReturn();
        idSessaoAberta = extrair(ID_SESSAO, abertura.getResponse().getContentAsString());

        mvc.perform(post("/api/sessoes")).andExpect(status().isUnauthorized());
        mvc.perform(post("/api/sessoes").header("Authorization", bearer(admin)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.codigo").value("SESSAO_JA_ABERTA"));

        String visitante = visitante("Ana", extrair(CODIGO, abertura.getResponse().getContentAsString()), 200);
        mvc.perform(post("/api/sessoes/{id}/encerrar",
                        extrair(ID_SESSAO, abertura.getResponse().getContentAsString()))
                        .header("Authorization", bearer(visitante)))
                .andExpect(status().isForbidden());
    }

    @Test
    void loginInvalidoNaoRevelaQualCredencialFalhou() throws Exception {
        criarAdminComSenha("admin@karaoke.local", "1234");
        mvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"admin@karaoke.local\",\"senha\":\"errada\"}"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.codigo").value("CREDENCIAIS_INVALIDAS"));
    }

    @Test
    void nomeOfensivoNaoCriaUsuario() throws Exception {
        criarAdminComSenha("admin@karaoke.local", "1234");
        String admin = login("admin@karaoke.local", "1234");
        MvcResult abertura = mvc.perform(post("/api/sessoes").header("Authorization", bearer(admin)))
                .andExpect(status().isOk()).andReturn();
        idSessaoAberta = extrair(ID_SESSAO, abertura.getResponse().getContentAsString());
        int antes = jdbc.queryForObject("select count(*) from usuario", Integer.class);

        mvc.perform(post("/api/auth/visitante")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"nome\":\"João Cuzão\",\"codigoSessao\":\"%s\"}"
                                .formatted(extrair(CODIGO, abertura.getResponse().getContentAsString()))))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.codigo").value("NOME_INADEQUADO"));
        assertEquals(antes, jdbc.queryForObject("select count(*) from usuario", Integer.class));
    }

    private int criarAdminComSenha(String email, String senha) {
        return inserir("usuario", "id_usuario", Map.of(
                "nome", "Organizador",
                "email", email,
                "senha_hash", passwordEncoder.encode(senha),
                "tipo_perfil", "admin"));
    }

    private String login(String email, String senha) throws Exception {
        MvcResult resultado = mvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"%s\",\"senha\":\"%s\"}".formatted(email, senha)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.tipo").value("Bearer"))
                .andExpect(jsonPath("$.perfil").value("admin"))
                .andReturn();
        return extrair(TOKEN, resultado.getResponse().getContentAsString());
    }

    private String visitante(String nome, String codigo, int statusEsperado) throws Exception {
        MvcResult resultado = mvc.perform(post("/api/auth/visitante")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"nome\":\"%s\",\"codigoSessao\":\"%s\"}".formatted(nome, codigo)))
                .andExpect(status().is(statusEsperado))
                .andReturn();
        return statusEsperado == 200 ? extrair(TOKEN, resultado.getResponse().getContentAsString()) : null;
    }

    private static String bearer(String token) {
        return "Bearer " + token;
    }

    private static String extrair(Pattern padrao, String corpo) {
        Matcher matcher = padrao.matcher(corpo);
        if (!matcher.find()) {
            throw new AssertionError("Campo não encontrado na resposta: " + corpo);
        }
        return matcher.group(1);
    }
}
