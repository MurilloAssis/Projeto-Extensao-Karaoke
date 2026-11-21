# Karaokê Apache — API Orquestradora

Java 21 + Spring Boot 4.1 + MySQL 8. A API roda sobre o banco criado pelos scripts de
[`../BancoDeDados`](../BancoDeDados/README.md) e não cria nem altera tabelas (`ddl-auto=validate`).

## Arquitetura em camadas

Cada camada só usa a camada abaixo dela: `controller` → `service` → `repository` → `model`.

```
br.edu.ifsp.karaoke
├── controller/           Apresentação: endpoints REST
│   └── handler/          Tradução de exceções em respostas de erro (ProblemDetail)
├── service/              Negócio: regras RN00–RN04 e transações
├── repository/           Persistência: acesso ao MySQL (Spring Data JPA)
├── model/                Domínio: entidades e enums do dicionário de dados
│   └── converter/        Conversão dos enums para os valores do banco
├── dto/
│   ├── request/          Dados recebidos pelos endpoints
│   └── response/         Dados devolvidos pelos endpoints
├── event/                Eventos da fila e da sessão; envio de fila-atualizada e sessao-atualizada (WebSocket)
├── exception/            Exceções de negócio e códigos de erro
├── security/             Identificação do usuário e do reprodutor
└── config/               Configuração do Spring (segurança, CORS, WebSocket, relógio, OpenAPI)
```

## Rodar tudo no Docker

Na raiz do repositório (`docker-compose.yml` sobe o MySQL com os scripts de `MVP/BancoDeDados/`, a API e o front):

```bash
cp .env.example .env          # ajuste as senhas
docker compose up -d --build
```

- API: `http://localhost:8080` (perfil `dev` por padrão, `PLAYER_API_KEY=teste`)
- MySQL: `localhost:3307` (porta diferente para não conflitar com um MySQL instalado na máquina)
- Logs: `docker compose logs -f api`
- Parar: `docker compose down` · apagar o banco e recriar: `docker compose down -v`
- Depois de mudar o código: `docker compose up -d --build api`

## Rodar localmente

1. Crie o banco com `MVP/BancoDeDados/scripts/01_criar_banco.sql`
   (inclua `02_dados_desenvolvimento.sql` em dev).
2. Defina as variáveis de ambiente (modelo em `.env.example`):

| Variável | Padrão | Uso |
|---|---|---|
| `DB_URL` | `jdbc:mysql://localhost:3306/karaoke_apache?connectionTimeZone=UTC` | conexão |
| `DB_USER` / `DB_PASSWORD` | `karaoke_app` / vazio | credenciais |
| `KARAOKE_LIMITE_PEDIDOS` | `2` | RN02 |
| `PLAYER_API_KEY` | `teste` | chave do Karaokê TV Player (defina um valor forte em produção) |
| `JWT_SECRET` | sem padrão | assinatura dos tokens; mínimo de 32 caracteres |
| `JWT_VALIDITY_MINUTES` | `480` | duração do token JWT |
| `CORS_ORIGINS` | `http://localhost:5173` | origens do React/Electron, separadas por vírgula (HTTP e WebSocket) |
| `YOUTUBE_API_KEY` | sem padrão | chave da YouTube Data API v3; usada somente quando o catálogo local não encontra o título |

3. Suba no perfil `dev`:

```bash
./mvnw spring-boot:run -Dspring-boot.run.profiles=dev
```

- Saúde: `GET http://localhost:8080/actuator/health`
- Swagger: `http://localhost:8080/swagger-ui.html`

## Autenticação e sessão de karaokê

O administrador faz login, abre uma sessão e divulga o código de seis dígitos no QR Code/telão.
Cada cliente informa esse código e o nome da chamada ao palco. As rotas identificadas recebem
`Authorization: Bearer <token>`.

```bash
curl -X POST localhost:8080/api/auth/login -H "Content-Type: application/json" \
     -d '{"email":"admin@karaoke.local","senha":"1234"}'
# Use o token retornado:
curl -X POST localhost:8080/api/sessoes -H "Authorization: Bearer <token-admin>"
# Use o código retornado:
curl -X POST localhost:8080/api/auth/visitante -H "Content-Type: application/json" \
     -d '{"nome":"Ana","codigoSessao":"123456"}'
```

O ingresso rejeita nomes inadequados antes de criar o visitante. Encerrar a sessão invalida os tokens
dos visitantes ligados a ela e impede novos ingressos; a limpeza da fila continua sendo uma ação explícita do admin.
A sessão é mantida em memória pela API. Ao reiniciar a aplicação, o admin precisa abrir uma nova sessão e o código
anterior deixa de aceitar ingressos.

## Endpoints

| Método | Rota | Acesso |
|---|---|---|
| POST | `/api/auth/login` | público (credenciais de admin) |
| POST | `/api/auth/visitante` | público (nome + código de sessão) |
| POST | `/api/sessoes` | admin |
| POST | `/api/sessoes/{idSessao}/encerrar` | admin |
| GET | `/api/sessoes/atual` | admin, reprodutor (`X-Player-Key`); 204 = sem sessão |
| GET | `/api/musicas?q=&pagina=0&tamanho=20` | visitante, cliente, admin; sugestões do catálogo, paginadas |
| GET | `/api/musicas/busca?q=termo` | visitante, cliente, admin; cache MySQL com fallback para YouTube |
| POST | `/api/fila` | visitante, cliente |
| GET | `/api/fila` | público |
| GET | `/api/fila/atual` | público (204 = telão em espera) |
| GET | `/api/fila/meus-pedidos` | visitante, cliente |
| GET | `/api/fila/admin` | admin |
| GET | `/api/fila/telao` | reprodutor (`X-Player-Key`); fila com o nome de quem canta |
| POST | `/api/fila/play` | admin |
| POST | `/api/fila/proxima` | admin |
| DELETE | `/api/fila/{idFila}` | admin |
| DELETE | `/api/fila` | admin (limpar) |
| POST | `/api/fila/{idFila}/concluir` | reprodutor (`X-Player-Key`); só conclui, o próximo começa com Play |

Erros seguem o formato ProblemDetail com o campo `codigo` (ex.: `RN01_MUSICA_JA_NA_FILA`).

## Tempo real (WebSocket/STOMP)

Comandos vão sempre por HTTP. Depois de cada alteração salva, a API avisa **todas** as telas
pelo evento `fila-atualizada` (Seção 4.5 do documento).

- Endpoint: `ws://localhost:8080/ws` (`wss://` em produção), STOMP sem SockJS
- Tópico: `/topic/fila-atualizada` (público, somente leitura; envio de mensagens pelas telas é recusado)
- Tópico: `/topic/sessao-atualizada` (público): `{evento, status: "aberta"|"encerrada", emitidoEm}`, sem o código; consulte `GET /api/sessoes/atual`
- Heartbeat: 10 s

```json
{
  "evento": "fila-atualizada",
  "motivo": "PROXIMA",
  "idFila": 12,
  "versao": 37,
  "emitidoEm": "2026-11-12T23:41:05.312Z",
  "fila": { "atual": { "...": "igual a GET /api/fila" }, "proximos": [], "total": 0 }
}
```

`motivo`: `PEDIDO_ADICIONADO`, `REPRODUCAO_INICIADA`, `PROXIMA`, `PEDIDO_REMOVIDO`, `FILA_LIMPA`, `PEDIDO_CONCLUIDO`.
`fila` é a visão pública (sem nomes). O Admin Web busca `GET /api/fila/admin` ao receber o aviso; o Cliente Web,
`GET /api/fila/meus-pedidos`.

Exemplo com [`@stomp/stompjs`](https://www.npmjs.com/package/@stomp/stompjs):

```js
import { Client } from '@stomp/stompjs';

let ultimaVersao = 0;
const cliente = new Client({
  brokerURL: 'ws://localhost:8080/ws',
  reconnectDelay: 3000,
  heartbeatIncoming: 10000,
  heartbeatOutgoing: 10000,
});
cliente.onConnect = async () => {
  ultimaVersao = 0;
  atualizarTela(await (await fetch('http://localhost:8080/api/fila')).json()); // estado ao (re)conectar
  cliente.subscribe('/topic/fila-atualizada', frame => {
    const msg = JSON.parse(frame.body);
    if (msg.versao <= ultimaVersao) return; // descarta mensagem antiga
    ultimaVersao = msg.versao;
    atualizarTela(msg.fila);
  });
};
cliente.activate();
```

A origem da tela precisa estar em `CORS_ORIGINS`.

**Monitor (perfil `dev`):** `http://localhost:8080/dev/monitor-fila.html` mostra a fila e cada mensagem
recebida, com versão, motivo e atraso. Útil junto com a collection do Postman. Fora do perfil `dev`, a página não existe.

## Collection Postman

[`postman/karaoke-card-1.3.postman_collection.json`](postman/karaoke-card-1.3.postman_collection.json):
roda o login, a abertura/encerramento da sessão, o ingresso dos visitantes e os testes existentes de pedidos,
consultas, controle de palco
(RN03/RN04) e o aviso de fim de vídeo do reprodutor.

1. Banco com `01_criar_banco.sql` e `02_dados_desenvolvimento.sql` aplicados, nessa ordem.
2. API no perfil `dev` com `PLAYER_API_KEY=teste` e `JWT_SECRET` definido.
3. No Postman: **Import** → arquivo da collection → **Run collection**, na ordem.

A coleção obtém e guarda os tokens automaticamente. A senha dev do admin é `1234`.
Pela linha de comando: `npx newman run postman/karaoke-card-1.3.postman_collection.json`.

## Testes

Precisam do Docker em execução: o Testcontainers sobe um MySQL 8.4 descartável criado com o mesmo
esquema do script `01`, sem tocar no banco local.

```bash
./mvnw test
```
