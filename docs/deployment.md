# Deployment

Local development uses Docker Compose:

```bash
docker compose up --build
```

Production deployment should use managed PostgreSQL and Redis, a secret manager, isolated worker capacity, TLS termination, and separate credentials for web, API, and worker services. Database migrations run as an explicit release step before the API receives traffic.
