import { describe, expect, it } from 'vitest';
import { scanFiles } from '../src/analysis/scanner.js';

describe('scanFiles', () => {
  it('reports evidence-backed findings with exact source locations', () => {
    const findings = scanFiles([{ path: 'src/runner.ts', content: 'const result = eval(input);\n// TODO: remove this\n' }]);
    expect(findings).toHaveLength(2);
    expect(findings[0]).toMatchObject({ title: 'Dynamic code execution', file: 'src/runner.ts', line: 1, severity: 'HIGH', category: 'SECURITY' });
    expect(findings[1]).toMatchObject({ title: 'TODO in changed code', file: 'src/runner.ts', line: 2, severity: 'LOW', category: 'QUALITY' });
    expect(findings[0]?.evidence).toContain('eval(input)');
  });

  it('detects shell execution and credential-like assignments', () => {
    const findings = scanFiles([{ path: 'build.py', content: 'subprocess.run(command)\napi_key = "123456789012345678"' }]);
    expect(findings.map((finding) => finding.title)).toEqual(['Shell command construction', 'Potential hard-coded secret']);
    expect(findings.every((finding) => finding.confidence > 0)).toBe(true);
  });

  it('returns no findings for ordinary code', () => {
    expect(scanFiles([{ path: 'math.ts', content: 'export function add(a: number, b: number) { return a + b; }' }])).toEqual([]);
  });
});
