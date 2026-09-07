import type { AnalysisJob } from './analysis.js';

export interface AnalysisStore {
  createQueuedJob(job: AnalysisJob): Promise<void>;
}

export class MemoryAnalysisStore implements AnalysisStore {
  readonly jobs: AnalysisJob[] = [];

  async createQueuedJob(job: AnalysisJob): Promise<void> {
    this.jobs.push(job);
  }
}
