import type { IncomingHttpHeaders } from 'node:http';
import { can, type Permission, type UserRole } from './authorization.ts';

export interface AuthenticatedUser {
  id: string;
  role: UserRole;
}

export class Authenticator {
  private readonly tokens: Map<string, AuthenticatedUser>;

  constructor(tokenConfig = process.env.FORGEFLOW_AUTH_TOKENS ?? '') {
    this.tokens = new Map();
    for (const entry of tokenConfig.split(',').map((value) => value.trim()).filter(Boolean)) {
      const [token, id, role] = entry.split(':');
      if (token && id && isUserRole(role)) this.tokens.set(token, { id, role });
    }
  }

  authenticate(headers: IncomingHttpHeaders): AuthenticatedUser | null {
    const header = headers.authorization;
    if (!header?.startsWith('Bearer ')) return null;
    return this.tokens.get(header.slice('Bearer '.length)) ?? null;
  }

  authorize(user: AuthenticatedUser | null, permission: Permission): AuthenticatedUser {
    if (!user) throw new AuthorizationError(401, 'authentication required');
    if (!can(user.role, permission)) throw new AuthorizationError(403, 'insufficient permissions');
    return user;
  }
}

export class AuthorizationError extends Error {
  readonly status: 401 | 403;

  constructor(status: 401 | 403, message: string) {
    super(message);
    this.status = status;
  }
}

function isUserRole(value: string | undefined): value is UserRole {
  return value === 'ADMIN' || value === 'DEVELOPER' || value === 'VIEWER';
}
