import { render, screen } from '@/test/test-utils'
import { CategoryWebsitesListRoute as CategoryWebsitesList } from '@thedaviddias/web-core/category-websites-list-route'
import { StaticWebsitesListRoute as StaticWebsitesList } from '@thedaviddias/web-core/sections/static-websites-list-route'
import { WebsitesListWithSortRoute as WebsitesListWithSort } from '@thedaviddias/web-core/websites-list-with-sort-route'
import { WebsitesListWithSearchRoute as WebsitesListWithSearch } from '@thedaviddias/web-core/websites-list-with-search-route'
import { siteCopy } from '@thedaviddias/web-core/site-copy'

jest.mock('@thedaviddias/web-core/root-shell-client', () => ({
  useAnalyticsEvents: () => ({
    trackSearch: jest.fn(),
    trackSortChange: jest.fn()
  })
}))

jest.mock('@thedaviddias/web-core/hooks/use-favorites-filter', () => ({
  useFavoritesFilter: (websites: unknown[]) => ({
    favoriteWebsites: websites,
    hasFavorites: false
  })
}))

jest.mock('@thedaviddias/web-core/llm/llm-grid', () => ({
  LLMGrid: () => <div data-testid="llm-grid" />
}))

const sampleWebsite = {
  slug: 'example-project',
  name: 'Example Project',
  description: 'A test directory entry',
  website: 'https://example.com',
  category: 'developer-tools',
  publishedAt: '2026-03-22'
}

describe('directory copy', () => {
  it('uses generic directory copy on the homepage listing section', () => {
    render(<StaticWebsitesList websites={[sampleWebsite]} totalCount={1} />)

    expect(screen.getByRole('heading', { name: /browse the directory/i })).toHaveAttribute(
      'id',
      'all-listings'
    )
    expect(screen.getByText(/search by name, category, or description/i)).toBeInTheDocument()
  })

  it('uses neutral empty-state copy for directory listings', () => {
    render(<WebsitesListWithSearch initialWebsites={[]} />)

    expect(screen.getByRole('heading', { name: /no entries found/i })).toBeInTheDocument()
    expect(
      screen.getByText(/there are no directory entries available\. try checking back later or submit a listing\./i)
    ).toBeInTheDocument()
    expect(screen.getByRole('link', { name: siteCopy.submitLabel })).toBeInTheDocument()
  })

  it('uses listing terminology for category empty states', () => {
    render(<CategoryWebsitesList initialWebsites={[]} />)

    expect(screen.getByRole('heading', { name: /no listings found/i })).toBeInTheDocument()
    expect(
      screen.getByText(
        /there are no listings in this category yet\. try checking back later or submit a listing\./i
      )
    ).toBeInTheDocument()
    expect(screen.getByRole('link', { name: siteCopy.submitLabel })).toBeInTheDocument()
  })

  it('uses listing terminology in category result counts', () => {
    render(<WebsitesListWithSort initialWebsites={[sampleWebsite]} />)

    expect(screen.getByText(/showing 1 listings in this category/i)).toBeInTheDocument()
  })
})
