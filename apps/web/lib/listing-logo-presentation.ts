export const LISTING_LOGO_FALLBACK_PATH = '/img/serp-arrow-logo-black.svg';

function normalizeAssetReference(assetReference?: string): string {
  return assetReference?.split('#')[0].split('?')[0].trim().toLowerCase() ?? '';
}

export function shouldUseProvidedListingLogo(logoUrl?: string): boolean {
  return normalizeAssetReference(logoUrl).endsWith('.png');
}
