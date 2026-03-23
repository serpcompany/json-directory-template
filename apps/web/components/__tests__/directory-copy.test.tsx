import { render, screen } from '@/test/test-utils'
import { StaticWebsitesList } from '@/components/static-websites-list'
import { WebsitesListWithSearch } from '@/components/websites-list-with-search'

jest.mock('@/components/analytics-tracker', () => ({
  useAnalyticsEvents: () => ({
    trackSearch: jest.fn(),
    trackSortChange: jest.fn()
  })
}))

jest.mock('@/hooks/use-favorites-filter', () => ({
  useFavoritesFilter: (websites: unknown[]) => ({
    favoriteWebsites: websites,
    hasFavorites: false
  })
}))

jest.mock('@/components/llm/llm-grid', () => ({
  LLMGrid: () => <div data-testid="llm-grid" />
}))

const sampleWebsite = {
  slug: 'example-project',
  name: 'Example Project',
  description: 'A test directory entry',
  website: 'https://example.com',
  llmsUrl: 'https://example.com/llms.txt',
  llmsFullUrl: null,
  category: 'developer-tools',
  publishedAt: '2026-03-22'
}

describe('directory copy', () => {
  it('uses generic directory copy on the homepage listing section', () => {
    render(<StaticWebsitesList websites={[sampleWebsite]} totalCount={1} />)

    expect(screen.getByRole('heading', { name: /browse the directory/i })).toBeInTheDocument()
    expect(screen.getByText(/search by name, category, or description/i)).toBeInTheDocument()
  })

  it('uses neutral empty-state copy for directory listings', () => {
    render(<WebsitesListWithSearch initialWebsites={[]} />)

    expect(screen.getByRole('heading', { name: /no entries found/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /submit a website/i })).toBeInTheDocument()
  })
})
