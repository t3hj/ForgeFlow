import type { AnalysisJob, AnalysisQueue } from './analysis.js';

export class MemoryAnalysisQueue implements AnalysisQueue {
  readonly jobs: AnalysisJob[] = [];

  async enqueue(job: AnalysisJob): Promise<void> {
    this.jobs.push(job);
  }
}
