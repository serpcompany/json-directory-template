import { render, screen } from '@/test/test-utils'
import { AppSidebar } from '@/components/layout/app-sidebar'
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
})
