import { z } from 'zod';
import { isValidAssetReference } from './asset-reference';
import { normalizeCategorySlug } from './categories';

const publishedAtPattern = /^\d{4}-\d{2}-\d{2}$/;

export const websitePrioritySchema = z.enum(['high', 'medium', 'low']);
export const websiteResourceLinkSchema = z.object({
  label: z.string().trim().min(1, 'resourceLinks.label is required'),
  url: z.string().url('resourceLinks.url must be a valid URL'),
});
export const websiteMediaSchema = z
  .object({
    images: z
      .array(
        z.string().refine(isValidAssetReference, {
          message:
            'media.images must contain valid HTTPS URLs or root-relative asset paths',
        })
      )
      .optional(),
    logo: z
      .string()
      .refine(isValidAssetReference, {
        message:
          'media.logo must be a valid HTTPS URL or root-relative asset path',
      })
      .optional(),
    video: z
      .string()
      .refine(isValidAssetReference, {
        message:
          'media.video must be a valid HTTPS URL or root-relative asset path',
      })
      .optional(),
  })
  .refine(
    (media) => Boolean(media.images?.length || media.logo || media.video),
    {
      message: 'media must include at least one URL',
    }
  );

export const websiteJsonEntrySchema = z
  .object({
    category: z.string().trim().min(1, 'category must not be empty').optional(),
    categories: z
      .array(
        z.string().trim().min(1, 'categories must not contain empty slugs')
      )
      .min(1, 'categories must include at least one slug')
      .optional(),
    content: z.string().min(1, 'content must not be empty').optional(),
    description: z.string().trim().min(1, 'description is required'),
    domain: z.string().url('domain must be a valid URL').optional(),
    entityType: z
      .string()
      .trim()
      .regex(/^[a-z0-9-]+$/, 'entityType must use kebab-case')
      .optional(),
    favicon: z.string().url('favicon must be a valid URL').optional(),
    featured: z.boolean().optional(),
    isUnofficial: z.boolean().optional(),
    media: websiteMediaSchema.optional(),
    name: z.string().trim().min(1, 'name is required'),
    priority: websitePrioritySchema.optional(),
    publishedAt: z
      .string()
      .regex(publishedAtPattern, 'publishedAt must use YYYY-MM-DD format'),
    resourceLinks: z.array(websiteResourceLinkSchema).optional(),
    slug: z.string().trim().min(1, 'slug must not be empty').optional(),
    website: z.string().url('website must be a valid URL').optional(),
  })
  .superRefine((entry, context) => {
    if (!entry.category && (!entry.categories || entry.categories.length === 0)) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'category or categories is required',
        path: ['categories'],
      });
    }

    if (!entry.website && !entry.domain) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'website or domain is required',
        path: ['website'],
      });
    }
  });

export const websiteJsonEntriesSchema = z.array(websiteJsonEntrySchema);

export type WebsiteJsonEntry = z.infer<typeof websiteJsonEntrySchema>;
export type WebsiteMedia = z.infer<typeof websiteMediaSchema>;
export type WebsitePriority = z.infer<typeof websitePrioritySchema>;
export type WebsiteResourceLink = z.infer<typeof websiteResourceLinkSchema>;

export interface NormalizedWebsiteEntry {
  category: string;
  categories: string[];
  content?: string;
  description: string;
  entityType?: string;
  featured?: boolean;
  isUnofficial?: boolean;
  media?: WebsiteMedia;
  name: string;
  priority?: WebsitePriority;
  publishedAt: string;
  resourceLinks?: WebsiteResourceLink[];
  slug: string;
  website: string;
}

function slugifyWebsiteName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/--+/g, '-');
}

function normalizeJsonCategory(category?: string): string | undefined {
  if (!category) {
    return undefined;
  }

  return normalizeCategorySlug(category);
}

function normalizeJsonCategories(
  category?: string,
  categories?: string[]
): string[] {
  const normalizedCategories = [category, ...(categories || [])]
    .map(normalizeJsonCategory)
    .filter(Boolean);

  return [...new Set(normalizedCategories)] as string[];
}

function sanitizeWebsiteDescription(description: string): string {
  return description
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function normalizeContentForComparison(value: string): string {
  return value
    .replace(/^#+\s*/gm, ' ')
    .replace(/`{1,3}[\s\S]*?`{1,3}/g, ' ')
    .replace(/\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/<[^>]*>/g, ' ')
    .replace(/[>*_~-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

function normalizeJsonContent(
  content: string | undefined,
  description: string
): string | undefined {
  if (!content) {
    return undefined;
  }

  const trimmedContent = content.trim();

  if (!trimmedContent) {
    return undefined;
  }

  const normalizedDescription = normalizeContentForComparison(description);
  const normalizedContent = normalizeContentForComparison(trimmedContent);
  const normalizedOverviewContent = normalizedContent.replace(
    /^overview\s+/,
    ''
  );
  const markdownSectionCount = (trimmedContent.match(/^##\s+/gm) || []).length;

  if (
    normalizedContent === normalizedDescription ||
    (markdownSectionCount <= 1 &&
      normalizedOverviewContent === normalizedDescription)
  ) {
    return undefined;
  }

  return trimmedContent;
}

export function parseJsonWebsiteEntries(input: unknown): WebsiteJsonEntry[] {
  const result = websiteJsonEntriesSchema.safeParse(input);

  if (result.success) {
    return result.data;
  }

  const details = result.error.issues
    .map((issue) => {
      const path = issue.path.length > 0 ? issue.path.join('.') : 'root';
      return `${path}: ${issue.message}`;
    })
    .join('; ');

  throw new Error(`Invalid data/listings.json shape: ${details}`);
}

export function normalizeJsonWebsite(
  entry: WebsiteJsonEntry
): NormalizedWebsiteEntry {
  const categories = normalizeJsonCategories(entry.category, entry.categories);
  const category = categories[0];
  const description = sanitizeWebsiteDescription(entry.description);

  if (!category) {
    throw new Error(
      'Invalid data/listings.json shape: category or categories is required'
    );
  }

  return {
    category,
    categories,
    content: normalizeJsonContent(entry.content, description),
    description,
    entityType: entry.entityType,
    featured: entry.featured,
    isUnofficial: entry.isUnofficial,
    media: entry.media,
    name: entry.name,
    priority: entry.priority,
    publishedAt: entry.publishedAt,
    resourceLinks: entry.resourceLinks,
    slug: entry.slug || slugifyWebsiteName(entry.name),
    website: entry.website || entry.domain || '',
  };
}
