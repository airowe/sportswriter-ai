# Drizzle Persistence Plan

## Overview
We will layer Drizzle ORM on top of Postgres (local via docker-compose, managed in prod) to persist API credentials, MCP metadata, and background job state. Drizzle provides type-safe queries, lightweight migrations, and works cleanly with the existing Next.js app and server actions.

## Schema Outline
- `app_credentials`
  - `id` (uuid, pk), `provider` (enum: `openai`, `espn`, `cfbd`, `custom`), `name` (display label), `secret_ciphertext` (bytea), `secret_iv` (bytea), `created_at`/`updated_at`.
  - Optional `last_validated_at`, `status` (enum: `valid`, `invalid`, `unknown`).
- `mcp_servers`
  - `id` (uuid, pk), `label`, `base_url`, `auth_type` (`none`, `token`, `basic`), `auth_ref` (fk to `app_credentials` when reusing stored secrets), `metadata` (jsonb for custom headers), `created_at`/`updated_at`, `last_ping_at`, `status`.
- `content_jobs`
  - `id` (uuid, pk), `type` (`fine_tune_export`, `scheduled_preview`, etc.), `payload` (jsonb of request args), `status` (`pending`, `queued`, `active`, `succeeded`, `failed`, `cancelled`), `queue_job_id` (bullmq id), `created_at`, `started_at`, `completed_at`, `error_message`.
- `job_events` (optional but helpful for history)
  - `id` (uuid, pk), `job_id` (fk), `event_type` (`enqueued`, `retry`, `progress`, `completed`, `failed`), `data` (jsonb), `created_at`.

We can place table definitions under `drizzle/schema/` with per-table files, and add Drizzle config in `drizzle.config.ts`. Migrations live in `drizzle/migrations/`.

## Encryption Strategy
- Use Node's `crypto` module with AES-256-GCM.
- Store a base64-encoded `DRIZZLE_ENCRYPTION_KEY` in `.env.local` and production secrets manager; keep the raw buffer in memory only.
- Wrap encryption/decryption helpers in `lib/security/crypto.ts` returning `{ ciphertext, iv, authTag }`.
- In Drizzle schema, store combined cipher output as `bytea` columns (`secret_ciphertext`, `secret_tag`); avoid returning secrets to the client—expose masked versions via server actions.
- Add migration seeds to mark existing env-held keys as `unknown` status so the settings UI can prompt users to re-enter them.

## Access Patterns
- Server actions (e.g., `app/settings/actions.ts`) will call Drizzle to create/update credentials and MCP records, ensuring secrets never cross to the client.
- Background workers will read job payloads via Drizzle when BullMQ transitions the job into `active`.
- Logging integration: wrap queries in a helper that emits correlation IDs and durations to the structured logger once it is available.

## Next Steps
1. Add Drizzle dependencies (`drizzle-orm`, `drizzle-kit`, `pg`, `postgres`).
2. Commit `drizzle.config.ts`, schema files, and initial migration creating the tables above.
3. Introduce server-side helpers for credential CRUD with encryption.
4. Update settings UI and job orchestration to rely on these tables.
