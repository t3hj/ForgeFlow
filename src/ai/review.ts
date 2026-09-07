import type { FindingSeverity } from '../domain/risk.ts';
import type { ScannerFinding } from '../analysis/scanner.ts';

export interface AiReviewContext {
  summary: string;
  changedFiles: Array<{ path: string; lineCount: number; diff: string }>;
  deterministicFindings: ScannerFinding[];
}

export interface AiReviewFinding {
  title: string;
  severity: FindingSeverity;
  category: 'SECURITY' | 'QUALITY' | 'DEPENDENCY' | 'TEST';
  file: string;
  line: number;
  explanation: string;
  evidence: string;
  recommendation: string;
  confidence: number;
}

export interface AiReviewOutput {
  summary: string;
  overallRisk: number;
  engineeringQuality: number;
  securityRisk: number;
  findings: AiReviewFinding[];
  positiveObservations: string[];
  recommendedChanges: string[];
}

export interface AiReviewProvider {
  review(context: AiReviewContext): Promise<unknown>;
}

export async function runAiReview(provider: AiReviewProvider, context: AiReviewContext): Promise<AiReviewOutput> {
  const raw = await provider.review(context);
  return validateAiReview(raw, context);
}

export function validateAiReview(value: unknown, context: AiReviewContext): AiReviewOutput {
  const record = objectValue(value, 'AI review');
  const output: AiReviewOutput = {
    summary: stringValue(record.summary, 'summary'),
    overallRisk: scoreValue(record.overallRisk, 'overallRisk'),
    engineeringQuality: scoreValue(record.engineeringQuality, 'engineeringQuality'),
    securityRisk: scoreValue(record.securityRisk, 'securityRisk'),
    findings: arrayValue(record.findings, 'findings').map((finding, index) => validateFinding(finding, context, index)),
    positiveObservations: stringArray(record.positiveObservations, 'positiveObservations'),
    recommendedChanges: stringArray(record.recommendedChanges, 'recommendedChanges'),
  };
  return output;
}

function validateFinding(value: unknown, context: AiReviewContext, index: number): AiReviewFinding {
  const record = objectValue(value, `findings[${index}]`);
  const file = stringValue(record.file, `findings[${index}].file`);
  const line = integerValue(record.line, `findings[${index}].line`);
  const changedFile = context.changedFiles.find((candidate) => candidate.path === file);
  if (!changedFile) throw new Error(`findings[${index}] references a file outside the supplied context`);
  if (line < 1 || line > changedFile.lineCount) throw new Error(`findings[${index}] references an invalid line`);
  return {
    title: stringValue(record.title, `findings[${index}].title`),
    severity: severityValue(record.severity, `findings[${index}].severity`),
    category: categoryValue(record.category, `findings[${index}].category`),
    file,
    line,
    explanation: stringValue(record.explanation, `findings[${index}].explanation`),
    evidence: stringValue(record.evidence, `findings[${index}].evidence`),
    recommendation: stringValue(record.recommendation, `findings[${index}].recommendation`),
    confidence: scoreValue(record.confidence, `findings[${index}].confidence`),
  };
}

function objectValue(value: unknown, label: string): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error(`${label} must be an object`);
  return value as Record<string, unknown>;
}

function arrayValue(value: unknown, label: string): unknown[] {
  if (!Array.isArray(value)) throw new Error(`${label} must be an array`);
  return value;
}

function stringValue(value: unknown, label: string): string {
  if (typeof value !== 'string' || !value.trim()) throw new Error(`${label} must be a non-empty string`);
  return value;
}

function stringArray(value: unknown, label: string): string[] {
  return arrayValue(value, label).map((item, index) => stringValue(item, `${label}[${index}]`));
}

function scoreValue(value: unknown, label: string): number {
  if (typeof value !== 'number' || !Number.isInteger(value) || value < 0 || value > 100) throw new Error(`${label} must be an integer from 0 to 100`);
  return value;
}

function integerValue(value: unknown, label: string): number {
  if (typeof value !== 'number' || !Number.isInteger(value)) throw new Error(`${label} must be an integer`);
  return value;
}

function severityValue(value: unknown, label: string): FindingSeverity {
  if (value === 'LOW' || value === 'MEDIUM' || value === 'HIGH' || value === 'CRITICAL') return value;
  throw new Error(`${label} has an invalid severity`);
}

function categoryValue(value: unknown, label: string): AiReviewFinding['category'] {
  if (value === 'SECURITY' || value === 'QUALITY' || value === 'DEPENDENCY' || value === 'TEST') return value;
  throw new Error(`${label} has an invalid category`);
}
