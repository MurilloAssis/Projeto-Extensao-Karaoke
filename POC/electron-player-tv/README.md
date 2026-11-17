# Karaokê TV Player (Electron)

Abre no telão o vídeo da música em reprodução e avisa a API quando ele termina.

- Ouve `/topic/fila-atualizada` (STOMP em `<API_URL>/ws`) e, ao abrir/reconectar, busca `GET /api/fila/atual`.
- Só troca o vídeo quando o pedido em reprodução (`idFila`) muda; sem música, mostra a tela de espera.
- No fim do vídeo chama `POST /api/fila/{idFila}/concluir` com `X-Player-Key`; a API promove o próximo.

## Rodar

Com a API no ar (`docker compose up -d` na raiz do repositório):

```bash
npm install
```

Configuração em `config.json` (fora do Git; copie de `config.example.json`). A versão de teste usa
`PLAYER_API_KEY = teste`, o mesmo valor do `.env` da raiz:

```bash
cp config.example.json config.json
npm start
```

Cada item também pode vir de variável de ambiente, que tem prioridade sobre o `config.json`
(ex.: `$env:PLAYER_API_KEY = "..."; npm start` no PowerShell). A `PLAYER_API_KEY` precisa ser igual à da API;
fora do teste, use um valor longo e aleatório nos dois lados.

| Item | Padrão | Uso |
|---|---|---|
| `API_URL` | `http://localhost:8080` | endereço da API |
| `PLAYER_API_KEY` | — | chave do reprodutor (obrigatória para avisar o fim do vídeo) |
| `TELA_CHEIA` | `false` | `true` no telão do bar |
| `DEVTOOLS` | `false` | `true` abre o DevTools da página (console do YouTube/preload) |

## Comportamento no fim do vídeo

- Ao terminar o vídeo do pedido, o telão sai do YouTube na hora (tela de espera) e avisa a API; o autoplay do YouTube não chega a tocar.
- Se o YouTube abrir outro vídeo enquanto o pedido toca, o telão trata como fim do pedido.
- Fim de anúncio não conta como fim da música.
- Se a API recusar a chave (`401`) ou estiver fora do ar, a tela de espera mostra o aviso; o DJ avança com Próxima música.
- O player entra na tela cheia do próprio YouTube, com os controles (pausar, barra de tempo, volume) funcionando.

## Log

- No terminal onde rodou `npm start`.
- Em arquivo: `%APPDATA%\electron-tv-player\logs\karaoke-player.log` (útil no telão, quando não há terminal à vista).

O log mostra a conexão, cada `fila-atualizada`, o vídeo aberto, o fim do vídeo e a resposta do `concluir`.
