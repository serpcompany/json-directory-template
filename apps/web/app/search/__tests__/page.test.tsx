import { render, screen } from '@/test/test-utils'
import SearchPage, { generateMetadata } from '@/app/search/page'
import { siteConfig } from '@/lib/site-config'

jest.mock('@/components/search/search-results', () => ({
  SearchResults: () => <div>Search Results</div>
}))

describe('SearchPage', () => {
  it('omits the external resources nav when external resources are disabled', () => {
    render(<SearchPage />)

    expect(screen.queryByRole('heading', { name: 'Resources' })).not.toBeInTheDocument()
    expect(screen.queryByText('Chrome Extension')).not.toBeInTheDocument()
    expect(screen.getByText(/searching across all listings/i)).toBeInTheDocument()
    expect(screen.queryByText(/searching across all listings and tools/i)).not.toBeInTheDocument()
  })

  it('uses listing-neutral search metadata copy', async () => {
    const metadata = await generateMetadata()

    expect(metadata.description).toBe(`Search for listings and resources in ${siteConfig.name}.`)
  })
})
