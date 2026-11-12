# Banco de Dados — Karaokê Apache

Scripts MySQL 8 do modelo relacional (documento.pdf, Seção 4.3 e Tabela 11).
**O banco é criado por estes scripts; a API não cria nem altera tabelas**
(`spring.jpa.hibernate.ddl-auto=validate`, só confere o esquema ao subir).

| Script | Conteúdo | Onde rodar |
|---|---|---|
| `scripts/01_criar_banco.sql` | Banco `karaoke_apache` + tabelas `usuario`, `musica`, `fila` (e `letra`, fora do MVP) | dev e produção |
| `scripts/02_dados_desenvolvimento.sql` | Admin, 3 visitantes e 5 músicas fictícias | **somente dev** |

## Opção 1 — Docker

```bash
cp .env.example .env   # e preencha as senhas
docker compose up -d
```

Na primeira subida, os dois scripts rodam automaticamente. Para recriar do zero:

```bash
docker compose down -v && docker compose up -d
```

## Opção 2 — MySQL instalado na máquina (ou RDS na AWS)

Execute em ordem, com um usuário com permissão de criação (ex.: `root`), pelo MySQL Workbench ou pelo cliente `mysql`:

```bash
mysql -u root -p < scripts/01_criar_banco.sql
mysql -u root -p < scripts/02_dados_desenvolvimento.sql   # só em dev
```

Crie um usuário próprio para a API, apenas com permissão de dados (a API não precisa de DDL):

```sql
CREATE USER 'karaoke_app'@'%' IDENTIFIED BY '<senha forte>';
GRANT SELECT, INSERT, UPDATE, DELETE ON karaoke_apache.* TO 'karaoke_app'@'%';
```

## Observações

- **Datas em UTC.** `dt_pedido` é gravado em UTC; o container já usa `--default-time-zone=+00:00`. Em MySQL local ou RDS, a API força UTC na conexão (`connectionTimeZone=UTC`).
- **`youtube_id` diferencia maiúsculas de minúsculas** (`ascii_bin`), como os IDs do YouTube.
- **RN01, RN02 e a exigência de e-mail/senha para admin** não são restrições do banco: são verificadas pela API (Seção 4.3).
- **Alterações futuras** no esquema entram como novos scripts numerados (`04_...sql`), nunca editando os já aplicados em produção.
