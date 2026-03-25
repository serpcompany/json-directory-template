import { getCategoryBySlug, type Category } from './categories';
import { siteConfig } from './site-config';

export interface DisplayCategory extends Category {
  displayName: string;
}

export function resolveCategoryDisplayName(
  slug: string,
  categoryLabels: Record<string, string> = {}
): string {
  const category = getCategoryBySlug(slug);

  return categoryLabels[slug] ?? category?.name ?? slug;
}

export function getCategoryDisplayName(slug: string): string {
  return resolveCategoryDisplayName(slug, siteConfig.copy.categoryLabels);
}

export function getDisplayCategory(category: Category): DisplayCategory {
  return {
    ...category,
    displayName: getCategoryDisplayName(category.slug),
  };
}
