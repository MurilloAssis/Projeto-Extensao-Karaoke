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
├── event/                Eventos de alteração da fila e envio de fila-atualizada (WebSocket)
├── exception/            Exceções de negócio e códigos de erro
├── security/             Identificação do usuário e do reprodutor
└── config/               Configuração do Spring (segurança, CORS, WebSocket, relógio, OpenAPI)
```

## Rodar tudo no Docker

Na raiz do repositório (`docker-compose.yml` sobe o MySQL com os scripts de `BancoDeDados/` e a API):

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

1. Crie o banco com `BancoDeDados/scripts/01_criar_banco.sql` (e `02_dados_desenvolvimento.sql` em dev).
2. Defina as variáveis de ambiente (modelo em `.env.example`):

| Variável | Padrão | Uso |
|---|---|---|
| `DB_URL` | `jdbc:mysql://localhost:3306/karaoke_apache?connectionTimeZone=UTC` | conexão |
| `DB_USER` / `DB_PASSWORD` | `karaoke_app` / vazio | credenciais |
| `KARAOKE_LIMITE_PEDIDOS` | `2` | RN02 |
| `PLAYER_API_KEY` | `teste` | chave do Karaokê TV Player (defina um valor forte em produção) |
| `CORS_ORIGINS` | `http://localhost:5173` | origens do React/Electron, separadas por vírgula (HTTP e WebSocket) |

3. Suba no perfil `dev`:

```bash
./mvnw spring-boot:run -Dspring-boot.run.profiles=dev
```

- Saúde: `GET http://localhost:8080/actuator/health`
- Swagger: `http://localhost:8080/swagger-ui.html`

## Identificação provisória (até o card de autenticação)

Nos perfis `dev` e `test`, o usuário é identificado pelo cabeçalho `X-Usuario-Id`.
Com os dados de desenvolvimento: `1` = admin, `2`–`4` = visitantes. Fora desses perfis, o cabeçalho é ignorado.

```bash
curl -X POST localhost:8080/api/fila -H "X-Usuario-Id: 2" -H "Content-Type: application/json" \
     -d '{"videoId":"DEVTESTE001","titulo":"Still Loving You (Karaokê)"}'
curl -X POST localhost:8080/api/fila/play -H "X-Usuario-Id: 1"
curl localhost:8080/api/fila
```

## Endpoints da fila

| Método | Rota | Acesso |
|---|---|---|
| POST | `/api/fila` | visitante, cliente |
| GET | `/api/fila` | público |
| GET | `/api/fila/atual` | público (204 = telão em espera) |
| GET | `/api/fila/meus-pedidos` | visitante, cliente |
| GET | `/api/fila/admin` | admin |
| POST | `/api/fila/play` | admin |
| POST | `/api/fila/proxima` | admin |
| DELETE | `/api/fila/{idFila}` | admin |
| DELETE | `/api/fila` | admin (limpar) |
| POST | `/api/fila/{idFila}/concluir` | reprodutor (`X-Player-Key`) |

Erros seguem o formato ProblemDetail com o campo `codigo` (ex.: `RN01_MUSICA_JA_NA_FILA`).

## Tempo real (WebSocket/STOMP)

Comandos vão sempre por HTTP. Depois de cada alteração salva, a API avisa **todas** as telas
pelo evento `fila-atualizada` (Seção 4.5 do documento).

- Endpoint: `ws://localhost:8080/ws` (`wss://` em produção), STOMP sem SockJS
- Tópico: `/topic/fila-atualizada` (público, somente leitura; envio de mensagens pelas telas é recusado)
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
31 requisições com 64 verificações automáticas, cobrindo pedidos (RN00–RN02), consultas, controle de palco
(RN03/RN04) e o aviso de fim de vídeo do reprodutor.

1. Banco com `02_dados_desenvolvimento.sql` aplicado.
2. API no perfil `dev` com `PLAYER_API_KEY=teste`.
3. No Postman: **Import** → arquivo da collection → **Run collection**, na ordem.

A primeira requisição limpa a fila, então o roteiro pode ser repetido. As variáveis da collection
(`baseUrl`, `admin`, `ana`, `bruno`, `carla`, `playerKey`) podem ser ajustadas.
Pela linha de comando: `npx newman run postman/karaoke-card-1.3.postman_collection.json`.

## Testes

Precisam do Docker em execução: o Testcontainers sobe um MySQL 8.4 descartável criado com o mesmo
`01_criar_banco.sql`, sem tocar no banco local.

```bash
./mvnw test
```
