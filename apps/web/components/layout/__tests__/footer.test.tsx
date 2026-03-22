import { render, screen } from '@/test/test-utils'
import { Footer } from '@/components/layout/footer'
import { siteConfig } from '@/lib/site-config'

jest.mock('@/components/mode-toggle', () => ({
  ModeToggle: () => <button type="button">Toggle theme</button>
}))

describe('Footer', () => {
  it('renders the current site config values', () => {
    render(<Footer />)

    expect(screen.getByText(siteConfig.name)).toBeInTheDocument()
    expect(screen.getByText(siteConfig.tagline)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /GitHub/ })).toHaveAttribute(
      'href',
      siteConfig.githubUrl
    )
    expect(screen.getByRole('link', { name: /Reddit/ })).toHaveAttribute(
      'href',
      siteConfig.redditUrl
    )
    expect(screen.getByRole('link', { name: /X.*Twitter/ })).toHaveAttribute(
      'href',
      siteConfig.twitterUrl
    )

    const badgeImage = screen.getByRole('img', { name: siteConfig.drBadge.alt })
    expect(badgeImage).toHaveAttribute('src', siteConfig.drBadge.imageSrc)
    expect(badgeImage.closest('a')).toHaveAttribute('href', siteConfig.drBadge.href)
  })
})
