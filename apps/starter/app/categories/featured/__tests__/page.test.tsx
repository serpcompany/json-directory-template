import { render, screen } from '@/test/test-utils';
import FeaturedPage, { metadata } from '@/app/categories/featured/page';

const mockRenderFeaturedCategoryRoutePage = jest.fn(() => (
  <div data-testid="featured-category-route-page" />
));

jest.mock('@thedaviddias/web-core/category-routes/featured-page', () => ({
  featuredCategoryPageMetadata: {
    description: 'mock featured metadata',
    title: 'mock featured title',
  },
  FeaturedCategoryRoutePage: (props: unknown) =>
    mockRenderFeaturedCategoryRoutePage(props),
}));

jest.mock('@/actions/get-home-page-data', () => ({
  getHomePageData: jest.fn(async () => ({
    allProjects: [],
    featuredProjects: [
      {
        slug: 'featured-tool',
        name: 'Featured Tool',
        description: 'Featured listing',
        website: 'https://example.com',
        category: 'developer-tools',
        categories: ['developer-tools'],
        publishedAt: '2026-03-24',
        featured: true,
      },
    ],
    recentlyUpdatedProjects: [],
    totalCount: 1,
  })),
}));

jest.mock('@/lib/content-loader', () => ({
  getGuides: jest.fn(async () => []),
}));

describe('FeaturedCategoryPage', () => {
  beforeEach(() => {
    mockRenderFeaturedCategoryRoutePage.mockClear();
  });

  it('uses package-owned featured category metadata', () => {
    expect(metadata).toEqual({
      description: 'mock featured metadata',
      title: 'mock featured title',
    });
  });

  it('delegates featured category rendering to the package-owned route module', async () => {
    render(await FeaturedPage());

    expect(screen.getByTestId('featured-category-route-page')).toBeInTheDocument();
    expect(mockRenderFeaturedCategoryRoutePage).toHaveBeenCalled();
  });
});
