import { getCategoryDisplayName } from './category-display';
import type { Category } from './categories';
import { siteCopy } from './site-copy';

interface CategorySEOConfig {
  metaTitle: string;
  metaDescription: string;
  keywords: string[];
  h1Title: string;
  introText: string;
  faqQuestions?: Array<{
    question: string;
    answer: string;
  }>;
}

function toKeywordValue(value: string): string {
  return value.trim().toLowerCase();
}

// Google shows roughly the first 60 characters of a title and 160 of a description.
export const CATEGORY_TITLE_MAX_LENGTH = 60;
export const CATEGORY_DESCRIPTION_MAX_LENGTH = 160;

/**
 * Category page `<title>` text (the root layout appends ` | <site name>`). Uses the most
 * descriptive form whose full rendered title fits in 60 characters:
 * `<Category>: <n>+ <Listings>`, then `<Category> (<n>+)`, then `<Category>`.
 */
export function buildCategoryMetaTitle(options: {
  categoryName: string;
  listingCount: number;
  siteName: string;
}): string {
  const { categoryName, listingCount, siteName } = options;
  const candidates =
    listingCount > 0
      ? [
          `${categoryName}: ${listingCount}+ ${siteCopy.listingName.pluralTitle}`,
          `${categoryName} (${listingCount}+)`,
          categoryName,
        ]
      : [`${categoryName} ${siteCopy.listingName.pluralTitle}`, categoryName];

  return (
    candidates.find(
      (candidate) => `${candidate} | ${siteName}`.length <= CATEGORY_TITLE_MAX_LENGTH
    ) ?? categoryName
  );
}

function toSentence(value: string): string {
  const trimmedValue = value.trim();

  return /[.!?]$/.test(trimmedValue) ? trimmedValue : `${trimmedValue}.`;
}

/**
 * Joins whole sentences until the next one would pass 160 characters, so the description never
 * ends mid-word. Only a first sentence that is itself too long is shortened at a word boundary.
 */
export function buildCategoryMetaDescription(sentences: string[]): string {
  const completeSentences = sentences.filter((sentence) => sentence.trim()).map(toSentence);
  let description = '';

  for (const sentence of completeSentences) {
    const nextDescription = description ? `${description} ${sentence}` : sentence;

    if (nextDescription.length > CATEGORY_DESCRIPTION_MAX_LENGTH) {
      break;
    }

    description = nextDescription;
  }

  if (description) {
    return description;
  }

  const firstSentence = completeSentences[0] ?? '';
  const truncated = firstSentence.slice(0, CATEGORY_DESCRIPTION_MAX_LENGTH - 3);

  return `${truncated.slice(0, truncated.lastIndexOf(' '))}...`;
}

export function getCategorySEO(
  _slug: string,
  category: Category
): CategorySEOConfig {
  const categoryName = getCategoryDisplayName(category.slug);
  const categoryDescription = category.description;

  return {
    metaTitle: `${categoryName} ${siteCopy.listingName.pluralTitle} Directory`,
    metaDescription: `Discover curated ${toKeywordValue(categoryName)} ${
      siteCopy.listingName.plural
    } and resources. ${categoryDescription}`,
    keywords: [
      toKeywordValue(categoryName),
      `${toKeywordValue(categoryName)} ${siteCopy.listingName.plural}`,
      `directory ${siteCopy.listingName.plural}`,
      'listing directory',
      'curated resources',
    ],
    h1Title: categoryName,
    introText: categoryDescription,
  };
}
