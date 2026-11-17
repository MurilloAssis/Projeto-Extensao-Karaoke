# Karaokê TV Player (Electron)

Telão do Apache Gru: vídeo do pedido em reprodução no centro, fila com os nomes dos cantores, "Próximo Rockstar"
e o QR Code da sessão aberta.

## Como funciona

- Ouve `/topic/fila-atualizada` e `/topic/sessao-atualizada` (STOMP em `<API_URL>/ws`).
- A cada aviso de fila, lê `GET /api/fila/telao` (com `X-Player-Key`), que traz o nome de quem vai cantar.
- A cada aviso de sessão, lê `GET /api/sessoes/atual` e monta o QR Code `<CLIENTE_URL>/cliente?sessao=<código>`.
- Quando o DJ aperta Play, mostra "Suba ao Palco" com o nome e a música e, em seguida, abre o vídeo.
- No fim do vídeo, volta para a tela de descanso e chama `POST /api/fila/{idFila}/concluir`. O próximo **não** começa
  sozinho: o telão mostra "Próximo: <nome>" até o DJ apertar Play.
- O autoplay do YouTube é bloqueado (outro vídeo na tela conta como fim do pedido) e o fim de anúncio é ignorado.

## Rodar

Com o ambiente no ar (`docker compose up -d --build` na raiz do repositório):

```bash
npm install
cp config.example.json config.json
npm start
```

`config.json` fica fora do Git. Cada item também pode vir de variável de ambiente, que tem prioridade.

| Item | Padrão | Uso |
|---|---|---|
| `API_URL` | `http://localhost:8080` | endereço da API |
| `PLAYER_API_KEY` | — | chave do telão (igual à `PLAYER_API_KEY` da API; `teste` em desenvolvimento) |
| `CLIENTE_URL` | `http://localhost:5174` | base do link do QR Code; para celular, use o endereço do túnel |
| `TELA_CHEIA` | `false` | `true` no telão do bar |
| `DEVTOOLS` | `false` | abre o DevTools do layout e do vídeo |
| `LOGIN_YOUTUBE` | `true` | pede o login do YouTube Premium ao abrir, se não houver |
| `ANUNCIO_MS` | `4000` | duração do "Suba ao Palco" antes do vídeo |

## YouTube Premium

Sem login salvo, abre a janela do Google ao iniciar. O login fica guardado (partição `persist:youtube_apache`).
**F2** ou **Ctrl+L** abre a janela de novo para trocar de conta.

## Log

- No terminal onde rodou `npm start`.
- Em arquivo: `%APPDATA%\electrontvplayer\logs\karaoke-telao.log`.
