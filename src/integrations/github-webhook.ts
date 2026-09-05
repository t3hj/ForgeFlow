import { verifyGithubSignature } from '../security/webhooks.js';

export interface WebhookAnalysisCommand {
  eventId: string;
  event: 'pull_request' | 'push';
  owner: string;
  repository: string;
  pullRequestNumber?: number;
  action: string;
}

export function parseGithubWebhook(payload: string, signature: string | undefined, secret: string, eventName: string | undefined, eventId: string | undefined): WebhookAnalysisCommand | null {
  if (!eventId || !verifyGithubSignature(payload, signature, secret)) throw new Error('invalid GitHub webhook signature');
  if (eventName !== 'pull_request' && eventName !== 'push') return null;

  const body: unknown = JSON.parse(payload);
  if (!body || typeof body !== 'object' || Array.isArray(body)) throw new Error('invalid GitHub webhook payload');
  const record = body as Record<string, unknown>;
  const repository = objectField(record, 'repository');
  const owner = objectField(repository, 'owner');
  const fullName = stringField(repository, 'full_name');
  const [ownerName, repositoryName] = fullName.split('/', 2);
  if (!ownerName || !repositoryName || stringField(owner, 'login') !== ownerName) throw new Error('invalid repository identity');

  if (eventName === 'pull_request') {
    const pullRequest = objectField(record, 'pull_request');
    const number = numberField(record, 'number');
    const action = stringField(record, 'action');
    if (!['opened', 'reopened', 'synchronize'].includes(action)) return null;
    if (number < 1 || !pullRequest) throw new Error('invalid pull request event');
    return { eventId, event: eventName, owner: ownerName, repository: repositoryName, pullRequestNumber: number, action };
  }

  const action = stringField(record, 'ref');
  return { eventId, event: eventName, owner: ownerName, repository: repositoryName, action };
}

function objectField(value: Record<string, unknown>, key: string): Record<string, unknown> {
  const result = value[key];
  if (!result || typeof result !== 'object' || Array.isArray(result)) throw new Error(`invalid webhook field ${key}`);
  return result as Record<string, unknown>;
}

function stringField(value: Record<string, unknown>, key: string): string {
  const result = value[key];
  if (typeof result !== 'string' || !result) throw new Error(`invalid webhook field ${key}`);
  return result;
}

function numberField(value: Record<string, unknown>, key: string): number {
  const result = value[key];
  if (typeof result !== 'number') throw new Error(`invalid webhook field ${key}`);
  return result;
}
