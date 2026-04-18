import { describe, expect, it } from 'vitest';
import { resolveBuildSourceAppPaths } from './build-site.ts';

describe('resolveBuildSourceAppPaths', () => {
  it('derives source-app staging paths from the configured app out dir', () => {
    const paths = resolveBuildSourceAppPaths({
      appOutDir: 'apps/web/out',
      workspaceRoot: '/workspace',
    });

    expect(paths).toEqual({
      accountRoutePath: '/workspace/apps/web/app/account',
      appDir: '/workspace/apps/web',
      appleTouchIconPath: '/workspace/apps/web/public/apple-touch-icon.png',
      authRouteBackupPath:
        '/workspace/apps/web/app/api/auth/[...nextauth]/route.static-export-disabled',
      authRoutePath:
        '/workspace/apps/web/app/api/auth/[...nextauth]/route.ts',
      favoritesRoutePath: '/workspace/apps/web/app/favorites',
      faviconPath: '/workspace/apps/web/app/favicon.ico',
      guidesRoutePath: '/workspace/apps/web/app/guides',
      loginRoutePath: '/workspace/apps/web/app/login',
      logoPath: '/workspace/apps/web/public/logo.png',
      opengraphImagePath: '/workspace/apps/web/app/opengraph-image.png',
      operatorOnboardingPageBackupPath:
        '/workspace/apps/web/app/operator/onboard-site/page.static-export-disabled',
      operatorOnboardingPagePath:
        '/workspace/apps/web/app/operator/onboard-site/page.tsx',
      projectsRoutePath: '/workspace/apps/web/app/projects',
      docsRoutePath: '/workspace/apps/web/app/docs',
      searchIndexPath: '/workspace/apps/web/public/search/search-index.json',
    });
  });

  it('tracks a non-web wrapper app when the configured out dir points elsewhere', () => {
    const paths = resolveBuildSourceAppPaths({
      appOutDir: 'apps/serpdownloaders.com/out',
      workspaceRoot: '/workspace',
    });

    expect(paths.appDir).toBe('/workspace/apps/serpdownloaders.com');
    expect(paths.searchIndexPath).toBe(
      '/workspace/apps/serpdownloaders.com/public/search/search-index.json'
    );
    expect(paths.authRoutePath).toBe(
      '/workspace/apps/serpdownloaders.com/app/api/auth/[...nextauth]/route.ts'
    );
  });
});
