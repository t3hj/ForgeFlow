# Architecture

ForgeFlow separates request handling from long-running repository analysis.

- The API validates identity, permissions, webhook signatures, and job requests.
- Redis carries analysis jobs to a worker process.
- The worker runs deterministic analyzers before the AI review stage.
- PostgreSQL stores repository state, analysis runs, findings, review output, and audit events.
- The frontend reads persisted state and subscribes to analysis progress.

Repository code is treated as untrusted input. Test execution and any repository tooling run in an isolated sandbox with explicit resource and network policies.

## Analysis stages

1. Diff extraction and changed-file classification
2. Static analysis
3. Security and secret analysis
4. Dependency analysis
5. Sandboxed test execution
6. Controlled AI review
7. Finding aggregation and deterministic risk scoring
8. Persistence, audit logging, and progress notification
