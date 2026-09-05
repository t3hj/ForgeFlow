const secretPatterns = [
  /\bsk_live_[A-Za-z0-9_-]{8,}\b/g,
  /\bgh[pousr]_[A-Za-z0-9_]{20,}\b/g,
  /\bAKIA[0-9A-Z]{16}\b/g,
  /-----BEGIN [A-Z ]+ PRIVATE KEY-----[\s\S]+?-----END [A-Z ]+ PRIVATE KEY-----/g,
  /\b(password|passwd|token|secret|api[_-]?key)\s*[:=]\s*['\"]?[^\s,'\"]+/gi,
];

export function redactSecrets(value: string): string {
  return secretPatterns.reduce((redacted, pattern) => redacted.replace(pattern, (match) => {
    const separator = match.search(/[:=]/);
    if (separator >= 0) return `${match.slice(0, separator + 1)} [REDACTED]`;
    const prefix = match.match(/^(sk_live_|gh[pousr]_)/)?.[0];
    return prefix ? `${prefix}${'*'.repeat(Math.max(match.length - prefix.length, 8))}` : '[REDACTED]';
  }), value);
}
