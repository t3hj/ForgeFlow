import { AnalysisStatus, PrismaClient } from '@prisma/client';
import type { AnalysisJob } from '../application/analysis.ts';
import type { AnalysisStore } from '../application/persistence.ts';

export class PrismaAnalysisStore implements AnalysisStore {
  private readonly prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  async createQueuedJob(job: AnalysisJob): Promise<void> {
    await this.prisma.$transaction(async (transaction) => {
      const pullRequest = await transaction.pullRequest.upsert({
        where: {
          repositoryId_githubNumber: {
            repositoryId: job.repositoryId,
            githubNumber: job.pullRequestNumber,
          },
        },
        update: {},
        create: {
          repository: { connect: { id: job.repositoryId } },
          githubNumber: job.pullRequestNumber,
          title: `Pull request #${job.pullRequestNumber}`,
          author: job.requestedBy,
          baseBranch: 'unknown',
          headBranch: 'unknown',
        },
      });

      const review = await transaction.review.create({
        data: {
          pullRequestId: pullRequest.id,
          status: AnalysisStatus.QUEUED,
          progress: 0,
        },
      });

      await transaction.auditLog.create({
        data: {
          actorId: job.requestedBy,
          action: 'ANALYSIS_STARTED',
          resource: 'review',
          resourceId: review.id,
          result: 'QUEUED',
          metadata: { jobId: job.id, pullRequestNumber: job.pullRequestNumber },
        },
      });
    });
  }
}
