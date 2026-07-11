import { existsSync, readFileSync } from 'node:fs';
import { resolveCheckedInSiteConfig } from './index';
import { resolveCheckedInSiteSourcePath } from './checked-in-site-source-path';

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

  if (siteConfig.content.listingSource.kind === 'd1-listings') {
    const seedSource = siteConfig.content.listingSource.seedSource;

    if (!seedSource || seedSource.kind !== 'trial-products-json') {
      return [];
    }

    return getTrialProductsRootListingAliases(
      resolveCheckedInSiteSourcePath(seedSource.path)
    );
  }

  const sourcePath = resolveCheckedInSiteSourcePath(
    siteConfig.content.listingSource.path
  );

  if (!existsSync(sourcePath)) {
    return [];
  }

  if (siteConfig.content.listingSource.kind === 'trial-products-json') {
    return getTrialProductsRootListingAliases(sourcePath);
  }

  if (siteConfig.content.listingSource.kind === 'listing-json') {
    const listings = JSON.parse(readFileSync(sourcePath, 'utf8')) as ListingJsonEntry[];

    return listings
      .map((entry) => entry.slug?.trim())
      .filter((slug): slug is string => Boolean(slug));
  }

  return [];
}

function getTrialProductsRootListingAliases(sourcePath: string): string[] {
  const products = JSON.parse(readFileSync(sourcePath, 'utf8')) as Record<
    string,
    TrialProductsJsonEntry
  >;

  return Object.values(products)
    .map((entry) => entry.product?.slug?.trim())
    .filter((slug): slug is string => Boolean(slug));
}
