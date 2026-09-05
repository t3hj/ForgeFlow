import type { FindingSeverity } from '../domain/risk.js';

export type ScannerCategory = 'SECURITY' | 'QUALITY';

export interface ScannableFile {
  path: string;
  content: string;
}

export interface ScannerFinding {
  title: string;
  severity: FindingSeverity;
  category: ScannerCategory;
  file: string;
  line: number;
  explanation: string;
  evidence: string;
  recommendation: string;
  confidence: number;
}

type Rule = {
  title: string;
  severity: FindingSeverity;
  category: ScannerCategory;
  pattern: RegExp;
  explanation: string;
  recommendation: string;
  confidence: number;
};

const rules: Rule[] = [
  {
    title: 'Dynamic code execution',
    severity: 'HIGH',
    category: 'SECURITY',
    pattern: /\beval\s*\(|new\s+Function\s*\(/,
    explanation: 'Dynamic code execution can turn attacker-controlled input into executable code.',
    recommendation: 'Remove dynamic execution or replace it with an allowlisted parser and operation set.',
    confidence: 92,
  },
  {
    title: 'Shell command construction',
    severity: 'HIGH',
    category: 'SECURITY',
    pattern: /child_process\.(exec|execFile)\s*\(|\bos\.system\s*\(|\bsubprocess\.(run|Popen)\s*\(/,
    explanation: 'Shell execution requires strict argument handling and an explicit allowlist.',
    recommendation: 'Use a non-shell process API with fixed arguments and validate every input.',
    confidence: 88,
  },
  {
    title: 'Potential hard-coded secret',
    severity: 'CRITICAL',
    category: 'SECURITY',
    pattern: /(?:api[_-]?key|secret|token|password)\s*[:=]\s*['\"][^'\"]{12,}['\"]|-----BEGIN [A-Z ]+ PRIVATE KEY-----/i,
    explanation: 'A credential-like value appears directly in source code.',
    recommendation: 'Remove the value, rotate it, and load it from a managed secret store at runtime.',
    confidence: 86,
  },
  {
    title: 'Potential SQL injection',
    severity: 'HIGH',
    category: 'SECURITY',
    pattern: /(?:SELECT|INSERT|UPDATE|DELETE)[\s\S]*(?:\$\{|\+\s*[a-zA-Z_]|`\s*\+)/i,
    explanation: 'SQL appears to be assembled with string interpolation or concatenation.',
    recommendation: 'Use parameterized queries or the ORM query builder instead of assembling SQL strings.',
    confidence: 78,
  },
  {
    title: 'TODO in changed code',
    severity: 'LOW',
    category: 'QUALITY',
    pattern: /\bTODO\b|\bFIXME\b/,
    explanation: 'The change introduces an explicit unfinished-work marker.',
    recommendation: 'Resolve the work before merging or create a tracked issue with ownership.',
    confidence: 99,
  },
];

export function scanFiles(files: ScannableFile[]): ScannerFinding[] {
  const findings: ScannerFinding[] = [];
  for (const file of files) {
    const lines = file.content.split(/\r?\n/);
    lines.forEach((line, index) => {
      for (const rule of rules) {
        if (!rule.pattern.test(line)) continue;
        rule.pattern.lastIndex = 0;
        findings.push({
          title: rule.title,
          severity: rule.severity,
          category: rule.category,
          file: file.path,
          line: index + 1,
          explanation: rule.explanation,
          evidence: line.trim().slice(0, 240),
          recommendation: rule.recommendation,
          confidence: rule.confidence,
        });
      }
    });
  }
  return findings;
}
