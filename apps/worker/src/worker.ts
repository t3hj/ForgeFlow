import type { AnalysisJob } from '../../../src/application/analysis.ts';

export interface AnalysisStage {
  name: string;
  run(job: AnalysisJob): Promise<void>;
}

export const analysisStages: AnalysisStage[] = [
  { name: 'diff-extraction', run: async () => undefined },
  { name: 'static-analysis', run: async () => undefined },
  { name: 'security-analysis', run: async () => undefined },
  { name: 'dependency-analysis', run: async () => undefined },
  { name: 'sandboxed-tests', run: async () => undefined },
  { name: 'ai-review', run: async () => undefined },
];

export async function runAnalysis(job: AnalysisJob, stages: AnalysisStage[] = analysisStages): Promise<void> {
  for (const stage of stages) await stage.run(job);
}
