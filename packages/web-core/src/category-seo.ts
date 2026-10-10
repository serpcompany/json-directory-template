import type { Category } from './categories'
import { getCategoryDisplayName } from './category-display'
import { siteCopy } from './site-copy'

interface CategorySEOConfig {
  keywords: string[]
  h1Title: string
  introText: string
  faqQuestions?: Array<{
    question: string
    answer: string
  }>
}

function toKeywordValue(value: string): string {
  return value.trim().toLowerCase()
}

// Google shows roughly the first 60 characters of a title and 160 of a description.
export const CATEGORY_TITLE_MAX_LENGTH = 60
export const CATEGORY_DESCRIPTION_MAX_LENGTH = 160

/** `1 Product`, `338 Products`: the exact count with the singular or plural listing name. */
export function formatListingCount(
  listingCount: number,
  options: { title?: boolean } = {}
): string {
  const { listingName } = siteCopy
  const noun =
    listingCount === 1
      ? options.title
        ? listingName.singularTitle
        : listingName.singular
      : options.title
        ? listingName.pluralTitle
        : listingName.plural

  return `${listingCount} ${noun}`
}

/**
 * Category page `<title>` text (the root layout appends ` | <site name>`). Uses the most
 * descriptive form whose full rendered title fits in 60 characters:
 * `<Category>: <n> <Listings>`, then `<Category> (<n>)`, then `<Category>`. The category name
 * keeps its configured casing.
 */
export function buildCategoryMetaTitle(options: {
  categoryName: string
  listingCount: number
  siteName: string
}): string {
  const { categoryName, listingCount, siteName } = options
  const candidates =
    listingCount > 0
      ? [
          `${categoryName}: ${formatListingCount(listingCount, { title: true })}`,
          `${categoryName} (${listingCount})`,
          categoryName
        ]
      : [`${categoryName} ${siteCopy.listingName.pluralTitle}`, categoryName]

  return (
    candidates.find(
      candidate => `${candidate} | ${siteName}`.length <= CATEGORY_TITLE_MAX_LENGTH
    ) ?? categoryName
  )
}

function toSentence(value: string): string {
  const trimmedValue = value.trim()

  return /[.!?]$/.test(trimmedValue) ? trimmedValue : `${trimmedValue}.`
}

/**
 * First sentence of a category meta description, e.g. `Explore 9 products in Course Platform
 * Downloaders.` The category name keeps its casing (GIF, TV) and is not followed by the listing
 * noun, which would double it ("downloaders products").
 */
export function buildCategoryCountSentence(categoryName: string, listingCount: number): string {
  return listingCount > 0
    ? `Explore ${formatListingCount(listingCount)} in ${categoryName}.`
    : `Explore ${siteCopy.listingName.plural} in ${categoryName}.`
}

/**
 * Joins whole sentences until the next one would pass 160 characters, so the description never
 * ends mid-word. Only a first sentence that is itself too long is shortened at a word boundary.
 */
export function buildCategoryMetaDescription(sentences: string[]): string {
  const completeSentences = sentences.filter(sentence => sentence.trim()).map(toSentence)
  let description = ''

  for (const sentence of completeSentences) {
    const nextDescription = description ? `${description} ${sentence}` : sentence

    if (nextDescription.length > CATEGORY_DESCRIPTION_MAX_LENGTH) {
      break
    }

    description = nextDescription
  }

  if (description) {
    return description
  }

  const firstSentence = completeSentences[0] ?? ''
  const truncated = firstSentence.slice(0, CATEGORY_DESCRIPTION_MAX_LENGTH - 3)

  return `${truncated.slice(0, truncated.lastIndexOf(' '))}...`
}

export function getCategorySEO(_slug: string, category: Category): CategorySEOConfig {
  const categoryName = getCategoryDisplayName(category.slug)
  const categoryDescription = category.description

  return {
    keywords: [
      toKeywordValue(categoryName),
      `${toKeywordValue(categoryName)} ${siteCopy.listingName.plural}`,
      `directory ${siteCopy.listingName.plural}`,
      'listing directory',
      'curated resources'
    ],
    h1Title: categoryName,
    introText: categoryDescription
  }
}
