import { describe, expect, it } from 'vitest';
import { AnalysisWorker } from '../src/application/worker.js';
import { RedisAnalysisQueue, type RedisListClient } from '../src/application/redis-queue.js';
import type { AnalysisJob } from '../src/application/analysis.js';

class FakeRedis implements RedisListClient {
  private readonly jobs: string[];

  constructor(job: AnalysisJob) {
    this.jobs = [JSON.stringify(job)];
  }

  async rpush(): Promise<number> { return this.jobs.length; }

  async blpop(): Promise<[string, string] | null> {
    const job = this.jobs.shift();
    return job ? ['forgeflow:analysis-jobs', job] : null;
  }
}

describe('AnalysisWorker', () => {
  it('dequeues a job, loads changed files, and runs the pipeline', async () => {
    const job: AnalysisJob = { id: 'job_1', repositoryId: 'repo_1', pullRequestNumber: 4, requestedBy: 'user_1', status: 'QUEUED', progress: 0, createdAt: 'now' };
    const updates: number[] = [];
    const worker = new AnalysisWorker(
      new RedisAnalysisQueue(new FakeRedis(job)),
      { load: async () => [{ path: 'src/unsafe.ts', content: 'eval(input)' }] },
      { onUpdate: (_job, update) => { updates.push(update.progress); } },
    );

    const result = await worker.processNext();
    expect(result?.status).toBe('COMPLETED');
    expect(result?.findings[0]?.file).toBe('src/unsafe.ts');
    expect(updates).toContain(96);
  });
});
