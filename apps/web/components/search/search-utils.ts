/**
 * Utility functions for search functionality
 */

import { logger } from '@thedaviddias/logging';
import type { SearchIndexEntry } from '@/lib/search-index';

export interface WebsiteMetadata {
  url: string;
  slug: string;
  website: string;
  name: string;
  description: string;
  categories: string[];
  tags: string[];
  category: string;
  publishedAt: string;
}

/**
 * Check if an entry can be transformed to WebsiteMetadata
 *
 * @param entry - Search index entry
 * @returns Whether the entry can be transformed
 */
export function canTransformToWebsiteMetadata(
  entry: SearchIndexEntry
): boolean {
  try {
    // Explicitly exclude .DS_Store entries
    if (entry.slug.includes('.DS_Store') || entry.url.includes('.DS_Store')) {
      return false;
    }

    if (!entry.url || !entry.website) return false;
    if (!entry.name && !entry.description) return false;

    return true;
  } catch (error) {
    logger.error('Error checking entry validity:', {
      data: { error, entry },
      tags: { type: 'component' },
    });
    return false;
  }
}

/**
 * Transform a search index entry to WebsiteMetadata
 *
 * @param entry - Search index entry
 * @returns Transformed website metadata
 */
export function transformToWebsiteMetadata(
  entry: SearchIndexEntry
): WebsiteMetadata {
  try {
    const website = entry.website || '';
    const name = entry.name || 'Untitled';
    const description = entry.description || '';
    const categories = [
      ...(entry.category ? [entry.category] : []),
      ...(entry.categories || []),
    ].filter(Boolean);
    const uniqueCategories = [...new Set(categories)];

    return {
      url: entry.url,
      slug: entry.slug || '',
      website,
      name,
      description,
      categories: uniqueCategories,
      tags: [],
      category: uniqueCategories[0] || '',
      publishedAt: '',
    };
  } catch (error) {
    logger.error('Error transforming entry:', {
      data: { error, entry },
      tags: { type: 'component' },
    });

    // Return a safe fallback
    return {
      url: '',
      slug: '',
      website: '',
      name: 'Unknown',
      description: '',
      categories: [],
      tags: [],
      category: '',
      publishedAt: '',
    };
  }
}

/**
 * Check if an entry matches a search query
 *
 * @param entry - Search index entry
 * @param query - Search query
 * @returns Whether entry matches the query
 */
export function matchesSearchQuery(
  entry: SearchIndexEntry,
  query: string
): boolean {
  try {
    if (!query) return false;

    // Normalize the query
    const searchTerms = query.toLowerCase().trim().split(/\s+/);

    // Fields to search in
    const searchableFields = [
      entry.name?.toLowerCase(),
      entry.description?.toLowerCase(),
      entry.category?.toLowerCase(),
      entry.categories?.join(' ').toLowerCase(),
      entry.website?.toLowerCase(),
      entry.url?.toLowerCase(),
    ].filter(Boolean);

    // Check if all search terms match at least one field
    return searchTerms.every((term) =>
      searchableFields.some((field) => field?.includes(term))
    );
  } catch (error) {
    logger.error('Error matching query:', {
      data: { error, entry, query },
      tags: { type: 'component' },
    });
    return false;
  }
}
