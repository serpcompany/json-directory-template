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
  it('uses post metadata instead of the old guides route copy', () => {
    expect(metadata.title).toBe('Posts')
    expect(metadata.description).toBe(
      `Browse posts, walkthroughs, and reference notes for ${siteConfig.name}.`
    )
    expect(metadata.keywords).not.toContain('llms.txt guides')
  })

  it('renders post-oriented wrapper copy for the public posts index', async () => {
    render(await GuidesPage())

    expect(screen.getByRole('heading', { name: /^posts$/i })).toBeInTheDocument()
    expect(
      screen.getByText(/browse posts, walkthroughs, and reference notes for this directory/i)
    ).toBeInTheDocument()
    expect(screen.getByText(/posts will appear here when this site publishes them/i)).toBeInTheDocument()
    expect(screen.queryByText(/llms\.txt/i)).not.toBeInTheDocument()
  })
})
