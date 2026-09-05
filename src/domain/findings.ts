export type FindingStatus = 'OPEN' | 'ACKNOWLEDGED' | 'IN_PROGRESS' | 'RESOLVED' | 'FALSE_POSITIVE';

export interface FindingRecord {
  id: string;
  status: FindingStatus;
  assigneeId?: string;
  updatedAt: string;
}

export interface FindingAuditEvent {
  action: 'FINDING_UPDATED' | 'FINDING_RESOLVED' | 'FINDING_MARKED_FALSE_POSITIVE';
  findingId: string;
  actorId: string;
  from: FindingStatus;
  to: FindingStatus;
  createdAt: string;
}

const allowedTransitions: Record<FindingStatus, FindingStatus[]> = {
  OPEN: ['ACKNOWLEDGED', 'IN_PROGRESS', 'RESOLVED', 'FALSE_POSITIVE'],
  ACKNOWLEDGED: ['IN_PROGRESS', 'RESOLVED', 'FALSE_POSITIVE', 'OPEN'],
  IN_PROGRESS: ['RESOLVED', 'FALSE_POSITIVE', 'OPEN'],
  RESOLVED: ['OPEN'],
  FALSE_POSITIVE: ['OPEN'],
};

export function updateFindingStatus(finding: FindingRecord, nextStatus: FindingStatus, actorId: string, now = new Date().toISOString()): { finding: FindingRecord; audit: FindingAuditEvent } {
  if (!actorId.trim()) throw new Error('actorId is required');
  if (finding.status === nextStatus) throw new Error('finding is already in this status');
  if (!allowedTransitions[finding.status].includes(nextStatus)) {
    throw new Error(`cannot transition finding from ${finding.status} to ${nextStatus}`);
  }

  const action = nextStatus === 'RESOLVED'
    ? 'FINDING_RESOLVED'
    : nextStatus === 'FALSE_POSITIVE'
      ? 'FINDING_MARKED_FALSE_POSITIVE'
      : 'FINDING_UPDATED';

  return {
    finding: { ...finding, status: nextStatus, updatedAt: now },
    audit: { action, findingId: finding.id, actorId, from: finding.status, to: nextStatus, createdAt: now },
  };
}
