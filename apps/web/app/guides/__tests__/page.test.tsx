import { render, screen } from '@/test/test-utils'
import GuidesPage, { metadata } from '@/app/guides/page'
import { siteConfig } from '@/lib/site-config'

jest.mock('@thedaviddias/design-system/breadcrumb', () => ({
  Breadcrumb: () => <nav aria-label="breadcrumb" />
}))

jest.mock('@/components/json-ld', () => ({
  JsonLd: () => null
}))

jest.mock('@/lib/content-loader', () => ({
  getGuides: jest.fn(async () => [])
}))

describe('GuidesPage', () => {
  it('uses generic guide metadata instead of llms-specific wrapper copy', () => {
    expect(metadata.title).toBe('Guides')
    expect(metadata.description).toBe(
      `Browse implementation guides, walkthroughs, and reference notes for ${siteConfig.name}.`
    )
    expect(metadata.keywords).not.toContain('llms.txt guides')
  })

  it('renders listing-neutral wrapper copy for the guides index', async () => {
    render(await GuidesPage())

    expect(screen.getByRole('heading', { name: /^guides$/i })).toBeInTheDocument()
    expect(
      screen.getByText(/browse walkthroughs, implementation notes, and reference guides for this directory/i)
    ).toBeInTheDocument()
    expect(
      screen.getByText(/guides will appear here when this site publishes them/i)
    ).toBeInTheDocument()
    expect(screen.queryByText(/llms\.txt/i)).not.toBeInTheDocument()
  })
})
