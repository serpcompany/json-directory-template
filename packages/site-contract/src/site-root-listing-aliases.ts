import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

type TrialProductsJsonEntry = {
  product?: {
    slug?: string;
  };
};

function resolveWorkspaceRoot(): string {
  const current = process.cwd();

  if (existsSync(resolve(current, 'sites'))) {
    return current;
  }

  if (existsSync(resolve(current, '..', '..', 'sites'))) {
    return resolve(current, '..', '..');
  }

  return current;
}

const workspaceRoot = resolveWorkspaceRoot();

export function getSiteRootListingAliases(siteId: string): string[] {
  if (siteId !== 'serpdownloaders.com') {
    return [];
  }

  const sourcePath = resolve(workspaceRoot, 'sites', siteId, 'products.json');

  if (!existsSync(sourcePath)) {
    return [];
  }

  const products = JSON.parse(readFileSync(sourcePath, 'utf8')) as Record<
    string,
    TrialProductsJsonEntry
  >;

  return Object.values(products)
    .map((entry) => entry.product?.slug?.trim())
    .filter((slug): slug is string => Boolean(slug));
}
