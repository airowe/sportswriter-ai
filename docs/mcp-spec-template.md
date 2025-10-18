# MCP Backend Specification Template

Use this template to document the Machine Control Protocol (MCP) services that power credential validation, data ingestion, and orchestration. Fill in each section as endpoints are finalized; keep request/response examples up to date.

## 1. Overview
- **Purpose:** Describe what the MCP service does (e.g., validate ESPN credential, fetch schedule data).
- **Base URL:** `https://<domain>/api/mcp`
- **Auth:** Bearer token derived from stored credential? Session cookie? Document expectations.
- **Telemetry:** Note required headers (`x-correlation-id`) and logging events.

## 2. Capability Matrix
| Capability | Endpoint | Method | Description | Auth Scope | Notes |
|------------|----------|--------|-------------|------------|-------|
| `ValidateOpenAIKey` | `/openai/validate` | POST | Confirms key by calling OpenAI `/models`. | `openai` | Retries, rate limits |

Add rows for ESPN, CFBD, MCP server ping, etc.

## 3. Endpoint Details
For each endpoint, specify:
### `<Endpoint Name>`
- **Method & Path:** `POST /openai/validate`
- **Request Body:**
```json
{
  "credentialId": "uuid",
  "testPayload": { "model": "gpt-4o-mini" }
}
```
- **Response 200:**
```json
{
  "status": "valid",
  "latencyMs": 235,
  "metadata": { "org": "ExampleOrg" }
}
```
- **Errors:** `400` (validation error), `401` (missing credential), `502` (upstream failure). Document error payload shape, correlation ID propagation, and logging expectations.

Repeat for every endpoint.

## 4. Data Contracts
- Enumerate shared types (e.g., `CredentialStatus`, `McpPingResult`) in TypeScript form.
- Specify enums and optional fields, with notes on default values.
- Call out any deterministic casing or naming conventions required by upstream APIs.

## 5. Security Considerations
- How secrets are injected (via Drizzle lookup + in-memory decrypt).
- Network restrictions or allowlists.
- Audit logging requirements (e.g., record last validation attempt in `mcp_servers.last_ping_at`).

## 6. Testing Strategy
- Unit tests: mock upstream HTTP responses; expected status transitions.
- Integration tests: run against staging MCP server using temporary credentials.
- Manual scripts: provide `curl` examples or `pnpm` scripts for each capability.

## 7. Change Log
- Track revisions (`v0.1 - initial draft`, `v0.2 - added ESPN schedule endpoint`).
