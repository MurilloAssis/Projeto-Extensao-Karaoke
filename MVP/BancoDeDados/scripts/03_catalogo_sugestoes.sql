SET NAMES utf8mb4;

USE karaoke_apache;

-- Catálogo inicial de músicas sugeridas (vídeos reais do YouTube), listado por GET /api/musicas.
-- Pode rodar de novo num banco que já existe: completa o artista e ajusta a disponibilidade,
-- sem mudar o título de músicas que os clientes já pediram.
-- disponivel = FALSE: vídeo removido ou bloqueado no YouTube (não aparece nas sugestões; pedido recusado por RN00).
INSERT INTO musica (youtube_id, titulo, artista, disponivel) VALUES
    ('ePjtnSPFWK8', 'Evidências',          'Chitãozinho & Xororó', TRUE),
    ('fJ9rUzIMcZQ', 'Bohemian Rhapsody',   'Queen',                TRUE),
    ('a658W4K8j10', 'Tempo Perdido',       'Legião Urbana',        FALSE),
    ('1w7OgIMMRc4', 'Sweet Child O'' Mine', 'Guns N'' Roses',       TRUE),
    ('umj0gu5nEGs', 'Anna Júlia',          'Los Hermanos',         FALSE),
    ('8w6X-t9F47Q', 'Mulher de Fases',     'Raimundos',            TRUE),
    ('6M4_Ommfvv0', 'Garota Nacional',     'Skank',                TRUE),
    ('903hL2X033w', 'Cheia de Manias',     'Raça Negra',           TRUE)
AS novo
ON DUPLICATE KEY UPDATE
    artista    = COALESCE(musica.artista, novo.artista),
    disponivel = novo.disponivel;

-- Versões karaokê: 20 primeiras da playlist "Classic Rock Karaoke" do YouTube
-- (https://www.youtube.com/playlist?list=PLdZzClTcgSlUnaDOeYrxtOF33CNYc6Iq4).
INSERT INTO musica (youtube_id, titulo, artista, disponivel) VALUES
    ('uhiamj_I7II', 'Sweet Child O'' Mine (Karaokê)',        'Guns N'' Roses',               TRUE),
    ('7GyxwQHNfYQ', 'Tears in Heaven (Karaokê)',             'Eric Clapton',                 TRUE),
    ('cJ-tBdK2d0k', 'The House of the Rising Sun (Karaokê)', 'The Animals',                  TRUE),
    ('k7aQR_2UHL0', 'Hotel California (Karaokê)',            'Eagles',                       TRUE),
    ('wshbS_lz1dE', 'Imagine (Karaokê)',                     'John Lennon',                  TRUE),
    ('cZrsZC7fD3I', 'Have You Ever Seen the Rain (Karaokê)', 'Creedence Clearwater Revival', TRUE),
    ('sJIqPmf_8w4', 'Yesterday (Karaokê)',                   'The Beatles',                  TRUE),
    ('Ilg-zmkICJ0', 'Wonderful Tonight (Karaokê)',           'Eric Clapton',                 TRUE),
    ('AEce22afpbU', 'Under the Bridge (Karaokê)',            'Red Hot Chili Peppers',        TRUE),
    ('I_B-pwD-rLw', 'Simple Man (Karaokê)',                  'Lynyrd Skynyrd',               TRUE),
    ('58soUmYN2dI', 'Dust in the Wind (Karaokê)',            'Kansas',                       TRUE),
    ('blikQus8IQ4', 'We Will Rock You (Karaokê)',            'Queen',                        TRUE),
    ('7K9UEh1eoAs', 'I Want to Know What Love Is (Karaokê)', 'Foreigner',                    TRUE),
    ('lZiQKDcosto', 'You Are So Beautiful (Karaokê)',        'Joe Cocker',                   TRUE),
    ('guMBaddcmQk', 'Imagine (Karaokê sem voz)',             'John Lennon',                  TRUE),
    ('oVbXpK_BRbw', 'Bohemian Rhapsody (Karaokê)',           'Queen',                        TRUE),
    ('TLCQT2F4PT4', 'Livin'' on a Prayer (Karaokê)',         'Bon Jovi',                     TRUE),
    ('q2UpIZ8h0Zo', 'Highway to Hell (Karaokê)',             'AC/DC',                        TRUE),
    ('NqL0ry_HRnQ', 'Hotel California (Karaokê, versão 2)',  'Eagles',                       TRUE),
    ('Z3mg4Pcf_GI', 'Every Rose Has Its Thorn (Karaokê)',    'Poison',                       TRUE)
AS novo
ON DUPLICATE KEY UPDATE
    artista = COALESCE(musica.artista, novo.artista);
