import defaultCategories from '../../../sites/default/categories.json';
import serpdownloadersCategories from '../../../sites/serpdownloaders.com/categories.json';
import { assertSiteIdIsNotRemoved } from './active-site-ids';
import { defaultSiteConfig } from './default-site-config';
import type { SiteCategoryInput } from './types';

const siteCategoriesById: Record<string, SiteCategoryInput[]> = {
  'serpdownloaders.com': serpdownloadersCategories as SiteCategoryInput[],
};

export const defaultSiteCategories = defaultCategories as SiteCategoryInput[];

export function resolveCheckedInSiteCategories(
  siteId?: string
): SiteCategoryInput[] {
  if (!siteId || siteId === defaultSiteConfig.id) {
    return defaultSiteCategories;
  }

  assertSiteIdIsNotRemoved(siteId);

  return siteCategoriesById[siteId] ?? defaultSiteCategories;
}
