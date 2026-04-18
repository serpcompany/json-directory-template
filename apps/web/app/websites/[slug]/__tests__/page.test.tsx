import { render, screen } from '@/test/test-utils';
import ListingDetailPage from '@/app/websites/[slug]/page';
import { siteCopy } from '@thedaviddias/web-core/site-copy';

jest.mock('@/components/json-ld', () => ({
  JsonLd: () => null,
}));

jest.mock('@/components/project-navigation', () => ({
  ProjectNavigation: () => <div data-testid="project-navigation" />,
}));

jest.mock('@/components/sections/external-resources-section', () => ({
  ExternalResourcesSection: () => <div data-testid="external-resources" />,
}));

jest.mock('@/components/website/website-content-section', () => ({
  WebsiteContentSection: () => (
    <section data-testid="content-section">Content</section>
  ),
}));

jest.mock('@/components/website/website-detail-sidebar', () => ({
  WebsiteDetailSidebar: () => (
    <aside data-testid="detail-sidebar">Sidebar</aside>
  ),
}));

jest.mock('@/components/website/website-error', () => ({
  WebsiteError: () => <div data-testid="website-error">Error</div>,
}));

jest.mock('@/components/website/website-hero', () => ({
  WebsiteHero: ({
    breadcrumbItems,
  }: {
    breadcrumbItems: Array<{ href: string; name: string }>;
  }) => (
    <div data-testid="website-hero">
      {breadcrumbItems.map((item) => (
        <span key={item.href}>{item.name}</span>
      ))}
    </div>
  ),
}));

jest.mock('@/components/website/website-related-projects', () => ({
  WebsiteRelatedProjects: () => (
    <section data-testid="related-projects">Related</section>
  ),
}));

jest.mock('@/components/website/website-resources-section', () => ({
  WebsiteResourcesSection: () => (
    <section data-testid="links-section">Links</section>
  ),
}));

jest.mock('@/lib/content-loader', () => ({
  getWebsiteBySlug: jest.fn(async () => ({
    slug: 'example-product',
    name: 'Example Product',
    description: 'A test listing.',
    website: 'https://example.com',
    category: 'developer-tools',
    entityType: 'product',
    publishedAt: '2026-03-24',
    relatedWebsites: [],
    previousWebsite: null,
    nextWebsite: null,
  })),
  getWebsites: jest.fn(() => [
    {
      slug: 'example-product',
    },
  ]),
}));

jest.mock('@thedaviddias/web-core/listing-detail-template', () => ({
  resolveListingDetailTemplate: () => 'default',
}));

jest.mock('@thedaviddias/web-core/schema', () => ({
  generateWebsiteDetailSchema: () => ({}),
}));

describe('ListingDetailPage', () => {
  it('uses the configured listing label in the breadcrumb instead of the old directory placeholder', async () => {
    render(
      await ListingDetailPage({
        params: Promise.resolve({ slug: 'example-product' }),
      })
    );

    expect(screen.getByTestId('website-hero')).toHaveTextContent(
      siteCopy.listingName.pluralTitle
    );
    expect(screen.getByTestId('website-hero')).not.toHaveTextContent(
      'Directory'
    );
  });

  it('renders the content section before the supplemental links section', async () => {
    const { getByTestId } = render(
      await ListingDetailPage({
        params: Promise.resolve({ slug: 'example-product' }),
      })
    );

    const contentSection = getByTestId('content-section');
    const linksSection = getByTestId('links-section');

    expect(
      contentSection.compareDocumentPosition(linksSection) &
        Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy();
  });
});
