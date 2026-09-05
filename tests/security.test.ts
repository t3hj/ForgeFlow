import { createHmac } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { can } from '../src/security/authorization.js';
import { redactSecrets } from '../src/security/secrets.js';
import { verifyGithubSignature } from '../src/security/webhooks.js';

describe('security primitives', () => {
  it('redacts credentials without exposing their full value', () => {
    const input = 'token=ghp_1234567890123456789012345678901234567890 sk_live_123456789abcdef';
    const redacted = redactSecrets(input);
    expect(redacted).not.toContain('1234567890123456789012345678901234567890');
    expect(redacted).not.toContain('123456789abcdef');
    expect(redacted).toContain('[REDACTED]');
  });

  it('verifies GitHub webhook signatures and rejects tampering', () => {
    const payload = '{"action":"opened"}';
    const secret = 'webhook-secret';
    const digest = createHmac('sha256', secret).update(payload).digest('hex');
    expect(verifyGithubSignature(payload, `sha256=${digest}`, secret)).toBe(true);
    expect(verifyGithubSignature(`${payload}x`, `sha256=${digest}`, secret)).toBe(false);
    expect(verifyGithubSignature(payload, undefined, secret)).toBe(false);
  });

  it('enforces role permissions server-side', () => {
    expect(can('DEVELOPER', 'ANALYSIS_RUN')).toBe(true);
    expect(can('VIEWER', 'ANALYSIS_RUN')).toBe(false);
    expect(can('VIEWER', 'AUDIT_READ')).toBe(true);
  });
});
