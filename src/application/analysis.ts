export type AnalysisStatus = 'QUEUED' | 'RUNNING' | 'COMPLETED' | 'FAILED';

export interface AnalysisRequest {
  repositoryId: string;
  pullRequestNumber: number;
  requestedBy: string;
}

export interface AnalysisJob {
  id: string;
  repositoryId: string;
  pullRequestNumber: number;
  requestedBy: string;
  status: AnalysisStatus;
  progress: number;
  createdAt: string;
}

export interface AnalysisQueue {
  enqueue(job: AnalysisJob): Promise<void>;
}

export class AnalysisService {
  private readonly queue: AnalysisQueue;

  constructor(queue: AnalysisQueue) {
    this.queue = queue;
  }

  async request(request: AnalysisRequest): Promise<AnalysisJob> {
    if (!request.repositoryId.trim()) throw new Error('repositoryId is required');
    if (!Number.isInteger(request.pullRequestNumber) || request.pullRequestNumber < 1) {
      throw new Error('pullRequestNumber must be a positive integer');
    }
    if (!request.requestedBy.trim()) throw new Error('requestedBy is required');

    const job: AnalysisJob = {
      id: crypto.randomUUID(),
      repositoryId: request.repositoryId,
      pullRequestNumber: request.pullRequestNumber,
      requestedBy: request.requestedBy,
      status: 'QUEUED',
      progress: 0,
      createdAt: new Date().toISOString(),
    };

    await this.queue.enqueue(job);
    return job;
  }
}
