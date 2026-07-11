import { Header } from '@thedaviddias/web-core/layout/header'
import { siteConfig } from '@thedaviddias/web-core/site-config'
import { siteCopy } from '@thedaviddias/web-core/site-copy'
import { render, screen } from '@/test/test-utils'

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

describe('Header', () => {
  it('renders the site name from site config in the logo', () => {
    render(<Header />)

    expect(screen.getByRole('link', { name: siteConfig.name })).toHaveAttribute('href', '/')
  })

  it('uses the configured submit label for the primary CTA', () => {
    render(<Header />)

    const submitLink = screen.getByRole('link', { name: siteCopy.submitLabel })
    expect(submitLink).toHaveAttribute('href', '/submit/')
    expect(submitLink).toHaveAttribute('title', siteCopy.submitLabel)
    expect(submitLink).toHaveClass('rounded-none', 'h-9')
    expect(submitLink).toHaveAttribute('data-slot', 'button')
  })

  it('uses shadcn button controls for mobile menu and search triggers', () => {
    render(<Header />)

    const menuButton = screen.getByRole('button', { name: /open menu/i })
    const searchButton = screen.getByRole('button', { name: /toggle search/i })

    expect(menuButton).toHaveAttribute('type', 'button')
    expect(menuButton).toHaveAttribute('data-slot', 'button')
    expect(searchButton).toHaveAttribute('type', 'button')
    expect(searchButton).toHaveAttribute('data-slot', 'button')
  })

  it('does not render the GitHub menu bar action', () => {
    render(<Header />)

    expect(screen.queryByRole('link', { name: /github/i })).not.toBeInTheDocument()
  })
})
