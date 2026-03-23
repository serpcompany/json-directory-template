import { render, screen } from '@/test/test-utils'
import { WebsiteLLMsSection } from '@/components/website/website-llms-section'
import { WebsiteRelatedProjects } from '@/components/website/website-related-projects'

jest.mock('@/components/ui/favorite-button', () => ({
  FavoriteButton: () => <div data-testid="favorite-button" />
}))

const sampleWebsite = {
  slug: 'example-project',
  name: 'Example Project',
  description: 'A test directory entry',
  website: 'https://example.com',
  llmsUrl: 'https://example.com/llms.txt',
  llmsFullUrl: 'https://example.com/llms-full.txt',
  category: 'developer-tools',
  publishedAt: '2026-03-22'
}

describe('website surface copy', () => {
  it('uses generic documentation copy for file links', () => {
    render(<WebsiteLLMsSection website={sampleWebsite} />)

    expect(screen.getByRole('heading', { name: /documentation links/i })).toBeInTheDocument()
    expect(screen.getByText(/published llms\.txt files for this entry/i)).toBeInTheDocument()
  })

  it('uses generic related-entry copy on website detail pages', () => {
    render(<WebsiteRelatedProjects websites={[sampleWebsite]} />)

    expect(screen.getByRole('heading', { name: /related entries/i })).toBeInTheDocument()
    expect(screen.getByText(/similar entries in the directory/i)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /browse the directory/i })).toBeInTheDocument()
  })
})
