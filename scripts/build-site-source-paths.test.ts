import { describe, expect, it } from 'vitest';
import { resolveBuildSourceAppPaths } from './build-site.ts';

describe('resolveBuildSourceAppPaths', () => {
  it('derives source-app staging paths from the configured starter app out dir', () => {
    const paths = resolveBuildSourceAppPaths({
      appOutDir: 'apps/starter/out',
      workspaceRoot: '/workspace',
    });

    expect(paths).toEqual({
      accountRoutePath: '/workspace/apps/starter/app/account',
      appDir: '/workspace/apps/starter',
      appleTouchIconPath: '/workspace/apps/starter/public/apple-touch-icon.png',
      authRouteBackupPath:
        '/workspace/apps/starter/app/api/auth/[...nextauth]/route.static-export-disabled',
      authRoutePath:
        '/workspace/apps/starter/app/api/auth/[...nextauth]/route.ts',
      favoritesRoutePath: '/workspace/apps/starter/app/favorites',
      faviconPath: '/workspace/apps/starter/app/favicon.ico',
      guidesRoutePath: '/workspace/apps/starter/app/guides',
      loginRoutePath: '/workspace/apps/starter/app/login',
      logoPath: '/workspace/apps/starter/public/logo.png',
      opengraphImagePath: '/workspace/apps/starter/app/opengraph-image.png',
      operatorOnboardingPageBackupPath:
        '/workspace/apps/starter/app/operator/onboard-site/page.static-export-disabled',
      operatorOnboardingPagePath:
        '/workspace/apps/starter/app/operator/onboard-site/page.tsx',
      projectsRoutePath: '/workspace/apps/starter/app/projects',
      docsRoutePath: '/workspace/apps/starter/app/docs',
      searchIndexPath: '/workspace/apps/starter/public/search/search-index.json',
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
