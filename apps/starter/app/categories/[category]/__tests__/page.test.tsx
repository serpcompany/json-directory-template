import { render, screen } from '@/test/test-utils';
import CategoryPage, {
  generateMetadata,
  generateStaticParams,
} from '@/app/categories/[category]/page';

const mockRenderCategoryRoutePage = jest.fn(() => ({
  categoryProjects: [{ slug: 'example-dev-tool' }],
  element: <div data-testid="category-route-page" />,
}));
const mockGenerateCategoryRouteMetadata = jest.fn(async () => ({
  description: 'mock category metadata',
  title: 'mock category title',
}));
const mockGenerateCategoryRouteStaticParams = jest.fn(() => [
  { category: 'developer-tools' },
  { category: 'video-downloaders' },
]);

jest.mock('@thedaviddias/web-core/category-routes/category-page', () => ({
  CategoryRoutePage: (props: unknown) => mockRenderCategoryRoutePage(props),
  generateCategoryRouteMetadata: (...args: unknown[]) =>
    mockGenerateCategoryRouteMetadata(...args),
  generateCategoryRouteStaticParams: (...args: unknown[]) =>
    mockGenerateCategoryRouteStaticParams(...args),
}));

jest.mock('@/actions/get-home-page-data', () => ({
  getHomePageData: jest.fn(async () => ({
    allProjects: [],
    featuredProjects: [],
    recentlyUpdatedProjects: [],
    totalCount: 0,
  })),
}));

jest.mock('@/lib/content-loader', () => ({
  getGuides: jest.fn(async () => []),
  getWebsites: jest.fn(() => [
    {
      slug: 'example-dev-tool',
      name: 'Example Dev Tool',
      description: 'Developer tool listing',
      website: 'https://example.com',
      category: 'developer-tools',
      categories: ['developer-tools', 'video-downloaders'],
      publishedAt: '2026-03-24',
    },
  ]),
}));

describe('CategoryPage.generateStaticParams', () => {
  beforeEach(() => {
    mockGenerateCategoryRouteMetadata.mockClear();
    mockGenerateCategoryRouteStaticParams.mockClear();
    mockRenderCategoryRoutePage.mockClear();
  });

  it('only emits category routes that have attached listings', async () => {
    await expect(generateStaticParams()).resolves.toEqual([
      { category: 'developer-tools' },
      { category: 'video-downloaders' },
    ]);
    expect(mockGenerateCategoryRouteStaticParams).toHaveBeenCalled();
  });

  it('delegates category metadata generation to the package-owned route module', async () => {
    const metadata = await generateMetadata({
      params: Promise.resolve({ category: 'developer-tools' }),
    });

    expect(mockGenerateCategoryRouteMetadata).toHaveBeenCalled();
    expect(metadata).toEqual({
      description: 'mock category metadata',
      title: 'mock category title',
    });
  });

  it('delegates category page rendering to the package-owned route module', async () => {
    render(
      await CategoryPage({
        params: Promise.resolve({ category: 'developer-tools' }),
      })
    );

    expect(screen.getByTestId('category-route-page')).toBeInTheDocument();
    expect(mockRenderCategoryRoutePage).toHaveBeenCalled();
  });
});
