import type { Category } from '@/lib/categories'

interface CategorySEOConfig {
  metaTitle: string
  metaDescription: string
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

export function getCategorySEO(_slug: string, category: Category): CategorySEOConfig {
  const categoryName = category.name
  const categoryDescription = category.description

  return {
    metaTitle: `${categoryName} Websites & Tools Directory`,
    metaDescription: `Discover curated ${toKeywordValue(categoryName)} websites, tools, and resources. ${categoryDescription}`,
    keywords: [
      toKeywordValue(categoryName),
      `${toKeywordValue(categoryName)} directory`,
      'website directory',
      'tools directory',
      'curated resources'
    ],
    h1Title: categoryName,
    introText: categoryDescription
  }
}
