import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

export function resolveCheckedInSiteSourcePath(
  relativePath: string,
  cwd = process.cwd()
): string {
  const candidates = [resolve(cwd, relativePath)];

  let current = cwd;

  for (let depth = 0; depth < 6; depth += 1) {
    current = resolve(current, '..');
    candidates.push(resolve(current, relativePath));
  }

  const matchedPath = candidates.find((candidate) => existsSync(candidate));

  if (!matchedPath) {
    throw new Error(`Could not resolve checked-in site source path for ${relativePath}`);
  }

  return matchedPath;
}
