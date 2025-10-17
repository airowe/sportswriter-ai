# Background Job Processing System

This directory contains the background job processing system for long-running tasks such as fine-tuning exports and scheduled content generation.

## Architecture

The system uses a Prisma-backed job queue with SQLite, providing a lightweight solution that doesn't require Redis or additional infrastructure.

### Components

1. **Job Queue (`lib/queue.ts`)**: Core queue management functions
   - `createJob()`: Enqueue new jobs
   - `claimNextJob()`: Claim next available job for processing
   - `updateJobStatus()`: Update job status and results
   - `getJob()` / `getJobs()`: Query jobs

2. **Worker (`jobs/worker.ts`)**: Main background worker process
   - Polls for pending jobs every 5 seconds
   - Processes jobs based on priority and scheduled time
   - Implements retry logic with exponential backoff
   - Graceful shutdown handling

3. **Job Handlers (`jobs/handlers/`)**: Task-specific implementations
   - `fineTuneExport.ts`: Exports training data to JSONL format
   - `generation.ts`: Handles preview and recap generation via OpenAI

4. **API Endpoints (`pages/api/`)**: Job management APIs
   - `POST /api/jobs`: Create new jobs
   - `GET /api/jobs`: List jobs with filtering
   - `GET /api/jobs/[id]`: Get specific job status
   - `PATCH /api/jobs/[id]`: Update job status
   - `DELETE /api/jobs/[id]`: Delete job

5. **Frontend Hooks (`lib/hooks/`)**: React hooks for job status
   - `useJob()`: Poll individual job status
   - `useJobs()`: List and filter jobs

## Job Types

### FINE_TUNE_EXPORT
Formats training samples into JSONL format for OpenAI fine-tuning.

**Payload:**
```typescript
{
  samples: { prompt: string; response: string }[];
  exportName?: string;
}
```

**Result:**
```typescript
{
  fileName: string;
  filePath: string;
  sampleCount: number;
}
```

### PREVIEW_GENERATION / RECAP_GENERATION
Generates sports content using the fine-tuned model.

**Payload:**
```typescript
{
  prompt: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
}
```

**Result:**
```typescript
{
  prompt: string;
  content: string;
  model: string;
  usage: { total_tokens: number; ... };
}
```

## Running the Worker

### Development
```bash
npm run worker:dev
```
This runs the worker with auto-reload on file changes.

### Production
```bash
npm run worker
```

### Multiple Workers
For high-volume scenarios, run multiple worker processes:
```bash
npm run worker &
npm run worker &
```

The transaction-based job claiming ensures no job is processed twice.

## Scheduling Jobs

Jobs can be scheduled for future execution:

```typescript
await createJob({
  type: JobType.PREVIEW_GENERATION,
  payload: { prompt: 'Generate preview for tonight\'s game' },
  scheduledFor: new Date('2024-10-17T18:00:00Z'),
  priority: 5,
});
```

## Retry Logic

- Default max retries: 3
- Exponential backoff: 2^retryCount seconds (capped at 30s)
- Jobs exceeding max retries are marked as FAILED
- Failed jobs can be manually retried via `retryJob(id)`

## Monitoring

Visit `/jobs` in the web UI to:
- View all jobs and their statuses
- Filter by status and type
- See job payloads, results, and errors
- Monitor scheduled jobs

## Database

Jobs are stored in the `ContentJob` table with the following schema:

- `id`: Unique job identifier
- `type`: Job type (enum)
- `status`: PENDING | PROCESSING | COMPLETED | FAILED
- `payload`: Job input data (JSON)
- `result`: Job output data (JSON, nullable)
- `error`: Error message (nullable)
- `retryCount`: Current retry attempt
- `maxRetries`: Maximum retry attempts
- `priority`: Job priority (higher = sooner)
- `scheduledFor`: When to run the job (nullable)
- `startedAt`: When job started processing
- `completedAt`: When job finished
- `createdAt`: When job was created
- `updatedAt`: Last update time

## Best Practices

1. **Idempotency**: Ensure job handlers can safely retry without side effects
2. **Timeouts**: Long-running jobs should implement their own timeouts
3. **Error Handling**: Always return meaningful error messages
4. **Resource Limits**: Be mindful of OpenAI rate limits and token usage
5. **Monitoring**: Regularly check the jobs dashboard for failures
