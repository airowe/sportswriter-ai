import { jsonb, pgEnum, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

export const credentialProviderEnum = pgEnum('credential_provider', [
  'openai',
  'espn',
  'cfbd',
  'custom',
]);

export const credentialStatusEnum = pgEnum('credential_status', [
  'valid',
  'invalid',
  'unknown',
]);

export const credentialProviderEnumValues = credentialProviderEnum.enumValues;

export const credentialStatusEnumValues = credentialStatusEnum.enumValues;

export const mcpAuthTypeEnum = pgEnum('mcp_auth_type', [
  'none',
  'token',
  'basic',
]);

export const mcpAuthTypeEnumValues = mcpAuthTypeEnum.enumValues;

export const jobTypeEnum = pgEnum('job_type', [
  'fine_tune_export',
  'scheduled_preview',
  'scheduled_recap',
  'custom',
]);

export const jobTypeEnumValues = jobTypeEnum.enumValues;

export const jobStatusEnum = pgEnum('job_status', [
  'pending',
  'queued',
  'active',
  'succeeded',
  'failed',
  'cancelled',
]);

export const jobStatusEnumValues = jobStatusEnum.enumValues;

export const jobEventTypeEnum = pgEnum('job_event_type', [
  'enqueued',
  'progress',
  'retry',
  'completed',
  'failed',
]);

export const jobEventTypeEnumValues = jobEventTypeEnum.enumValues;

export const appCredentials = pgTable('app_credentials', {
  id: uuid('id').defaultRandom().primaryKey(),
  provider: credentialProviderEnum('provider').notNull(),
  name: text('name').notNull(),
  secretCiphertext: text('secret_ciphertext').notNull(),
  secretIv: text('secret_iv').notNull(),
  secretTag: text('secret_tag').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
  lastValidatedAt: timestamp('last_validated_at', { withTimezone: true }),
  status: credentialStatusEnum('status').notNull().default('unknown'),
});

export const mcpServers = pgTable('mcp_servers', {
  id: uuid('id').defaultRandom().primaryKey(),
  label: text('label').notNull(),
  baseUrl: text('base_url').notNull(),
  authType: mcpAuthTypeEnum('auth_type').notNull().default('none'),
  authRefId: uuid('auth_ref_id').references(() => appCredentials.id),
  metadata: jsonb('metadata').$type<Record<string, unknown>>().default({}),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
  lastPingAt: timestamp('last_ping_at', { withTimezone: true }),
  status: credentialStatusEnum('status').notNull().default('unknown'),
});

export const contentJobs = pgTable('content_jobs', {
  id: uuid('id').defaultRandom().primaryKey(),
  type: jobTypeEnum('type').notNull(),
  payload: jsonb('payload').$type<Record<string, unknown>>().notNull(),
  status: jobStatusEnum('status').notNull().default('pending'),
  queueJobId: text('queue_job_id'),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
  startedAt: timestamp('started_at', { withTimezone: true }),
  completedAt: timestamp('completed_at', { withTimezone: true }),
  errorMessage: text('error_message'),
});

export const jobEvents = pgTable('job_events', {
  id: uuid('id').defaultRandom().primaryKey(),
  jobId: uuid('job_id')
    .notNull()
    .references(() => contentJobs.id, { onDelete: 'cascade' }),
  eventType: jobEventTypeEnum('event_type').notNull(),
  data: jsonb('data').$type<Record<string, unknown>>().default({}),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
});
