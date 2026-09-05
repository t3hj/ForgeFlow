import { describe, expect, it } from 'vitest';
import { compareDependencies } from '../src/analysis/dependencies.js';

describe('compareDependencies', () => {
  it('reports added, removed, and updated packages without inventing advisories', () => {
    expect(compareDependencies(
      { dependencies: { express: '^4.0.0', 'old-lib': '^1.0.0' } },
      { dependencies: { express: '^5.0.0', 'new-lib': '^2.0.0' } },
    )).toEqual([
      { package: 'express', from: '^4.0.0', to: '^5.0.0', type: 'UPDATED', suspicious: false },
      { package: 'new-lib', to: '^2.0.0', type: 'ADDED', suspicious: false },
      { package: 'old-lib', from: '^1.0.0', type: 'REMOVED', suspicious: false },
    ]);
  });

  it('flags package names requiring supply-chain review', () => {
    expect(compareDependencies({}, { dependencies: { 'unknown-postinstall': '1.0.0' } })[0]).toMatchObject({ suspicious: true, reason: expect.any(String) });
  });
});
