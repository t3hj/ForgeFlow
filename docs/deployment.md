# Deployment status and setup

## Local development

Use the two-terminal setup in the root README. `npm run dev:api` starts the Node API, and `npm run dev` starts the React/Vite dashboard. The default `/api` URL uses Vite's development proxy to reach port 4000. Set a server-side `FORGEFLOW_AUTH_TOKENS` value and enter its token in the dashboard form.

With no database or Redis URL configured, requests use in-memory adapters. This is enough to test authentication and queue receipts; it does not run a separate worker or retain jobs across restarts.

The existing Compose file is a legacy scaffold: its frontend/API/worker build contexts do not contain Dockerfiles, its frontend variable refers to an earlier framework, and the worker module does not start a processing loop. It is not a supported full-stack launcher. PostgreSQL and Redis can be started independently with `docker compose up -d database redis` when working on the adapters. No generated Prisma migrations are committed; prepare and review a migration before using persistent environments.

## Production requirements

The web build (`npm run build`, output `apps/web/dist`) is static, but the review service is not. A production host must route `/api/*` to the Node API, stripping the `/api` prefix, over HTTPS on the same origin. Vite's development proxy is not included in the static build. Setting a different `VITE_API_URL` alone does not configure CORS; use a same-origin reverse proxy. Never place access tokens in Vite environment variables, source files or public hosting configuration.

A full service also needs managed PostgreSQL and Redis, reviewed migrations, a secret manager, isolated worker capacity, a continuous processing loop with a repository input loader, result persistence and a result-reading API. Sandbox and model-provider stages must be explicitly wired and verified before presenting their output as completed checks. Repository connection, GitHub webhook registration and dashboard history/progress are still in development.

Use separate credentials for API and worker services, TLS termination, and explicit database release steps before routing production traffic. The current shared-token development authentication is not a complete production account/session system.
