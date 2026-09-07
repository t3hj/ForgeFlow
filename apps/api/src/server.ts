import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import Redis from 'ioredis';
import { PrismaClient } from '@prisma/client';
import { AnalysisService } from '../../../src/application/analysis.ts';
import { MemoryAnalysisQueue } from '../../../src/application/memory-queue.ts';
import { RedisAnalysisQueue } from '../../../src/application/redis-queue.ts';
import { MemoryAnalysisStore } from '../../../src/application/persistence.ts';
import { PrismaAnalysisStore } from '../../../src/infrastructure/prisma-store.ts';

const redis = process.env.REDIS_URL ? new Redis(process.env.REDIS_URL) : null;
const prisma = process.env.DATABASE_URL ? new PrismaClient() : null;
const queue = redis ? new RedisAnalysisQueue(redis) : new MemoryAnalysisQueue();
const store = prisma ? new PrismaAnalysisStore(prisma) : new MemoryAnalysisStore();
const analyses = new AnalysisService(queue, store);

function sendJson(response: ServerResponse, status: number, body: unknown): void {
  response.writeHead(status, { 'content-type': 'application/json' });
  response.end(JSON.stringify(body));
}

async function readJson(request: IncomingMessage): Promise<Record<string, unknown>> {
  const chunks: Buffer[] = [];
  for await (const chunk of request) chunks.push(Buffer.from(chunk));
  const parsed: unknown = JSON.parse(Buffer.concat(chunks).toString('utf8'));
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error('JSON object required');
  return parsed as Record<string, unknown>;
}

const server = createServer(async (request, response) => {
  if (request.method === 'GET' && request.url === '/health') {
    sendJson(response, 200, { status: 'ok', service: 'forgeflow-api' });
    return;
  }

  if (request.method === 'POST' && request.url === '/v1/analyses') {
    try {
      const body = await readJson(request);
      const job = await analyses.request({
        repositoryId: typeof body.repositoryId === 'string' ? body.repositoryId : '',
        pullRequestNumber: typeof body.pullRequestNumber === 'number' ? body.pullRequestNumber : 0,
        requestedBy: typeof body.requestedBy === 'string' ? body.requestedBy : '',
      });
      sendJson(response, 202, job);
    } catch (error) {
      sendJson(response, 400, { error: error instanceof Error ? error.message : 'invalid request' });
    }
    return;
  }

  sendJson(response, 404, { error: 'not found' });
});

const port = Number(process.env.PORT ?? 4000);
server.listen(port, () => console.log(`ForgeFlow API listening on ${port}`));
