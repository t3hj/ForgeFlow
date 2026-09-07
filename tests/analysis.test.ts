import { describe, expect, it } from 'vitest';
import { AnalysisService } from '../src/application/analysis.js';
import { MemoryAnalysisQueue } from '../src/application/memory-queue.js';
import { MemoryAnalysisStore } from '../src/application/persistence.js';

describe('AnalysisService', () => {
  it('queues a validated asynchronous analysis job', async () => {
    const queue = new MemoryAnalysisQueue();
    const store = new MemoryAnalysisStore();
    const job = await new AnalysisService(queue, store).request({
      repositoryId: 'repo_123',
      pullRequestNumber: 42,
      requestedBy: 'user_123',
    });

    expect(job).toMatchObject({
      repositoryId: 'repo_123',
      pullRequestNumber: 42,
      requestedBy: 'user_123',
      status: 'QUEUED',
      progress: 0,
    });
    expect(queue.jobs).toEqual([job]);
    expect(store.jobs).toEqual([job]);
  });

  it('rejects invalid pull request numbers before enqueueing', async () => {
    const queue = new MemoryAnalysisQueue();
    await expect(new AnalysisService(queue).request({
      repositoryId: 'repo_123',
      pullRequestNumber: 0,
      requestedBy: 'user_123',
    })).rejects.toThrow('pullRequestNumber must be a positive integer');
    expect(queue.jobs).toHaveLength(0);
  });
});
