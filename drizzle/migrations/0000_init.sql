CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TYPE credential_provider AS ENUM ('openai', 'espn', 'cfbd', 'custom');
CREATE TYPE credential_status AS ENUM ('valid', 'invalid', 'unknown');
CREATE TYPE mcp_auth_type AS ENUM ('none', 'token', 'basic');
CREATE TYPE job_type AS ENUM ('fine_tune_export', 'scheduled_preview', 'scheduled_recap', 'custom');
CREATE TYPE job_status AS ENUM ('pending', 'queued', 'active', 'succeeded', 'failed', 'cancelled');
CREATE TYPE job_event_type AS ENUM ('enqueued', 'progress', 'retry', 'completed', 'failed');

CREATE TABLE app_credentials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider credential_provider NOT NULL,
  name text NOT NULL,
  secret_ciphertext text NOT NULL,
  secret_iv text NOT NULL,
  secret_tag text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  last_validated_at timestamptz,
  status credential_status NOT NULL DEFAULT 'unknown'
);

CREATE TABLE mcp_servers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  label text NOT NULL,
  base_url text NOT NULL,
  auth_type mcp_auth_type NOT NULL DEFAULT 'none',
  auth_ref_id uuid REFERENCES app_credentials(id),
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  last_ping_at timestamptz,
  status credential_status NOT NULL DEFAULT 'unknown'
);

CREATE TABLE content_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type job_type NOT NULL,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  status job_status NOT NULL DEFAULT 'pending',
  queue_job_id text,
  created_at timestamptz NOT NULL DEFAULT now(),
  started_at timestamptz,
  completed_at timestamptz,
  error_message text
);

CREATE TABLE job_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid NOT NULL REFERENCES content_jobs(id) ON DELETE CASCADE,
  event_type job_event_type NOT NULL,
  data jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_app_credentials_provider ON app_credentials (provider);
CREATE INDEX idx_mcp_servers_auth_ref ON mcp_servers (auth_ref_id);
CREATE INDEX idx_content_jobs_status ON content_jobs (status);
CREATE INDEX idx_job_events_job_id ON job_events (job_id);
