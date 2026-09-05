# GitHub integration

ForgeFlow uses a short-lived, server-side GitHub client. Access tokens are supplied to the integration boundary and are never returned to the browser, persisted in repository records, or sent to the AI reviewer.

The client retrieves repository metadata, pull request metadata, and changed-file patches. API responses are validated before entering the analysis pipeline. Pull request numbers are validated as positive integers and API failures are surfaced as failed jobs rather than treated as empty data.

Webhook handling verifies the `X-Hub-Signature-256` HMAC before parsing an event. Signed `pull_request` events for `opened`, `reopened`, and `synchronize` become analysis commands; unsupported actions are ignored. Delivery IDs are retained on the command so the persistence layer can enforce idempotency.
