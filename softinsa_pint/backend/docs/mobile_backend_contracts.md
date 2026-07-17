# Contrato final do backend mobile

Versão auditada: Fase 10. Namespace único: `/api/mobile`.

## Regras comuns

- Autenticação protegida: `Authorization: Bearer <mobile_access_token>`.
- O access token mobile usa `MOBILE_JWT_SECRET`, issuer `softinsa-pint`, audience `mobile-api` e `token_type=mobile_access`.
- Operações mutáveis indicadas abaixo exigem `Idempotency-Key` (1 a 128 caracteres, sem espaços exteriores nem caracteres de controlo). Em JSON, `client_operation_id` pode ser usado quando indicado. Multipart aceita apenas o header.
- Replays concluídos devolvem `Idempotent-Replayed: true`.
- Respostas de erro nunca incluem passwords, hashes, tokens, SQL ou stack traces.
- Os IDs de recursos são inteiros positivos e o utilizador é sempre obtido do access token.

## Endpoints

| Método e URL | Auth | Idempotência | Entrada | Sucesso | Erros principais |
|---|---|---|---|---|---|
| `GET /api/mobile/health` | Não | Não | — | `200 {success,service,status}` | — |
| `POST /api/mobile/auth/login` | Não | Não | JSON `email`, `password`, `device_id` | `200` com `access_token`, `refresh_token`, `token_type`, `expires_in`, `user` | `400`, `401`, `500` |
| `POST /api/mobile/auth/refresh` | Não | Não | JSON `refresh_token`, `device_id` | `200` com novos tokens | `400`, `401`, `403`, `500` |
| `POST /api/mobile/auth/logout` | Não | Não | JSON `refresh_token`, `device_id` | `200 {success:true}` | `400`, `401`, `500` |
| `GET /api/mobile/auth/me` | Bearer | Não | — | `200 {success,user}` | `401`, `403`, `500` |
| `PUT /api/mobile/devices` | Bearer | Não | JSON `device_id`, `fcm_token`, `platform` | `201` criado ou `200` atualizado | `400`, `401`, `500` |
| `DELETE /api/mobile/devices/:deviceId` | Bearer | Não | — | `200 {deactivated,device_id}` | `400`, `401`, `500` |
| `GET /api/mobile/sync` | Bearer | Não | Sem query; `since`; ou cursor composto | `200` contrato de sync | `400`, `401`, `403`, `404`, `500` |
| `POST /api/mobile/objectives` | Bearer | Sim | JSON `id_badge`, `data_inicial`, `data_final` | `201 {success,objective}` | `400`, `401`, `404`, `409`, `500` |
| `DELETE /api/mobile/objectives/:idObjetivo` | Bearer | Sim | — | `200 {success,deleted,id_objetivo}` | `400`, `401`, `403`, `409`, `500` |
| `PUT /api/mobile/profile` | Bearer | Sim | Um ou mais de `nome`, `email`, `telefone`, `foto` | `200 {success,profile}` | `400`, `401`, `404`, `409`, `500` |
| `PUT /api/mobile/signature` | Bearer | Sim | JSON `badge_ids` | `200 {success,signature}` | `400`, `401`, `403`, `409`, `500` |
| `POST /api/mobile/submissions` | Bearer | Sim | JSON `id_badge` | `201 {success,submission}` | `400`, `401`, `404`, `409`, `500` |
| `POST /api/mobile/submissions/:idSubmissao/evidences` | Bearer | Header obrigatório | Multipart `id_requisito`, `ficheiro` | `201` criado ou `200` substituído | `400`, `401`, `403`, `404`, `409`, `413`, `415`, `500` |
| `DELETE /api/mobile/submissions/:idSubmissao/evidences/:idFicheiro` | Bearer | Sim | — | `200 {success,deleted,id_ficheiro}` | `400`, `401`, `403`, `404`, `409`, `500` |
| `POST /api/mobile/submissions/:idSubmissao/submit` | Bearer | Sim | JSON vazio | `200 {success,submission}` | `400`, `401`, `403`, `404`, `409`, `500` |
| `GET /api/mobile/submissions/:idSubmissao` | Bearer | Não | — | `200 {success,submission}` | `400`, `401`, `403`, `404`, `500` |

## Sync

`contract_version` é `3`.

Modos:

- Full: `GET /sync`.
- Compatibilidade incremental: `GET /sync?since=<ISO-8601>`.
- Cursor: `GET /sync?cursorTimestamp=<ISO-8601>&cursorChangeId=<inteiro>&limit=<1..500>`.

`cursorTimestamp` e `cursorChangeId` são inseparáveis. `since` não pode ser combinado com cursor; `limit` apenas existe com cursor. O limite por omissão é 100.

Resposta:

```json
{
  "success": true,
  "contract_version": "3",
  "mode": "full|incremental|cursor",
  "sync_until": "<ISO-8601>",
  "next_cursor": {"changed_at": "<ISO-8601>", "change_id": 0},
  "has_more": false,
  "data": {},
  "deleted": {
    "badge_requirements": [],
    "notification_receivers": [],
    "objectives": [],
    "submission_documents": [],
    "signature_badges": [],
    "changes": []
  }
}
```

O cursor composto `(changed_at, change_id)` é a referência de ordenação. O sync, e não o Firebase, é a fonte de verdade.

## Upload de evidências

- Campo: `ficheiro`.
- Máximo fixo: 10 MB.
- Tipos: PDF, JPEG, PNG e WebP.
- MIME, extensão e assinatura binária são verificados.
- O nome é normalizado e o storage recebe bytes apenas depois das validações iniciais de autorização.
- Cloudinary é substituído por mock nos testes.

## Firebase

Mensagem estritamente data-only:

```json
{
  "data": {
    "type": "data_changed",
    "entity": "<entity|multiple>",
    "version": "<string>"
  },
  "android": {"priority": "high"},
  "apns": {
    "headers": {"apns-push-type": "background", "apns-priority": "5"},
    "payload": {"aps": {"contentAvailable": true}}
  }
}
```

Não existe `notification` visível nem dados pessoais. A outbox usa lock com `SKIP LOCKED`, cinco tentativas e backoff de 1, 5, 15 e 60 minutos. Tokens inválidos são desativados, nunca apagados.

## Idempotência

A unicidade é `(id_utilizador, client_operation_id)`. O hash inclui método, rota lógica, parâmetros, body normalizado e, em multipart, nome seguro, MIME, tamanho e SHA-256 dos bytes.

- Mesmo utilizador, chave e payload concluído: replay da resposta persistida.
- Mesma chave com payload ou operação diferente: `409 IDEMPOTENCY_KEY_CONFLICT`.
- Mesma chave ainda em processamento: `409 IDEMPOTENCY_OPERATION_PROCESSING`.
- `4xx` é persistido como falha permanente; `5xx` pode ser repetido.
- Tokens, passwords, hashes e `fcm_token` são removidos da resposta persistida.
- Retenção fixa atual: 30 dias; limpeza deve ser agendada operacionalmente.
