import { render, screen } from '@/test/test-utils'
import { FeaturedGuidesSection } from '@/components/sections/featured-guides-section'

jest.mock('@/components/sections/guide-card', () => ({
  GuideCard: ({ guide }: { guide: { title: string } }) => (
    <div data-testid="guide-card">{guide.title}</div>
  )
}))

describe('FeaturedGuidesSection', () => {
  it('renders featured guides through the package-owned section wrapper', () => {
    render(
      <FeaturedGuidesSection
        guides={[
          {
            authors: [],
            date: '2026-04-18',
            slug: 'starter-guide',
            title: 'Starter Guide',
            description: 'How to use the directory',
            category: 'getting-started',
            difficulty: 'beginner',
            published: true
          }
        ]}
      />
    )

    expect(screen.getByRole('heading', { name: /featured posts/i })).toBeInTheDocument()
    expect(screen.getByTestId('guide-card')).toHaveTextContent('Starter Guide')
  })
})
