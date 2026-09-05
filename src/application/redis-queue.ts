import type { AnalysisJob, AnalysisQueue } from './analysis.js';

export interface RedisListClient {
  rpush(key: string, value: string): Promise<number>;
  blpop(key: string, timeoutSeconds: number): Promise<[string, string] | null>;
}

export class RedisAnalysisQueue implements AnalysisQueue {
  private readonly redis: RedisListClient;
  private readonly key: string;

  constructor(redis: RedisListClient, key = 'forgeflow:analysis-jobs') {
    this.redis = redis;
    this.key = key;
  }

  async enqueue(job: AnalysisJob): Promise<void> {
    await this.redis.rpush(this.key, JSON.stringify(job));
  }

  async dequeue(timeoutSeconds = 5): Promise<AnalysisJob | null> {
    const item = await this.redis.blpop(this.key, timeoutSeconds);
    if (!item) return null;
    const parsed: unknown = JSON.parse(item[1]);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error('invalid analysis job in queue');
    const job = parsed as Partial<AnalysisJob>;
    if (typeof job.id !== 'string' || typeof job.repositoryId !== 'string' || typeof job.pullRequestNumber !== 'number') {
      throw new Error('invalid analysis job in queue');
    }
    return job as AnalysisJob;
  }
}
