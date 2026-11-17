# Projeto-Extensao-Karaoke
Repositório do projeto de extensão de um sistema de gestão de fila de reprodução para Karaoke.

## Estrutura

| Pasta | Conteúdo |
|---|---|
| `MVP/api` | API Spring Boot (fila, sessão, autenticação, WebSocket) |
| `MVP/BancoDeDados` | scripts do MySQL |
| `MVP/karaoke-envio-player` | front React (Cliente Web e Admin Web) |
| `MVP/ElectronTvPlayer` | reprodutor do telão (Electron) |
| `POC/` | provas de conceito |

## Subir o ambiente

```bash
cp .env.example .env              # ajuste as senhas, PLAYER_API_KEY e JWT_SECRET
docker compose up -d --build      # MySQL (3307), API (8080) e front (5174)
docker compose --profile tunel up -d   # opcional: túnel para testar no celular
```

Telão: ver `MVP/ElectronTvPlayer/README.md`.
