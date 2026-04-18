import { render, screen } from '@/test/test-utils';
import ListingDetailPage from '@/app/websites/[slug]/page';
import { siteCopy } from '@thedaviddias/web-core/site-copy';

const mockRenderWebsiteDetailRoutePage = jest.fn(
  ({
    project,
    slots,
  }: {
    project: {
      name: string;
      nextWebsite: null;
      previousWebsite: null;
      relatedWebsites: [];
      slug: string;
      website: string;
    };
    slots: {
      ExternalResourcesSection: React.ComponentType<{
        layout?: 'default' | 'compact';
        showImages?: boolean;
      }>;
      ProjectNavigation: React.ComponentType<{
        nextWebsite: null;
        previousWebsite: null;
      }>;
      WebsiteContentSection: React.ComponentType<{ website: unknown }>;
      WebsiteHero: React.ComponentType<{
        breadcrumbItems: Array<{ href: string; name: string }>;
        website: unknown;
      }>;
      WebsiteRelatedProjects: React.ComponentType<{ websites: [] }>;
      WebsiteResourcesSection: React.ComponentType<{ website: unknown }>;
    };
  }) => (
    <div data-testid="website-detail-route-page">
      <slots.WebsiteHero
        website={project}
        breadcrumbItems={[
          {
            name: siteCopy.listingName.pluralTitle,
            href: '/listing',
          },
          {
            name: project.name,
            href: `/listing/${project.slug}`,
          },
        ]}
      />
      <slots.WebsiteContentSection website={project} />
      <slots.ExternalResourcesSection layout="default" showImages={false} />
      <slots.WebsiteResourcesSection website={project} />
      <slots.ProjectNavigation
        previousWebsite={project.previousWebsite}
        nextWebsite={project.nextWebsite}
      />
      <slots.WebsiteRelatedProjects websites={project.relatedWebsites} />
    </div>
  )
);
const mockGenerateWebsiteDetailRouteMetadata = jest.fn(async () => ({
  description: 'mock website detail metadata',
  title: 'mock website detail title',
}));
const mockGenerateWebsiteDetailRouteStaticParams = jest.fn(() => [
  { slug: 'example-product' },
]);

jest.mock('@thedaviddias/web-core/website-routes/detail-page', () => ({
  WebsiteDetailRoutePage: (props: unknown) => mockRenderWebsiteDetailRoutePage(props as never),
  generateWebsiteDetailRouteMetadata: (...args: unknown[]) =>
    mockGenerateWebsiteDetailRouteMetadata(...args),
  generateWebsiteDetailRouteStaticParams: (...args: unknown[]) =>
    mockGenerateWebsiteDetailRouteStaticParams(...args),
}));

jest.mock('@thedaviddias/web-core/json-ld', () => ({
  JsonLd: () => null,
}));

jest.mock('@thedaviddias/web-core/project-navigation', () => ({
  ProjectNavigation: () => <div data-testid="project-navigation" />,
}));

jest.mock('@thedaviddias/web-core/sections/external-resources-section-route', () => ({
  ExternalResourcesSectionRoute: () => <div data-testid="external-resources" />,
}));

jest.mock('@thedaviddias/web-core/website/website-content-section-route', () => ({
  WebsiteContentSectionRoute: () => (
    <section data-testid="content-section">Content</section>
  ),
}));

jest.mock('@thedaviddias/web-core/website/website-detail-sidebar', () => ({
  WebsiteDetailSidebar: () => (
    <aside data-testid="detail-sidebar">Sidebar</aside>
  ),
}));

jest.mock('@thedaviddias/web-core/website/website-error-route', () => ({
  WebsiteErrorRoute: () => <div data-testid="website-error">Error</div>,
}));

jest.mock('@thedaviddias/web-core/website/website-hero-route', () => ({
  WebsiteHeroRoute: ({
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

jest.mock('@thedaviddias/web-core/website/website-related-projects-route', () => ({
  WebsiteRelatedProjectsRoute: () => (
    <section data-testid="related-projects">Related</section>
  ),
}));

jest.mock('@thedaviddias/web-core/website/website-resources-section-route', () => ({
  WebsiteResourcesSectionRoute: () => (
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
  beforeEach(() => {
    mockGenerateWebsiteDetailRouteMetadata.mockClear();
    mockGenerateWebsiteDetailRouteStaticParams.mockClear();
    mockRenderWebsiteDetailRoutePage.mockClear();
  });

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

  it('delegates website detail metadata generation to the package-owned route module', async () => {
    const { generateMetadata } = await import('@/app/websites/[slug]/page');

    const metadata = await generateMetadata({
      params: Promise.resolve({ slug: 'example-product' }),
    });

    expect(mockGenerateWebsiteDetailRouteMetadata).toHaveBeenCalled();
    expect(metadata).toEqual({
      description: 'mock website detail metadata',
      title: 'mock website detail title',
    });
  });

  it('delegates static params generation to the package-owned route module', async () => {
    const { generateStaticParams } = await import('@/app/websites/[slug]/page');

    const params = await generateStaticParams();

    expect(mockGenerateWebsiteDetailRouteStaticParams).toHaveBeenCalledWith([
      { slug: 'example-product' },
    ]);
    expect(params).toEqual([{ slug: 'example-product' }]);
  });
});
