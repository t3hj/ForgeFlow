# Analysis queue

The API publishes validated analysis jobs to the Redis list `forgeflow:analysis-jobs`. Workers consume jobs with a blocking pop, so long-running analysis does not block API requests.

The queue adapter validates the minimum job envelope after deserialization. Persistence should add an idempotency key and durable job state around this transport so a worker crash can safely retry a job.
