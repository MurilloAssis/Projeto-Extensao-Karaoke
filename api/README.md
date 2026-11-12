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
├── event/                Eventos de alteração da fila (base para o WebSocket)
├── exception/            Exceções de negócio e códigos de erro
├── security/             Identificação do usuário e do reprodutor
└── config/               Configuração do Spring (segurança, relógio, OpenAPI)
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
| `PLAYER_API_KEY` | vazio (desativado) | chave do Karaokê TV Player |

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
