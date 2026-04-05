import { siteConfig } from '@/lib/site-config';

export const DEFAULT_SITE_LISTING_LOGO_FALLBACK_PATH = '/placeholder.svg';
export const SITE_BRAND_LISTING_LOGO_FALLBACK_PATH = '/logo.png';

function normalizeAssetReference(assetReference?: string): string {
  return assetReference?.split('#')[0].split('?')[0].trim().toLowerCase() ?? '';
}

export function shouldUseProvidedListingLogo(logoUrl?: string): boolean {
  return normalizeAssetReference(logoUrl).endsWith('.png');
}

export function getListingLogoFallbackPath(): string {
  return siteConfig.id === 'default'
    ? DEFAULT_SITE_LISTING_LOGO_FALLBACK_PATH
    : SITE_BRAND_LISTING_LOGO_FALLBACK_PATH;
}
