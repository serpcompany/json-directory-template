import { render, screen } from '@/test/test-utils';
import { MobileDrawer } from '@/components/layout/mobile-drawer';
import { categories } from '@thedaviddias/web-core/categories';
import { siteCopy } from '@thedaviddias/web-core/site-copy';

jest.mock('@/components/auth/sign-out-button', () => ({
  SignOutButton: () => <button type="button">Sign out</button>,
}));

jest.mock('@/components/ui/favorites-link', () => ({
  FavoritesLink: () => <a href="/favorites">Favorites</a>,
}));

describe('MobileDrawer', () => {
  it('uses the configured submit label and omits the all-items anchor shortcut', () => {
    render(<MobileDrawer isOpen={true} onClose={jest.fn()} />);

    expect(
      screen.getByRole('link', { name: siteCopy.submitLabel })
    ).toHaveAttribute('href', '/submit');
    expect(
      screen.queryByRole('link', { name: /all listings/i })
    ).not.toBeInTheDocument();
  });

  it('hides external resource links when external resources are disabled for the site', () => {
    render(<MobileDrawer isOpen={true} onClose={jest.fn()} />);

    expect(
      screen.queryByRole('heading', { name: 'Resources' })
    ).not.toBeInTheDocument();
    expect(screen.queryByText('Chrome Extension')).not.toBeInTheDocument();
  });

  it('renders only active categories and hides the featured shortcut when there are no featured listings', () => {
    render(
      <MobileDrawer
        isOpen={true}
        onClose={jest.fn()}
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
      screen.queryByRole('button', { name: /featured/i })
    ).not.toBeInTheDocument();
  });
});
