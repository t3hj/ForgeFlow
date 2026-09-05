import { describe, expect, it } from 'vitest';
import { RedisAnalysisQueue, type RedisListClient } from '../src/application/redis-queue.js';
import type { AnalysisJob } from '../src/application/analysis.js';

class FakeRedis implements RedisListClient {
  private readonly values: string[] = [];

  async rpush(_key: string, value: string): Promise<number> {
    this.values.push(value);
    return this.values.length;
  }

  async blpop(_key: string, _timeoutSeconds: number): Promise<[string, string] | null> {
    const value = this.values.shift();
    return value ? ['forgeflow:analysis-jobs', value] : null;
  }
}

describe('RedisAnalysisQueue', () => {
  it('round-trips analysis jobs through a Redis list', async () => {
    const queue = new RedisAnalysisQueue(new FakeRedis());
    const job: AnalysisJob = { id: 'job_1', repositoryId: 'repo_1', pullRequestNumber: 4, requestedBy: 'user_1', status: 'QUEUED', progress: 0, createdAt: 'now' };
    await queue.enqueue(job);
    await expect(queue.dequeue()).resolves.toEqual(job);
    await expect(queue.dequeue()).resolves.toBeNull();
  });
});
