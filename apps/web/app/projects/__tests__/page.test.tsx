import { render, screen } from '@/test/test-utils'
import ProjectsPage, { metadata } from '@/app/projects/page'
import { siteConfig } from '@/lib/site-config'

jest.mock('@thedaviddias/design-system/breadcrumb', () => ({
  Breadcrumb: () => <nav aria-label="breadcrumb" />
}))

describe('ProjectsPage', () => {
  it('uses the configured public network metadata instead of the old projects copy', () => {
    expect(metadata.title).toBe(siteConfig.copy.networkLabel)
    expect(metadata.description).toBe(
      `Explore related brands, repositories, partners, and contribution links for ${siteConfig.name}.`
    )
  })

  it('renders listing-neutral network copy for the public route', () => {
    render(<ProjectsPage />)

    expect(
      screen.getByRole('heading', { name: new RegExp(`^${siteConfig.copy.networkLabel}$`, 'i') })
    ).toBeInTheDocument()
    expect(
      screen.getByText(/browse linked brands, repositories, partner sites, and related resources/i)
    ).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /submit a listing/i })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /issue tracker/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /view repository/i })).toHaveAttribute(
      'href',
      siteConfig.githubRepoUrl
    )
    expect(screen.queryByText(/our brands/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/llms-txt topic/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/llmstxt topic/i)).not.toBeInTheDocument()
    expect(screen.queryByRole('link', { name: /submit website/i })).not.toBeInTheDocument()
  })
})
