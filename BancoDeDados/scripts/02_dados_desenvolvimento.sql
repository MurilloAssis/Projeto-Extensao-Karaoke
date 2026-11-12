USE karaoke_apache;

INSERT INTO usuario (id_usuario, nome, email, senha_hash, tipo_perfil) VALUES
    (1, 'Organizador', 'admin@karaoke.local', '1234', 'admin'),
    (2, 'Ana',         NULL,                  NULL, 'visitante'),
    (3, 'Bruno',       NULL,                  NULL, 'visitante'),
    (4, 'Carla',       NULL,                  NULL, 'visitante');

INSERT INTO musica (id_musica, youtube_id, titulo, artista, disponivel) VALUES
    (1, 'DEVTESTE001', 'Still Loving You (Karaokê)', 'Scorpions',     TRUE),
    (2, 'DEVTESTE002', 'Oh! Darling (Karaokê)',      'The Beatles',   TRUE),
    (3, 'DEVTESTE003', 'Tempo Perdido (Karaokê)',    'Legião Urbana', TRUE),
    (4, 'DEVTESTE004', 'Pais e Filhos (Karaokê)',    'Legião Urbana', TRUE),
    (5, 'DEVTESTE005', 'Música Indisponível (RN00)', NULL,            FALSE);
