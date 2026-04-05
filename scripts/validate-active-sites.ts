import { defaultSiteConfig, siteConfigsById } from '../sites/index.ts';
import { validateSite } from './validate-site.ts';

export function getActiveCheckedInSiteIds(): string[] {
  return [
    defaultSiteConfig.id,
    ...Object.keys(siteConfigsById).sort((left, right) =>
      left.localeCompare(right)
    ),
  ];
}

export function validateActiveCheckedInSites(): void {
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
