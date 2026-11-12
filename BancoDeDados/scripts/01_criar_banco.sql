CREATE DATABASE IF NOT EXISTS karaoke_apache
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_0900_ai_ci;

USE karaoke_apache;

CREATE TABLE IF NOT EXISTS usuario (
    id_usuario   INT          NOT NULL AUTO_INCREMENT,
    nome         VARCHAR(120) NOT NULL,
    email        VARCHAR(150) NULL,
    senha_hash   VARCHAR(255) NULL,
    tipo_perfil  ENUM('visitante', 'cliente', 'admin') NOT NULL DEFAULT 'visitante',

    CONSTRAINT pk_usuario PRIMARY KEY (id_usuario),
    CONSTRAINT uq_usuario_email UNIQUE (email)
) ENGINE = InnoDB;

CREATE TABLE IF NOT EXISTS musica (
    id_musica   INT          NOT NULL AUTO_INCREMENT,
    -- ascii_bin: o videoId do YouTube diferencia maiúsculas de minúsculas
    youtube_id  CHAR(11)     CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
    titulo      VARCHAR(180) NOT NULL,
    artista     VARCHAR(120) NULL,
    disponivel  BOOLEAN      NOT NULL DEFAULT TRUE,

    CONSTRAINT pk_musica PRIMARY KEY (id_musica),
    CONSTRAINT uq_musica_youtube_id UNIQUE (youtube_id)
) ENGINE = InnoDB;

CREATE TABLE IF NOT EXISTS fila (
    id_fila     INT      NOT NULL AUTO_INCREMENT,
    id_usuario  INT      NOT NULL,
    id_musica   INT      NOT NULL,
    status      ENUM('na_fila', 'reproduzindo', 'concluido', 'cancelado') NOT NULL DEFAULT 'na_fila',
    dt_pedido   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT pk_fila PRIMARY KEY (id_fila),
    CONSTRAINT fk_fila_usuario FOREIGN KEY (id_usuario) REFERENCES usuario (id_usuario),
    CONSTRAINT fk_fila_musica  FOREIGN KEY (id_musica)  REFERENCES musica (id_musica),

    INDEX idx_fila_status_dt_pedido (status, dt_pedido, id_fila),
    INDEX idx_fila_usuario_status (id_usuario, status),
    INDEX idx_fila_musica_status (id_musica, status)
) ENGINE = InnoDB;

-- Fora do escopo do MVP
CREATE TABLE IF NOT EXISTS letra (
    id_letra        INT         NOT NULL AUTO_INCREMENT,
    id_musica       INT         NOT NULL,
    conteudo_letra  TEXT        NOT NULL,
    idioma          VARCHAR(20) NOT NULL DEFAULT 'pt-BR',

    CONSTRAINT pk_letra PRIMARY KEY (id_letra),
    CONSTRAINT fk_letra_musica FOREIGN KEY (id_musica) REFERENCES musica (id_musica)
) ENGINE = InnoDB;
