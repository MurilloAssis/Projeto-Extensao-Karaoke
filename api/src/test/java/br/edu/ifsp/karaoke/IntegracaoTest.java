package br.edu.ifsp.karaoke;

import br.edu.ifsp.karaoke.security.IdentificacaoProvisoriaFilter;
import org.junit.jupiter.api.BeforeEach;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.simple.SimpleJdbcInsert;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;

import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.time.temporal.ChronoUnit;
import java.util.HashMap;
import java.util.Map;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Import(TestcontainersConfiguration.class)
public abstract class IntegracaoTest {

    @Autowired
    protected MockMvc mvc;

    @Autowired
    protected JdbcTemplate jdbc;

    private int sequenciaEmail;

    @BeforeEach
    void limparBanco() {
        jdbc.update("delete from fila");
        jdbc.update("delete from musica");
        jdbc.update("delete from usuario");
    }

    protected int criarUsuario(String nome, String perfil) {
        Map<String, Object> valores = new HashMap<>();
        valores.put("nome", nome);
        valores.put("tipo_perfil", perfil);
        if (!perfil.equals("visitante")) {
            valores.put("email", "usuario" + (++sequenciaEmail) + "@teste.local");
        }
        return inserir("usuario", "id_usuario", valores);
    }

    protected int criarVisitante(String nome) {
        return criarUsuario(nome, "visitante");
    }

    protected int criarAdmin() {
        return criarUsuario("Organizador", "admin");
    }

    protected int criarMusica(String youtubeId, String titulo, boolean disponivel) {
        return inserir("musica", "id_musica",
                Map.of("youtube_id", youtubeId, "titulo", titulo, "disponivel", disponivel));
    }

    protected int criarPedido(int idUsuario, int idMusica, String status, LocalDateTime dtPedido) {
        return inserir("fila", "id_fila", Map.of("id_usuario", idUsuario, "id_musica", idMusica,
                "status", status, "dt_pedido", dtPedido));
    }

    protected LocalDateTime agora() {
        return LocalDateTime.now(ZoneOffset.UTC).truncatedTo(ChronoUnit.SECONDS);
    }

    protected String statusDe(int idFila) {
        return jdbc.queryForObject("select status from fila where id_fila = ?", String.class, idFila);
    }

    protected ResultActions pedir(int idUsuario, String videoId, String titulo) throws Exception {
        return mvc.perform(post("/api/fila")
                .header(IdentificacaoProvisoriaFilter.CABECALHO, idUsuario)
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"videoId\":\"%s\",\"titulo\":\"%s\"}".formatted(videoId, titulo)));
    }

    private int inserir(String tabela, String chave, Map<String, Object> valores) {
        return new SimpleJdbcInsert(jdbc).withTableName(tabela).usingGeneratedKeyColumns(chave)
                .executeAndReturnKey(valores).intValue();
    }
}
