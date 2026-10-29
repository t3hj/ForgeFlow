# ForgeFlow

ForgeFlow is a software engineering and repository intelligence prototype. It combines deterministic pull request checks, evidence-backed findings, transparent risk scoring and an auditable finding lifecycle. Controlled model review is a planned pipeline integration, with validation helpers already implemented.

## What is implemented

- A strict TypeScript domain layer with deterministic risk scoring and audited finding transitions.
- An authenticated Node HTTP API that accepts analysis requests, deriving the user from a server-configured bearer token and enforcing role permissions.
- In-memory development adapters, a Redis queue adapter, an injectable analysis worker and a Prisma/PostgreSQL store.
- GitHub repository, pull request and diff clients, plus signed webhook parsing helpers.
- Static security heuristics with source evidence; dependency comparison, sandbox constraints and structured model-output validation modules.
- A responsive React dashboard with API health checks, authenticated queue submission and a session-local queue receipt.

## Current boundaries

This is an actively developed prototype, not a fully connected review service. The API currently exposes `GET /health` and `POST /v1/analyses` only. GitHub webhooks are not registered as HTTP routes, and a running worker still needs a repository input loader. The dashboard does not retrieve historical jobs, poll progress, show stored findings or populate metrics.

The pipeline currently runs static heuristics and risk scoring. Its dependency stage is a placeholder; sandbox and model-review stages report that they are not configured. Their standalone modules have tests, but that does not mean those stages run in the deployed workflow. Without Redis, API requests enter an in-process queue which a separate worker cannot consume; in-memory data is lost on restart.

## Local setup

Use Node.js 22.18+ or 24 and npm. From the repository root:

```bash
npm ci
npm test
npm run typecheck
npm run typecheck --prefix apps/web
npm run build
```

Start the API with a development token in one terminal:

```bash
FORGEFLOW_AUTH_TOKENS=local-token:local-user:DEVELOPER npm run dev:api
```

PowerShell equivalent:

```powershell
$env:FORGEFLOW_AUTH_TOKENS = 'local-token:local-user:DEVELOPER'
npm run dev:api
```

In a second terminal:

```bash
npm run dev
```

Open the URL printed by Vite (normally `http://localhost:5173`). Enter the development token `local-token` in the workspace form. Vite proxies `/api` to `http://localhost:4000`, avoiding cross-origin development requests. Do not use the example token outside local development. Tokens remain in React memory and are cleared when the page reloads; they are not embedded in the build or saved to browser storage.

For this basic queue receipt flow, leave `DATABASE_URL` and `REDIS_URL` unset. To use infrastructure adapters, configure those variables, generate the Prisma client and apply the schema to an appropriate development database. Do not treat the legacy Compose file as a complete application launcher; see [deployment notes](docs/deployment.md).

## Product architecture

The modules follow the intended flow:

GitHub input → authenticated API → Redis queue → analysis worker → evidence and risk → PostgreSQL → dashboard.

The boundaries above describe which connections remain to be implemented. See [analysis](docs/analysis.md), [architecture](docs/architecture.md), [security model](docs/threat-model.md) and [deployment](docs/deployment.md) for detail.
