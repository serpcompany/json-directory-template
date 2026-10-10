import { existsSync, readFileSync } from 'node:fs';
import { resolveCheckedInSiteConfig } from './index';
import { resolveCheckedInSiteSourcePath } from './checked-in-site-source-path';
import {
  type CollectLegacyListingRedirectsOptions,
  collectLegacyListingRedirects,
  type LegacyListingRedirect,
} from './legacy-listing-slugs';
import { normalizeTrialProduct, type TrialProducts } from './trial-products';

type TrialProductsJsonEntry = {
  product?: {
    slug?: string;
  };
};

type ListingJsonEntry = {
  slug?: string;
};

export function getSiteRootListingAliases(siteId: string): string[] {
  const siteConfig = resolveCheckedInSiteConfig(siteId);
  const sourcePath = resolveCheckedInSiteSourcePath(
    siteConfig.content.listingSource.path
  );

  if (!existsSync(sourcePath)) {
    return [];
  }

  if (siteConfig.content.listingSource.kind === 'trial-products-json') {
    const products = JSON.parse(readFileSync(sourcePath, 'utf8')) as Record<
      string,
      TrialProductsJsonEntry
    >;

    return Object.values(products)
      .map((entry) => entry.product?.slug?.trim())
      .filter((slug): slug is string => Boolean(slug));
  }

  if (siteConfig.content.listingSource.kind === 'listing-json') {
    const listings = JSON.parse(readFileSync(sourcePath, 'utf8')) as ListingJsonEntry[];

    return listings
      .map((entry) => entry.slug?.trim())
      .filter((slug): slug is string => Boolean(slug));
  }

  return [];
}

/**
 * Reads `product.legacySlugs` from a `trial-products-json` source and returns one validated
 * redirect per legacy slug. `listing-json` sources do not support legacy slugs.
 */
export function getSiteLegacyListingRedirects(
  siteId: string,
  options: CollectLegacyListingRedirectsOptions = {}
): LegacyListingRedirect[] {
  const siteConfig = resolveCheckedInSiteConfig(siteId);
  const listingSource = siteConfig.content.listingSource;

  if (listingSource.kind !== 'trial-products-json') {
    return [];
  }

  const sourcePath = resolveCheckedInSiteSourcePath(listingSource.path);

  if (!existsSync(sourcePath)) {
    return [];
  }

  const products = JSON.parse(readFileSync(sourcePath, 'utf8')) as TrialProducts;
  const listings = Object.entries(products).map(([fallbackSlug, product]) => {
    const normalizedProduct = normalizeTrialProduct(
      product,
      fallbackSlug,
      listingSource.category
    );

    return {
      legacySlugs: normalizedProduct.legacySlugs,
      slug: normalizedProduct.slug,
    };
  });

  return collectLegacyListingRedirects(listings, options);
}
