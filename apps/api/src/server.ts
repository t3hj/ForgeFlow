import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import { AnalysisService } from '../../../src/application/analysis.ts';
import { MemoryAnalysisQueue } from '../../../src/application/memory-queue.ts';

const queue = new MemoryAnalysisQueue();
const analyses = new AnalysisService(queue);

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
