import { render, screen } from '@/test/test-utils'
import { MobileDrawer } from '@/components/layout/mobile-drawer'
import { siteCopy } from '@/lib/site-copy'

jest.mock('@/components/auth/sign-out-button', () => ({
  SignOutButton: () => <button type="button">Sign out</button>
}))

jest.mock('@/components/ui/favorites-link', () => ({
  FavoritesLink: () => <a href="/favorites">Favorites</a>
}))

describe('MobileDrawer', () => {
  it('uses the configured submit and all-items labels', () => {
    render(<MobileDrawer isOpen={true} onClose={jest.fn()} />)

    expect(screen.getByRole('link', { name: siteCopy.submitLabel })).toHaveAttribute(
      'href',
      '/submit'
    )
    expect(screen.getByRole('link', { name: siteCopy.allLabel })).toHaveAttribute(
      'href',
      '#all-listings'
    )
  })

  it('hides external tool links when developer tools are disabled for the site', () => {
    render(<MobileDrawer isOpen={true} onClose={jest.fn()} />)

    expect(screen.queryByRole('heading', { name: 'Tools' })).not.toBeInTheDocument()
    expect(screen.queryByText('Chrome Extension')).not.toBeInTheDocument()
  })
})
