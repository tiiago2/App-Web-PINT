# Checklist de produção do backend mobile

Executar por ambiente. Nunca copiar valores reais para este documento.

## 1. Antes da alteração

- [ ] Confirmar janela de manutenção e responsável pelo rollback.
- [ ] Criar e validar backup restaurável da base.
- [ ] Registar versão atualmente publicada do backend web.
- [ ] Confirmar Node.js compatível com as dependências instaladas.
- [ ] Executar `npm ci` ou `npm install` apenas no processo normal de deploy.
- [ ] Executar localmente todos os testes com mocks.

## 2. Variáveis de ambiente

Obrigatórias para a base:

- `DB_HOST`
- `DB_PORT` (omissão `5432`)
- `DB_DATABASE`
- `DB_USER`
- `DB_PASSWORD`
- `DB_SSL` (`false` apenas em PostgreSQL local sem SSL)

Autenticação:

- `MOBILE_JWT_SECRET` com pelo menos 32 caracteres e diferente de `JWT_SECRET`.
- `MOBILE_ACCESS_TOKEN_TTL_SECONDS` opcional; omissão 900.
- `MOBILE_REFRESH_TOKEN_TTL_DAYS` opcional; omissão 30.
- `JWT_SECRET` continua obrigatório para a aplicação web.

Storage:

- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`

Firebase, escolher uma opção:

- `FIREBASE_SERVICE_ACCOUNT_JSON`; ou
- `GOOGLE_APPLICATION_CREDENTIALS`.

Runtime:

- `PORT` opcional; omissão 5000.
- `SYNC_CRON_TIMEZONE` opcional; usar um identificador IANA válido.
- `EMAIL_USER` e `EMAIL_PASS` continuam necessários para os fluxos web de email.

Constantes atuais sem variável de ambiente: upload 10 MB; retenção idempotente 30 dias; worker com lote 50; cinco tentativas; backoff 1/5/15/60 minutos; recuperação de `processing` após 15 minutos.

## 3. Ordem dos scripts SQL

Executar com `ON_ERROR_STOP=1`, um a um, nesta ordem:

1. `scripts/sql/20260716_mobile_sync.sql`
2. `scripts/sql/20260716_mobile_devices_firebase.sql`
3. `scripts/sql/20260716_mobile_refresh_tokens.sql`
4. `scripts/sql/20260716_mobile_sync_changes.sql`
5. `scripts/sql/20260717_mobile_operations.sql`
6. `scripts/sql/20260717_mobile_push_outbox.sql`

Dependências importantes:

- O script 1 adiciona colunas usadas pela compatibilidade incremental e tombstones.
- O script 4 depende das tabelas de negócio e das colunas do script 1.
- O script 6 depende de `mobile_sync_changes` criado pelo script 4.
- Todos dependem da tabela preexistente `utilizador` quando existe FK.
- `sequelize.sync({force:false})` não substitui os scripts porque não cria funções nem triggers.

Comando-modelo, sem credenciais reais:

```powershell
psql "<EXTERNAL_DATABASE_URL>" --set ON_ERROR_STOP=1 --file ".\scripts\sql\<SCRIPT>.sql"
```

Após cada script:

- [ ] Confirmar término sem erro.
- [ ] Confirmar tabela/colunas esperadas.
- [ ] Confirmar constraints e índices.
- [ ] Depois do script 4, confirmar triggers `trg_mobile_sync_*`.
- [ ] Depois do script 6, confirmar `trg_mobile_push_from_sync_change`.

## 4. Arranque

- [ ] Publicar o backend apenas depois dos scripts.
- [ ] Confirmar que o processo arranca sem expor detalhes de ligação.
- [ ] Confirmar que o cron é iniciado uma única vez por processo.
- [ ] Se existirem várias réplicas, confirmar que `SKIP LOCKED` está disponível e monitorizar duplicados toleráveis.
- [ ] Confirmar que a ausência temporária do Firebase não impede a web.

## 5. Smoke tests seguros

Usar contas e dispositivos de teste autorizados. Não colocar tokens em logs ou histórico partilhado.

- [ ] `GET /api/mobile/health` devolve 200 e `service=mobile-api`.
- [ ] Login mobile devolve access e refresh token.
- [ ] `/auth/me` aceita o access token mobile.
- [ ] Refresh roda o refresh token e rejeita o anterior.
- [ ] Logout revoga o refresh token.
- [ ] Registar dispositivo de teste e confirmar `registered=true`.
- [ ] Executar sync full e confirmar `contract_version=3`.
- [ ] Executar sync por cursor e confirmar avanço de `(changed_at,change_id)`.
- [ ] Criar e apagar um objetivo de teste com `Idempotency-Key`.
- [ ] Repetir a operação e confirmar replay sem duplicação.
- [ ] Criar submissão de teste; carregar evidência não sensível; remover/confirmar conforme o cenário.
- [ ] Confirmar criação/coalescência na `mobile_push_outbox` sem inspecionar tokens.
- [ ] Confirmar passagem `pending -> processing -> sent` ou retry controlado.
- [ ] Desativar o dispositivo de teste.
- [ ] Confirmar `POST /api/login` web e uma rota web autenticada representativa.

## 6. Monitorização e logs

- [ ] Alertar para crescimento de `mobile_push_outbox` em `pending`, `retryable_error` ou `processing` antigo.
- [ ] Alertar para `permanent_error` acima do normal.
- [ ] Monitorizar tokens desativados, sem imprimir o token.
- [ ] Monitorizar falhas de rotação de refresh e conflitos idempotentes.
- [ ] Não registar Authorization, refresh tokens, FCM tokens, passwords, service accounts ou SQL com parâmetros.
- [ ] Garantir que logs têm retenção e controlo de acesso.

## 7. Retenção e manutenção

- [ ] Remover periodicamente `mobile_operations` expiradas que não estejam `processing`.
- [ ] Definir retenção para `mobile_push_outbox` em estados finais.
- [ ] Definir retenção para `mobile_sync_changes` apenas após garantir que nenhum cliente precisa dos cursores antigos.
- [ ] Rever e limpar dispositivos inativos segundo a política de dados.
- [ ] Nunca limpar refresh tokens ativos; remover apenas expirados/revogados segundo política aprovada.

## 8. Segurança antes de abrir tráfego

- [ ] Confirmar segredo mobile diferente do segredo web.
- [ ] Confirmar HTTPS obrigatório no proxy/load balancer.
- [ ] Confirmar CORS permitido apenas para origens necessárias no ambiente de produção.
- [ ] Confirmar rate limiting no gateway para login, refresh e endpoints mutáveis; o backend não possui limitador interno global.
- [ ] Confirmar limites de body no proxy e no Express.
- [ ] Confirmar permissões mínimas das credenciais PostgreSQL, Cloudinary e Firebase.

## 9. Rollback

- [ ] Parar a nova versão do backend/worker.
- [ ] Restaurar a versão anterior do backend.
- [ ] Não apagar imediatamente tabelas mobile: são aditivas e a versão web antiga não depende delas.
- [ ] Se houver corrupção de dados, restaurar o backup segundo o procedimento aprovado.
- [ ] Revogar credenciais apenas se houver suspeita de exposição.
- [ ] Registar outbox em `processing` para recuperação/retry antes de novo deploy.

## 10. Aceitação final

- [ ] Testes automatizados completos passam.
- [ ] Smoke tests mobile passam.
- [ ] Smoke tests web passam.
- [ ] Nenhum push contém dados completos.
- [ ] Nenhum upload real foi usado durante testes automatizados.
- [ ] A aplicação Flutter pode integrar usando `docs/mobile_backend_contracts.md`.
