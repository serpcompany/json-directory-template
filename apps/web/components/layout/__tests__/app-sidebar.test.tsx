import { render, screen } from '@/test/test-utils';
import { categories } from '@thedaviddias/web-core/categories';
import { AppSidebar } from '@thedaviddias/web-core/layout/app-sidebar';

jest.mock('@thedaviddias/web-core/ui/favorites-link', () => ({
  FavoritesLink: () => <a href="/favorites">Favorites</a>,
}));

describe('AppSidebar', () => {
  it('does not render the all-items anchor shortcut in the categories list', () => {
    render(<AppSidebar />);

    expect(
      screen.queryByRole('link', { name: /all listings/i })
    ).not.toBeInTheDocument();
  });

  it('hides the external resources group when no external resources are configured', () => {
    render(<AppSidebar />);

    expect(
      screen.queryByRole('heading', { name: 'Resources' })
    ).not.toBeInTheDocument();
    expect(screen.queryByText('Chrome Extension')).not.toBeInTheDocument();
  });

  it('renders only the active category links and hides featured when there are no featured listings', () => {
    render(
      <AppSidebar
        availableCategorySlugs={[categories[0]!.slug]}
        showFeaturedCategory={false}
      />
    );

    expect(
      screen.getByRole('link', { name: categories[0]!.name })
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('link', { name: 'AI & Machine Learning' })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('link', { name: 'Featured' })
    ).not.toBeInTheDocument();
  });
});
