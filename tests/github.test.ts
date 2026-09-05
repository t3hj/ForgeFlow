import { describe, expect, it, vi } from 'vitest';
import { GithubClient } from '../src/integrations/github.js';

describe('GithubClient', () => {
  it('retrieves and normalizes a pull request bundle', async () => {
    const fetcher = vi.fn((url: string) => {
      if (url.endsWith('/pulls/7')) return Promise.resolve(new Response(JSON.stringify({
        number: 7,
        title: 'Harden webhook validation',
        body: 'Validate signatures before parsing.',
        user: { login: 'octocat' },
        base: { ref: 'main' },
        head: { ref: 'security/webhook' },
        additions: 12,
        deletions: 3,
      }), { status: 200 }));
      return Promise.resolve(new Response(JSON.stringify([{ filename: 'src/webhooks.ts', status: 'modified', additions: 12, deletions: 3, patch: '@@ -1 +1 @@' }]), { status: 200 }));
    });

    const bundle = await new GithubClient('token', fetcher, 'https://github.test').getPullRequestBundle('owner', 'repo', 7);
    expect(bundle.pullRequest).toMatchObject({ number: 7, author: 'octocat', baseBranch: 'main' });
    expect(bundle.files).toEqual([{ path: 'src/webhooks.ts', status: 'modified', additions: 12, deletions: 3, patch: '@@ -1 +1 @@' }]);
    expect(fetcher).toHaveBeenCalledWith(expect.stringContaining('/repos/owner/repo/'), expect.objectContaining({ headers: expect.objectContaining({ authorization: 'Bearer token' }) }));
  });

  it('rejects invalid pull request numbers and API errors', async () => {
    const fetcher = vi.fn(() => Promise.resolve(new Response('{}', { status: 403 })));
    const client = new GithubClient('token', fetcher, 'https://github.test');
    await expect(client.getPullRequest('owner', 'repo', 0)).rejects.toThrow('positive');
    await expect(client.getRepository('owner', 'repo')).rejects.toThrow('403');
  });
});
