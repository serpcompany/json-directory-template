import { activeCheckedInSiteIds } from '../sites/active-site-ids.ts';
import { validateSite } from './validate-site.ts';

export function getActiveCheckedInSiteIds(): string[] {
  return [...activeCheckedInSiteIds].sort((left, right) =>
    left.localeCompare(right)
  );
}

export function validateActiveCheckedInSites(): void {
  // This validates only active non-default sites. The default starter site is
  // still available for explicit validation via `pnpm validate:site -- --site default`.
  for (const siteId of getActiveCheckedInSiteIds()) {
    validateSite({ siteId });
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  try {
    validateActiveCheckedInSites();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(message);
    process.exitCode = 1;
  }
}
