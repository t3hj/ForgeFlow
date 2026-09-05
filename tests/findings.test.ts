import { describe, expect, it } from 'vitest';
import { updateFindingStatus } from '../src/domain/findings.js';

describe('finding lifecycle', () => {
  it('updates status and creates an audit event', () => {
    const result = updateFindingStatus({ id: 'finding_1', status: 'OPEN', updatedAt: 'old' }, 'RESOLVED', 'user_1', '2026-09-06T00:00:00.000Z');
    expect(result.finding).toMatchObject({ id: 'finding_1', status: 'RESOLVED', updatedAt: '2026-09-06T00:00:00.000Z' });
    expect(result.audit).toMatchObject({ action: 'FINDING_RESOLVED', from: 'OPEN', to: 'RESOLVED', actorId: 'user_1' });
  });

  it('rejects invalid transitions and missing actors', () => {
    expect(() => updateFindingStatus({ id: 'finding_1', status: 'OPEN', updatedAt: 'old' }, 'OPEN', 'user_1')).toThrow('already');
    expect(() => updateFindingStatus({ id: 'finding_1', status: 'OPEN', updatedAt: 'old' }, 'RESOLVED', '')).toThrow('actorId');
  });

  it('allows reopened findings after resolution', () => {
    const result = updateFindingStatus({ id: 'finding_1', status: 'RESOLVED', updatedAt: 'old' }, 'OPEN', 'user_1');
    expect(result.finding.status).toBe('OPEN');
    expect(result.audit.action).toBe('FINDING_UPDATED');
  });
});
