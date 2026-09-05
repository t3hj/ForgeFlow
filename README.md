# ForgeFlow

ForgeFlow is an AI-powered software engineering and repository intelligence platform. It analyses pull requests with deterministic engineering checks, controlled AI review, risk scoring, and an auditable finding lifecycle.

## Development status

The project is being built incrementally. The first checkpoint contains the strict TypeScript foundation and deterministic risk engine. Later checkpoints add the API, worker, persistence, GitHub integration, analysis stages, and dashboard.

## Local setup

```bash
npm install
npm test
npm run typecheck
```

## Product architecture

```text
GitHub -> ForgeFlow API -> Redis job queue -> analysis worker
                                      |-> static analysis
                                      |-> security analysis
                                      |-> dependency analysis
                                      |-> sandboxed test runner
                                      `-> controlled AI review
                         -> PostgreSQL -> web dashboard
```

See `docs/` for the security model, architecture decisions, and deployment plan.
