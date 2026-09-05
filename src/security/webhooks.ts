import { createHmac, timingSafeEqual } from 'node:crypto';

export function verifyGithubSignature(payload: string, signatureHeader: string | undefined, secret: string): boolean {
  if (!signatureHeader?.startsWith('sha256=') || !secret) return false;
  const expected = createHmac('sha256', secret).update(payload, 'utf8').digest('hex');
  const received = signatureHeader.slice('sha256='.length);
  const expectedBuffer = Buffer.from(expected, 'hex');
  const receivedBuffer = Buffer.from(received, 'hex');
  return receivedBuffer.length === expectedBuffer.length && timingSafeEqual(receivedBuffer, expectedBuffer);
}
