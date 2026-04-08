import defaultCategories from './default/categories.json';
import serpCoCategories from './serp.co/categories.json';
import serpSoftwareCategories from './serp.software/categories.json';
import serpdownloadersCategories from './serpdownloaders.com/categories.json';
import { defaultSiteConfig } from './site-config.default';
import type { SiteCategoryInput } from './types';

const siteCategoriesById: Record<string, SiteCategoryInput[]> = {
  'serp.co': serpCoCategories as SiteCategoryInput[],
  'serp.software': serpSoftwareCategories as SiteCategoryInput[],
  'serpdownloaders.com': serpdownloadersCategories as SiteCategoryInput[],
};

export const defaultSiteCategories = defaultCategories as SiteCategoryInput[];

export function resolveCheckedInSiteCategories(
  siteId?: string
): SiteCategoryInput[] {
  if (!siteId || siteId === defaultSiteConfig.id) {
    return defaultSiteCategories;
  }

  return siteCategoriesById[siteId] ?? defaultSiteCategories;
}
