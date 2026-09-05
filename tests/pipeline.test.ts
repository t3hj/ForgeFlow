import { describe, expect, it } from 'vitest';
import { runPipeline } from '../src/analysis/pipeline.js';

describe('runPipeline', () => {
  it('runs ordered stages and reports progress updates', async () => {
    const updates: number[] = [];
    const result = await runPipeline({
      job: { id: 'job_1', repositoryId: 'repo_1', pullRequestNumber: 3, requestedBy: 'user_1', status: 'QUEUED', progress: 0, createdAt: new Date().toISOString() },
      files: [{ path: 'src/unsafe.ts', content: 'const value = eval(input);' }],
      onUpdate: (update) => { updates.push(update.progress); },
    });

    expect(result.status).toBe('COMPLETED');
    expect(result.findings[0]).toMatchObject({ file: 'src/unsafe.ts', line: 1, severity: 'HIGH' });
    expect(updates).toEqual([2, 12, 22, 32, 42, 52, 58, 68, 74, 84, 86, 96]);
  });
});
