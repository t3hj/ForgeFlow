import { afterEach, describe, expect, it, vi } from 'vitest';
import { checkHealth, queueAnalysis } from '../apps/web/src/api.ts';

afterEach(() => vi.unstubAllGlobals());

describe('dashboard API contract', () => {
  it('authenticates a queue request without trusting a browser-supplied user ID', async () => {
    const job = { id: 'job-1', status: 'QUEUED', progress: 0, repositoryId: 'repo-1', pullRequestNumber: 42 };
    const fetcher = vi.fn().mockResolvedValue(Response.json(job, { status: 202 }));
    vi.stubGlobal('fetch', fetcher);
    await expect(queueAnalysis('/api', ' access-token ', ' repo-1 ', '42')).resolves.toEqual(job);
    const [url, request] = fetcher.mock.calls[0]!;
    expect(url).toBe('/api/v1/analyses');
    expect(request.headers.authorization).toBe('Bearer access-token');
    expect(JSON.parse(request.body)).toEqual({ repositoryId: 'repo-1', pullRequestNumber: 42 });
  });

  it.each(['0', '-1', '1.5', '9007199254740992', 'not-a-number'])('rejects invalid PR number %s before sending', async value => {
    const fetcher = vi.fn(); vi.stubGlobal('fetch', fetcher);
    await expect(queueAnalysis('/api', 'token', 'repo', value)).rejects.toThrow('positive whole');
    expect(fetcher).not.toHaveBeenCalled();
  });

  it.each([401, 403])('explains access failure %s', async status => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('', { status })));
    await expect(queueAnalysis('/api', 'token', 'repo', '1')).rejects.toThrow(status === 401 ? 'not recognised' : 'cannot queue');
  });

  it('rejects a malformed queue receipt', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(Response.json({ success: true })));
    await expect(queueAnalysis('/api', 'token', 'repo', '1')).rejects.toThrow('unexpected response');
  });

  it('does not mistake a different server for the API', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(Response.json({ status: 'ok' })));
    await expect(checkHealth('/api')).rejects.toThrow('not a ForgeFlow API');
  });
});
