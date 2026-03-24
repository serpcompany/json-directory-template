import { render, screen } from '@/test/test-utils'
import ProjectsPage, { metadata } from '@/app/projects/page'
import { siteConfig } from '@/lib/site-config'

jest.mock('@thedaviddias/design-system/breadcrumb', () => ({
  Breadcrumb: () => <nav aria-label="breadcrumb" />
}))

describe('ProjectsPage', () => {
  it('uses generic resource-page metadata instead of starter brand residue', () => {
    expect(metadata.title).toBe('Projects')
    expect(metadata.description).toBe(
      `Explore related projects, repositories, and contribution links for ${siteConfig.name}.`
    )
  })

  it('renders listing-neutral wrapper copy for the projects page', () => {
    render(<ProjectsPage />)

    expect(screen.getByRole('heading', { name: /^projects$/i })).toBeInTheDocument()
    expect(
      screen.getByText(/browse related repositories and external resources connected to this directory/i)
    ).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /submit a listing/i })).toBeInTheDocument()
    expect(screen.queryByText(/our brands/i)).not.toBeInTheDocument()
    expect(screen.queryByRole('link', { name: /submit website/i })).not.toBeInTheDocument()
  })
})
