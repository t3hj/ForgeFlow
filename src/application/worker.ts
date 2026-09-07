import type { AnalysisJob } from './analysis.ts';
import type { RedisAnalysisQueue } from './redis-queue.ts';
import { runPipeline, type PipelineResult, type PipelineUpdate } from '../analysis/pipeline.ts';
import type { ScannableFile } from '../analysis/scanner.ts';

export interface AnalysisInputLoader {
  load(job: AnalysisJob): Promise<ScannableFile[]>;
}

export interface AnalysisWorkerOptions {
  onUpdate?: (job: AnalysisJob, update: PipelineUpdate) => Promise<void> | void;
}

export class AnalysisWorker {
  private readonly queue: RedisAnalysisQueue;
  private readonly loader: AnalysisInputLoader;
  private readonly onUpdate?: AnalysisWorkerOptions['onUpdate'];

  constructor(queue: RedisAnalysisQueue, loader: AnalysisInputLoader, options: AnalysisWorkerOptions = {}) {
    this.queue = queue;
    this.loader = loader;
    this.onUpdate = options.onUpdate;
  }

  async processNext(timeoutSeconds = 1): Promise<PipelineResult | null> {
    const job = await this.queue.dequeue(timeoutSeconds);
    if (!job) return null;
    const files = await this.loader.load(job);
    return runPipeline({
      job,
      files,
      onUpdate: (update) => this.onUpdate?.(job, update),
    });
  }
}
