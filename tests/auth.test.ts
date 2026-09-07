import { describe, expect, it } from 'vitest';
import { Authenticator, AuthorizationError } from '../src/security/auth.js';

describe('Authenticator', () => {
  it('resolves configured bearer users and permissions', () => {
    const auth = new Authenticator('dev-token:user-1:DEVELOPER,view-token:user-2:VIEWER');
    const user = auth.authenticate({ authorization: 'Bearer dev-token' });
    expect(user).toEqual({ id: 'user-1', role: 'DEVELOPER' });
    expect(auth.authorize(user, 'ANALYSIS_RUN')).toEqual(user);
  });

  it('rejects missing and underprivileged users', () => {
    const auth = new Authenticator('view-token:user-2:VIEWER');
    expect(() => auth.authorize(null, 'ANALYSIS_RUN')).toThrowError(new AuthorizationError(401, 'authentication required'));
    expect(() => auth.authorize(auth.authenticate({ authorization: 'Bearer view-token' }), 'ANALYSIS_RUN')).toThrowError(new AuthorizationError(403, 'insufficient permissions'));
  });
});
