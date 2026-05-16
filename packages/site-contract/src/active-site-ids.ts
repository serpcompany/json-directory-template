export const activeCheckedInSiteIds = [
  'browserextensions.io',
  'pornvideodownloaders.com',
  'serp.ai',
  'serp.co',
  'serp.software',
  'serpdownloaders.com',
] as const;
const activeCheckedInSiteIdSet = new Set<string>(activeCheckedInSiteIds);

export const removedSiteIds = new Set([
  'extensions.serp.co',
]);

export function assertSiteIdIsNotRemoved(siteId: string): void {
  if (!removedSiteIds.has(siteId)) {
    return;
  }

  throw new Error(
    `Site "${siteId}" was removed from this repo. Use a supported checked-in site id instead.`
  );
}

export function assertSiteIdIsSupported(siteId: string): void {
  assertSiteIdIsNotRemoved(siteId);

  if (activeCheckedInSiteIdSet.has(siteId)) {
    return;
  }

  throw new Error(
    `Site "${siteId}" is not an active checked-in site in this repo. Use "default" or a supported checked-in site id instead.`
  );
}
