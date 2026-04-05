import { createHash } from 'crypto';

export function generateToken(website: string): string {
  const slug = new URL(website).hostname.replace(/\./g, '-');
  const ts = Date.now().toString(36);
  const hash = createHash('sha256').update(website + ts).digest('hex').slice(0, 8);
  return `${slug}-${hash}`;
}
