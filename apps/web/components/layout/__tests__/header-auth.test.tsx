import { render, screen } from '@/test/test-utils'
import { Header } from '@/components/layout/header'

jest.mock('@/lib/site-config', () => {
  const actual = jest.requireActual('@/lib/site-config')

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

jest.mock('next-auth/react', () => ({
  signIn: jest.fn(),
  signOut: jest.fn()
}))

jest.mock('@/components/analytics-tracker', () => ({
  useAnalyticsEvents: () => ({
    trackSearch: jest.fn()
  })
}))

jest.mock('@/hooks/use-search', () => ({
  useSearch: () => ({
    searchQuery: '',
    setSearchQuery: jest.fn(),
    handleSearch: jest.fn()
  })
}))

jest.mock('../header-search', () => ({
  DesktopSearchForm: () => <div data-testid="desktop-search" />,
  MobileSearchOverlay: () => null
}))

jest.mock('../mobile-drawer', () => ({
  MobileDrawer: () => null
}))

jest.mock('../header-nav-link', () => ({
  NavLink: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  )
}))

jest.mock('@/components/stats/github-stars', () => ({
  GithubStars: () => <div data-testid="github-stars" />
}))

describe('Header auth actions', () => {
  it('shows a combined sign up and sign in link when signed out', () => {
    render(<Header authState={{ isAuthenticated: false }} />)

    expect(screen.getByRole('link', { name: /sign up \/ sign in/i })).toHaveAttribute(
      'href',
      '/login'
    )
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
      />
    )

    expect(screen.getByRole('link', { name: /account/i })).toHaveAttribute('href', '/account')
    expect(screen.getByRole('button', { name: /sign out/i })).toBeInTheDocument()
  })
})
