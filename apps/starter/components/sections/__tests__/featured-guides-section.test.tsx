import { render, screen } from '@/test/test-utils'
import { FeaturedGuidesSectionRoute as FeaturedGuidesSection } from '@thedaviddias/web-core/sections/featured-guides-section-route'

jest.mock('@thedaviddias/web-core/sections/guide-card-route', () => ({
  GuideCardRoute: ({ guide }: { guide: { title: string } }) => (
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
