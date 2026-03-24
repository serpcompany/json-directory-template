import { render, screen } from '@/test/test-utils'
import { Footer } from '@/components/layout/footer'
import { siteCopy } from '@/lib/site-copy'
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

    expect(screen.getByRole('link', { name: siteCopy.allLabel })).toHaveAttribute(
      'href',
      '/#all-listings'
    )
    expect(screen.getByRole('link', { name: siteCopy.submitLabel })).toHaveAttribute(
      'href',
      '/submit'
    )

    if (siteConfig.features.showProjects) {
      expect(screen.getByRole('link', { name: 'Projects' })).toHaveAttribute('href', '/projects')
    } else {
      expect(screen.queryByRole('link', { name: 'Projects' })).not.toBeInTheDocument()
    }

    if (siteConfig.features.showDocs) {
      expect(screen.getByRole('link', { name: 'Docs' })).toHaveAttribute('href', '/docs')
    } else {
      expect(screen.queryByRole('link', { name: 'Docs' })).not.toBeInTheDocument()
    }

    if (siteConfig.features.showGuides) {
      expect(screen.getByRole('link', { name: 'Guides' })).toHaveAttribute('href', '/guides')
    } else {
      expect(screen.queryByRole('link', { name: 'Guides' })).not.toBeInTheDocument()
    }

    expect(screen.queryByRole('link', { name: 'Advertise' })).not.toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Brands' })).not.toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'About' })).toHaveAttribute('href', '/about')
    expect(screen.queryByRole('link', { name: 'FAQ' })).not.toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Privacy' })).toHaveAttribute(
      'href',
      '/legal/privacy'
    )
    expect(screen.getByRole('link', { name: 'Terms' })).toHaveAttribute('href', '/legal/terms')
    expect(screen.getByRole('link', { name: 'Cookies' })).toHaveAttribute(
      'href',
      '/legal/cookies'
    )
  })
})
