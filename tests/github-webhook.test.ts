import { createHmac } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { parseGithubWebhook } from '../src/integrations/github-webhook.js';

function signed(payload: string, secret: string): string {
  return `sha256=${createHmac('sha256', secret).update(payload).digest('hex')}`;
}

describe('parseGithubWebhook', () => {
  it('turns a signed pull request event into an analysis command', () => {
    const payload = JSON.stringify({ action: 'synchronize', number: 12, pull_request: {}, repository: { full_name: 'octo/demo', owner: { login: 'octo' } } });
    expect(parseGithubWebhook(payload, signed(payload, 'secret'), 'secret', 'pull_request', 'delivery-1')).toEqual({ eventId: 'delivery-1', event: 'pull_request', owner: 'octo', repository: 'demo', pullRequestNumber: 12, action: 'synchronize' });
  });

  it('rejects unsigned payloads and ignores unsupported actions', () => {
    const payload = JSON.stringify({ action: 'closed', number: 12, pull_request: {}, repository: { full_name: 'octo/demo', owner: { login: 'octo' } } });
    expect(() => parseGithubWebhook(payload, undefined, 'secret', 'pull_request', 'delivery-2')).toThrow('signature');
    expect(parseGithubWebhook(payload, signed(payload, 'secret'), 'secret', 'pull_request', 'delivery-2')).toBeNull();
  });
});
