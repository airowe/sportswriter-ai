# Background Job Architecture (BullMQ + Redis)

## Goals
Offload long-running tasks (fine-tune exports, scheduled recaps) from API requests, provide progress tracking for the dashboard, and enable retries/backoff with structured logging.

## Components
- **Redis:** Single instance (local via docker-compose, managed in prod). Expose URL via `REDIS_URL`.
- **Queues:** Define in `jobs/queues.ts` (e.g., `contentQueue`, `fineTuneQueue`). Configure default attempts, backoff, and job-level TTL.
- **Worker Runtime:** `jobs/worker.ts` imports queue processors and is launched with `pnpm worker`. Use `bullmq` `Worker` + `QueueEvents` for status hooks. Consider clustering via `pm2` or `node --watch` in dev.
- **Processors:** One file per job type under `jobs/processors/`. Each processor pulls decrypted payloads from Drizzle (`content_jobs`), executes orchestration logic, and reports progress via `job.updateProgress`.
- **Scheduler (optional):** For cron-like runs, use `bullmq` `QueueScheduler` in `jobs/scheduler.ts`, started alongside the worker when scheduled tasks are enabled.
- **API Integration:** Server actions/API routes enqueue jobs with `queue.add(name, payload, opts)` and immediately persist metadata in `content_jobs`.

## Request Flow
1. UI submits action (e.g., start fine-tune).  
2. Server action validates input, encrypts sensitive data, stores a `content_jobs` row (status `pending`).  
3. Enqueue job to BullMQ; capture returned `job.id` and update status to `queued`.  
4. Worker picks up job, sets status `active`, decrypts payload, calls existing orchestration (e.g., OpenAI fine-tune).  
5. On success, mark `content_jobs.status = 'succeeded'`, store result metadata; emit toast via logging/webhook.  
6. On failure, record error, increment retry count; after max attempts, set status `failed`.

## Observability
- Hook `queue.on('completed'|'failed')` and `QueueEvents` to structured logger.
- Store per-job timeline in `job_events` table, exposing a `/api/jobs/:id` endpoint for polling.
- Add dashboard component (`app/dashboard/jobs/page.tsx`) showing status, timestamps, retry counts, and latest message.

## Configuration & Ops
- Env vars: `REDIS_URL`, `BULLMQ_METRICS_ENABLED`, `JOB_DEFAULT_ATTEMPTS`, `JOB_MAX_CONCURRENCY`.
- Use graceful shutdown (listen for `SIGINT`, `SIGTERM`, call `worker.close()`).
- Document local setup (`docker compose up redis`, `pnpm worker` in second terminal). Production deploy needs a separate worker dyno/process.
