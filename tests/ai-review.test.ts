import { describe, expect, it } from 'vitest';
import { runAiReview, type AiReviewContext } from '../src/ai/review.js';

const context: AiReviewContext = {
  summary: 'Review changed webhook validation.',
  changedFiles: [{ path: 'src/webhook.ts', lineCount: 20, diff: '@@ -1 +1 @@' }],
  deterministicFindings: [],
};

const validOutput = {
  summary: 'The change is reviewable.',
  overallRisk: 35,
  engineeringQuality: 80,
  securityRisk: 30,
  findings: [{ title: 'Missing validation', severity: 'HIGH', category: 'SECURITY', file: 'src/webhook.ts', line: 4, explanation: 'Input is accepted before validation.', evidence: 'parse(payload)', recommendation: 'Validate before parsing.', confidence: 82 }],
  positiveObservations: ['The change has focused scope.'],
  recommendedChanges: ['Add signature validation tests.'],
};

describe('runAiReview', () => {
  it('validates structured provider output against supplied context', async () => {
    const result = await runAiReview({ review: async () => validOutput }, context);
    expect(result.findings[0]).toMatchObject({ file: 'src/webhook.ts', line: 4, severity: 'HIGH' });
  });

  it('rejects invented files and invalid locations', async () => {
    await expect(runAiReview({ review: async () => ({ ...validOutput, findings: [{ ...validOutput.findings[0], file: 'src/secret.ts' }] }) }, context)).rejects.toThrow('outside the supplied context');
    await expect(runAiReview({ review: async () => ({ ...validOutput, findings: [{ ...validOutput.findings[0], line: 21 }] }) }, context)).rejects.toThrow('invalid line');
  });
});
