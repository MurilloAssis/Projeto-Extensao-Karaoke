package br.edu.ifsp.karaoke;

import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.context.annotation.Bean;
import org.testcontainers.mysql.MySQLContainer;
import org.testcontainers.utility.DockerImageName;
import org.testcontainers.utility.MountableFile;

import java.nio.file.Path;

/** MySQL descartável criado com o mesmo script do banco real (BancoDeDados/scripts). */
@TestConfiguration(proxyBeanMethods = false)
public class TestcontainersConfiguration {

    private static final Path SCRIPT = Path.of("..", "BancoDeDados", "scripts", "01_criar_banco.sql");

    static final MySQLContainer MYSQL = new MySQLContainer(DockerImageName.parse("mysql:8.4"))
            .withDatabaseName("karaoke_apache")
            .withCopyFileToContainer(MountableFile.forHostPath(SCRIPT), "/docker-entrypoint-initdb.d/01_criar_banco.sql")
            .withCommand("--default-time-zone=+00:00");

    @Bean
    @ServiceConnection
    MySQLContainer mysqlContainer() {
        return MYSQL;
    }
}
