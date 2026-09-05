export type UserRole = 'ADMIN' | 'DEVELOPER' | 'VIEWER';
export type Permission = 'REPOSITORY_MANAGE' | 'ANALYSIS_RUN' | 'FINDING_WRITE' | 'AUDIT_READ';

const permissions: Record<Permission, UserRole[]> = {
  REPOSITORY_MANAGE: ['ADMIN', 'DEVELOPER'],
  ANALYSIS_RUN: ['ADMIN', 'DEVELOPER'],
  FINDING_WRITE: ['ADMIN', 'DEVELOPER'],
  AUDIT_READ: ['ADMIN', 'DEVELOPER', 'VIEWER'],
};

export function can(role: UserRole, permission: Permission): boolean {
  return permissions[permission].includes(role);
}
