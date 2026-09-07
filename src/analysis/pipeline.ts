import type { AnalysisJob } from '../application/analysis.js';
import { scanFiles, type ScannableFile, type ScannerFinding } from './scanner.js';
import { calculateRisk, type RiskResult } from '../domain/risk.ts';

export type PipelineStageStatus = 'RUNNING' | 'COMPLETED' | 'FAILED';

export interface PipelineUpdate {
  stage: string;
  status: PipelineStageStatus;
  progress: number;
  result?: unknown;
  error?: string;
}

export interface PipelineInput {
  job: AnalysisJob;
  files: ScannableFile[];
  onUpdate?: (update: PipelineUpdate) => Promise<void> | void;
}

export interface PipelineResult {
  status: 'COMPLETED' | 'FAILED';
  findings: ScannerFinding[];
  risk: RiskResult;
  updates: PipelineUpdate[];
}

const stages = [
  { name: 'diff-extraction', progress: 12, run: async (input: PipelineInput) => input.files },
  { name: 'static-analysis', progress: 32, run: async (input: PipelineInput) => scanFiles(input.files) },
  { name: 'security-analysis', progress: 52, run: async (input: PipelineInput) => scanFiles(input.files).filter((finding) => finding.category === 'SECURITY') },
  { name: 'dependency-analysis', progress: 68, run: async () => [] },
  { name: 'sandboxed-tests', progress: 84, run: async () => ({ status: 'QUEUED', reason: 'sandbox runner not configured' }) },
  { name: 'ai-review', progress: 96, run: async () => ({ status: 'QUEUED', reason: 'AI provider not configured' }) },
];

export async function runPipeline(input: PipelineInput): Promise<PipelineResult> {
  const updates: PipelineUpdate[] = [];
  const findings: ScannerFinding[] = [];
  try {
    for (const stage of stages) {
      const running: PipelineUpdate = { stage: stage.name, status: 'RUNNING', progress: Math.max(stage.progress - 10, 0) };
      updates.push(running);
      await input.onUpdate?.(running);
      const result = await stage.run(input);
      if (stage.name === 'static-analysis' && Array.isArray(result)) findings.push(...result as ScannerFinding[]);
      const completed: PipelineUpdate = { stage: stage.name, status: 'COMPLETED', progress: stage.progress, result };
      updates.push(completed);
      await input.onUpdate?.(completed);
    }
    const risk = calculateRisk({
      findings: findings.map((finding) => ({ severity: finding.severity, category: finding.category })),
      changedFileCount: input.files.length,
      complexityDelta: 0,
      testFailures: 0,
      authenticationChanged: input.files.some((file) => /auth|login|session/i.test(file.path)),
      databaseChanged: input.files.some((file) => /migration|schema|database/i.test(file.path)),
      infrastructureChanged: input.files.some((file) => /docker|terraform|k8s|\.ya?ml$/i.test(file.path)),
    });
    return { status: 'COMPLETED', findings, risk, updates };
  } catch (error) {
    const failed: PipelineUpdate = { stage: 'pipeline', status: 'FAILED', progress: 0, error: error instanceof Error ? error.message : 'analysis failed' };
    updates.push(failed);
    await input.onUpdate?.(failed);
    return { status: 'FAILED', findings, risk: calculateRisk({ findings: [], changedFileCount: input.files.length, complexityDelta: 0, testFailures: 0, authenticationChanged: false, databaseChanged: false, infrastructureChanged: false }), updates };
  }
}
