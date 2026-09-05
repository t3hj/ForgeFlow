import { describe, expect, it } from 'vitest';
import { calculateRisk } from '../src/domain/risk.js';

describe('calculateRisk', () => {
  it('returns low risk for a small clean change', () => {
    expect(calculateRisk({
      findings: [],
      changedFileCount: 2,
      complexityDelta: 0,
      testFailures: 0,
      authenticationChanged: false,
      databaseChanged: false,
      infrastructureChanged: false,
    })).toMatchObject({ score: 0, classification: 'LOW' });
  });

  it('weights security findings and failed tests deterministically', () => {
    expect(calculateRisk({
      findings: [
        { severity: 'HIGH', category: 'SECURITY' },
        { severity: 'MEDIUM', category: 'QUALITY' },
      ],
      changedFileCount: 4,
      complexityDelta: 0,
      testFailures: 2,
      authenticationChanged: true,
      databaseChanged: false,
      infrastructureChanged: false,
    })).toMatchObject({ score: 59, classification: 'HIGH' });
  });

  it('caps extreme risk at 100', () => {
    expect(calculateRisk({
      findings: Array.from({ length: 10 }, () => ({ severity: 'CRITICAL' as const, category: 'SECURITY' as const })),
      changedFileCount: 100,
      complexityDelta: 50,
      testFailures: 10,
      authenticationChanged: true,
      databaseChanged: true,
      infrastructureChanged: true,
    }).score).toBe(100);
  });
});
