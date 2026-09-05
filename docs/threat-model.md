# Threat model

ForgeFlow handles repository metadata, source diffs, credentials, and untrusted code.

## Trust boundaries

1. GitHub to API: webhook signatures and OAuth state are verified before processing.
2. Browser to API: authenticated sessions, RBAC, validation, rate limits, and secure headers apply.
3. API to worker: only validated job identifiers cross the queue.
4. Worker to repository code: analysis runs in an isolated container with no host filesystem access.
5. Worker to AI provider: only selected diff context and redacted findings are sent.

## Primary controls

- OAuth tokens are encrypted or kept in a managed secret store and never returned to clients.
- Findings redact likely secrets before persistence or AI submission.
- Webhook requests require a valid HMAC signature.
- AI tools expose allowlisted, permission-checked context only.
- Every permission-sensitive mutation creates an audit event.
