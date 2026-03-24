import { render, screen } from '@/test/test-utils'
import { AppSidebar } from '@/components/layout/app-sidebar'
import { categories } from '@/lib/categories'
import { siteCopy } from '@/lib/site-copy'

jest.mock('@/components/ui/favorites-link', () => ({
  FavoritesLink: () => <a href="/favorites">Favorites</a>
}))

describe('AppSidebar', () => {
  it('uses the configured all-items label in the home anchor link', () => {
    render(<AppSidebar />)

    expect(screen.getByRole('link', { name: siteCopy.allLabel })).toHaveAttribute(
      'href',
      '#all-listings'
    )
  })

  it('hides the external resources group when no external resources are configured', () => {
    render(<AppSidebar />)

    expect(screen.queryByRole('heading', { name: 'Resources' })).not.toBeInTheDocument()
    expect(screen.queryByText('Chrome Extension')).not.toBeInTheDocument()
  })

  it('renders only the active category links and hides featured when there are no featured listings', () => {
    render(
      <AppSidebar
        availableCategorySlugs={[categories[0]!.slug]}
        showFeaturedCategory={false}
      />
    )

    expect(screen.getByRole('link', { name: categories[0]!.name })).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'AI & Machine Learning' })).not.toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Featured' })).not.toBeInTheDocument()
  })
})
