import { render, screen } from '@/test/test-utils'
import { WebsiteRelatedProjects } from '@/components/website/website-related-projects'

jest.mock('@/components/llm/llm-grid', () => ({
  LLMGrid: ({ items }: { items: Array<{ name: string }> }) => (
    <div data-testid="llm-grid">{items.map(item => item.name).join(', ')}</div>
  )
}))

const relatedWebsites = [
  {
    slug: 'example-project',
    name: 'Example Project',
    description: 'A test directory entry',
    website: 'https://example.com',
    category: 'developer-tools',
    publishedAt: '2026-03-22'
  }
]

describe('WebsiteRelatedProjects', () => {
  it('renders related-entry copy through the package-owned related-projects wrapper', () => {
    render(<WebsiteRelatedProjects websites={relatedWebsites} />)

    expect(
      screen.getByRole('heading', { name: /related entries/i })
    ).toBeInTheDocument()
    expect(
      screen.getByText(/similar entries in the directory/i)
    ).toBeInTheDocument()
    expect(
      screen.getByRole('link', { name: /browse the directory/i })
    ).toBeInTheDocument()
    expect(screen.getByTestId('llm-grid')).toHaveTextContent('Example Project')
  })
})
