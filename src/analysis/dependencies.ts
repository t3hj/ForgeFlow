export type DependencyChangeType = 'ADDED' | 'REMOVED' | 'UPDATED';

export interface DependencyChange {
  package: string;
  from?: string;
  to?: string;
  type: DependencyChangeType;
  suspicious: boolean;
  reason?: string;
}

export interface DependencyManifest {
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
}

export function compareDependencies(before: DependencyManifest, after: DependencyManifest): DependencyChange[] {
  const previous = flatten(before);
  const current = flatten(after);
  const names = new Set([...Object.keys(previous), ...Object.keys(current)]);
  const changes: DependencyChange[] = [];

  for (const packageName of names) {
    const from = previous[packageName];
    const to = current[packageName];
    if (!from && to) {
      changes.push({ package: packageName, to, type: 'ADDED', ...suspicion(packageName) });
    } else if (from && !to) {
      changes.push({ package: packageName, from, type: 'REMOVED', suspicious: false });
    } else if (from && to && from !== to) {
      changes.push({ package: packageName, from, to, type: 'UPDATED', ...suspicion(packageName) });
    }
  }

  return changes.sort((left, right) => left.package.localeCompare(right.package));
}

function flatten(manifest: DependencyManifest): Record<string, string> {
  return { ...manifest.dependencies, ...manifest.devDependencies };
}

function suspicion(packageName: string): { suspicious: boolean; reason?: string } {
  if (packageName.startsWith('@types/')) return { suspicious: false };
  if (packageName.includes('postinstall') || packageName.includes('unknown')) {
    return { suspicious: true, reason: 'package name requires manual supply-chain review' };
  }
  return { suspicious: false };
}
