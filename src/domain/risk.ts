export type FindingSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type RiskClassification = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface RiskInput {
  findings: Array<{
    severity: FindingSeverity;
    category: 'SECURITY' | 'QUALITY' | 'DEPENDENCY' | 'TEST';
  }>;
  changedFileCount: number;
  complexityDelta: number;
  testFailures: number;
  authenticationChanged: boolean;
  databaseChanged: boolean;
  infrastructureChanged: boolean;
}

export interface RiskResult {
  score: number;
  classification: RiskClassification;
  factors: string[];
}

const severityPoints: Record<FindingSeverity, number> = {
  LOW: 3,
  MEDIUM: 8,
  HIGH: 18,
  CRITICAL: 35,
};

export function calculateRisk(input: RiskInput): RiskResult {
  const factors: string[] = [];
  let score = 0;

  for (const finding of input.findings) {
    score += severityPoints[finding.severity];
    if (finding.category === 'SECURITY') score += 5;
  }

  if (input.testFailures > 0) {
    score += Math.min(input.testFailures * 8, 24);
    factors.push(`${input.testFailures} test failure(s)`);
  }

  if (input.complexityDelta > 10) {
    score += Math.min(Math.round(input.complexityDelta / 2), 15);
    factors.push('complexity increased materially');
  }

  if (input.changedFileCount > 20) {
    score += 8;
    factors.push('large change surface');
  }

  if (input.authenticationChanged) {
    score += 12;
    factors.push('authentication code changed');
  }

  if (input.databaseChanged) {
    score += 8;
    factors.push('database code changed');
  }

  if (input.infrastructureChanged) {
    score += 8;
    factors.push('infrastructure code changed');
  }

  const boundedScore = Math.min(Math.max(score, 0), 100);
  return {
    score: boundedScore,
    classification: classifyRisk(boundedScore),
    factors,
  };
}

function classifyRisk(score: number): RiskClassification {
  if (score >= 75) return 'CRITICAL';
  if (score >= 50) return 'HIGH';
  if (score >= 25) return 'MEDIUM';
  return 'LOW';
}
