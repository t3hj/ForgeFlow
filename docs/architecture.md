# Architecture

ForgeFlow separates request handling from long-running repository analysis.

- The API validates identity, permissions, webhook signatures, and job requests.
- Redis carries analysis jobs to a worker process.
- The worker runs deterministic analyzers before the AI review stage.
- PostgreSQL stores repository state, analysis runs, findings, review output, and audit events.
- The frontend reads persisted state and subscribes to analysis progress.

Repository code is treated as untrusted input. Test execution and any repository tooling run in an isolated sandbox with explicit resource and network policies.
