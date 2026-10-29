export type AnalysisJob = {
  id: string;
  status: 'QUEUED' | 'RUNNING' | 'COMPLETED' | 'FAILED';
  progress: number;
  repositoryId: string;
  pullRequestNumber: number;
};

export async function checkHealth(apiUrl: string, signal?: AbortSignal): Promise<void> {
  const response = await fetch(`${apiUrl}/health`, { signal: signal ?? AbortSignal.timeout(10000) });
  if (!response.ok) throw new Error('API unavailable');
  const body: unknown = await response.json();
  if (!body || typeof body !== 'object' || !('service' in body) || body.service !== 'forgeflow-api') {
    throw new Error('The configured address is not a ForgeFlow API');
  }
}

export async function queueAnalysis(apiUrl: string, token: string, repositoryId: string, pr: string): Promise<AnalysisJob> {
  const number = Number(pr);
  if (!token.trim()) throw new Error('Enter your workspace access token.');
  if (!repositoryId.trim()) throw new Error('Enter a repository ID.');
  if (!Number.isSafeInteger(number) || number < 1) throw new Error('Enter a positive whole pull request number.');
  const response = await fetch(`${apiUrl}/v1/analyses`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', authorization: `Bearer ${token.trim()}` },
    body: JSON.stringify({ repositoryId: repositoryId.trim(), pullRequestNumber: number }),
    signal: AbortSignal.timeout(15000),
  });
  if (response.status === 401) throw new Error('Access token not recognised. Check your workspace token and try again.');
  if (response.status === 403) throw new Error('This account cannot queue reviews. Ask a workspace administrator for access.');
  if (!response.ok) throw new Error(`Unable to queue analysis (HTTP ${response.status}). Check the repository ID and try again.`);
  const body: unknown = await response.json();
  if (!body || typeof body !== 'object') throw new Error('The API returned an unexpected response.');
  const job = body as Record<string, unknown>;
  if (typeof job.id !== 'string' || !job.id || typeof job.repositoryId !== 'string' ||
      !Number.isSafeInteger(job.pullRequestNumber) || typeof job.progress !== 'number' ||
      job.progress < 0 || job.progress > 100 ||
      !['QUEUED', 'RUNNING', 'COMPLETED', 'FAILED'].includes(String(job.status))) {
    throw new Error('The API returned an unexpected response.');
  }
  return job as AnalysisJob;
}
