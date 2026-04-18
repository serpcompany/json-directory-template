import { render, screen } from '@/test/test-utils'
import { FeaturedProjectsSectionRoute as FeaturedProjectsSection } from '@thedaviddias/web-core/sections/featured-projects-section-route'
import { RecentlyAddedSectionRoute as RecentlyAddedSection } from '@thedaviddias/web-core/sections/recently-added-section-route'

jest.mock('@thedaviddias/web-core/llm/llm-grid', () => ({
  LLMGrid: ({ items }: { items: Array<{ slug: string }> }) => (
    <div data-testid="llm-grid">{items.map((item) => item.slug).join(',')}</div>
  )
}))

const sampleProjects = [
  {
    slug: 'alpha-tool',
    name: 'Alpha Tool',
    description: 'First project',
    website: 'https://alpha.example.com',
    category: 'developer-tools',
    publishedAt: '2026-03-22'
  },
  {
    slug: 'beta-tool',
    name: 'Beta Tool',
    description: 'Second project',
    website: 'https://beta.example.com',
    category: 'developer-tools',
    publishedAt: '2026-03-23'
  },
]

describe('homepage list sections', () => {
  it('renders featured listings section copy and passes projects to the grid', () => {
    render(<FeaturedProjectsSection projects={sampleProjects} />)

    expect(screen.getByRole('heading', { name: /featured listings/i })).toBeInTheDocument()
    expect(screen.getByText(/discover standout listings from this directory/i)).toBeInTheDocument()
    expect(screen.getByTestId('llm-grid')).toHaveTextContent('alpha-tool,beta-tool')
  })

  it('renders recently added copy and limits the list to the configured max items', () => {
    render(<RecentlyAddedSection websites={sampleProjects} maxItems={1} />)

    expect(screen.getByRole('heading', { name: /recently added/i })).toBeInTheDocument()
    expect(screen.getByText(/see the newest entries added to/i)).toBeInTheDocument()
    expect(screen.getByTestId('llm-grid')).toHaveTextContent('alpha-tool')
    expect(screen.getByTestId('llm-grid')).not.toHaveTextContent('beta-tool')
  })
})
