# GitHub integration

ForgeFlow uses a short-lived, server-side GitHub client. Access tokens are supplied to the integration boundary and are never returned to the browser, persisted in repository records, or sent to the AI reviewer.

The client retrieves repository metadata, pull request metadata, and changed-file patches. API responses are validated before entering the analysis pipeline. Pull request numbers are validated as positive integers and API failures are surfaced as failed jobs rather than treated as empty data.

Webhook handling must verify the `X-Hub-Signature-256` HMAC before parsing an event. A verified `pull_request` event should enqueue a new analysis job; duplicate delivery handling belongs at the persistence boundary with an event idempotency key.
