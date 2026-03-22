import { render, screen } from '@/test/test-utils'
import { Header } from '@/components/layout/header'
import { siteConfig } from '@/lib/site-config'

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

describe('Header', () => {
  it('renders the site name from site config in the logo', () => {
    render(<Header />)

    expect(screen.getByRole('link', { name: siteConfig.name })).toHaveAttribute('href', '/')
  })
})
