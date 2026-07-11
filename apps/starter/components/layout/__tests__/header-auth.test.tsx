import { Header } from '@thedaviddias/web-core/layout/header'
import { render, screen } from '@/test/test-utils'

jest.mock('@thedaviddias/web-core/site-config', () => {
  const actual = jest.requireActual('@thedaviddias/web-core/site-config')

  return {
    ...actual,
    siteConfig: {
      ...actual.siteConfig,
      features: {
        ...actual.siteConfig.features,
        showAuth: true
      }
    }
  }
})

jest.mock('@thedaviddias/web-core/root-shell-client', () => ({
  useAnalyticsEvents: () => ({
    trackSearch: jest.fn()
  })
}))

jest.mock('@thedaviddias/web-core/hooks/use-search', () => ({
  useSearch: () => ({
    searchQuery: '',
    setSearchQuery: jest.fn(),
    handleSearch: jest.fn()
  })
}))

jest.mock('@thedaviddias/web-core/layout/header-search', () => ({
  DesktopSearchForm: () => <div data-testid="desktop-search" />,
  MobileSearchOverlay: () => null
}))

jest.mock('@thedaviddias/web-core/layout/mobile-drawer', () => ({
  MobileDrawer: () => null
}))

jest.mock('@thedaviddias/web-core/layout/header-nav-link', () => ({
  NavLink: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  )
}))

describe('Header auth actions', () => {
  it('shows a combined sign up and sign in link when signed out', () => {
    render(<Header authState={{ isAuthenticated: false }} />)

    const loginLink = screen.getByRole('link', { name: /sign up \/ sign in/i })
    expect(loginLink).toHaveAttribute('href', '/login/')
    expect(loginLink).toHaveAttribute('data-slot', 'button')
  })

  it('shows account and sign out actions when signed in', () => {
    render(
      <Header
        authState={{
          isAuthenticated: true,
          user: {
            image: null,
            name: 'Devin'
          }
        }}
        desktopSignOutButton={<button type="button">Sign out</button>}
      />
    )

    const accountLink = screen.getByRole('link', { name: /account/i })
    expect(accountLink).toHaveAttribute('href', '/account/')
    expect(accountLink).toHaveAttribute('data-slot', 'button')
    expect(screen.getByRole('button', { name: /sign out/i })).toBeInTheDocument()
  })
})
