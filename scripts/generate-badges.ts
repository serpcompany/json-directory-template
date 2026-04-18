import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  defaultSiteConfig,
  resolveCheckedInSiteConfig,
  siteConfigsById,
} from '@thedaviddias/site-contract';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(__dirname, '..');

function tryReadLogoBase64(logoPath: string): string | null {
  const absPath = join(REPO_ROOT, logoPath);
  if (!existsSync(absPath)) return null;
  const data = readFileSync(absPath);
  const ext = logoPath.split('.').pop()?.toLowerCase() ?? 'png';
  const mime =
    ext === 'svg' ? 'image/svg+xml' : ext === 'ico' ? 'image/x-icon' : `image/${ext}`;
  return `data:${mime};base64,${data.toString('base64')}`;
}

function buildSvg(opts: {
  siteName: string;
  logoBase64: string | null;
  variant: 'light' | 'dark';
}): string {
  const { siteName, logoBase64, variant } = opts;

  const bgFill = variant === 'light' ? '#ffffff' : '#1a1a1a';
  const strokeColor = variant === 'light' ? '#e5e7eb' : '#333333';
  const labelFill = variant === 'light' ? '#000000' : '#ffffff';
  const nameFill = variant === 'light' ? '#000000' : '#eeeeee';

  const textX = logoBase64 ? '40' : '10';

  const imageEl = logoBase64
    ? `\n  <image x="12" y="12" width="20" height="20" href="${logoBase64}"/>`
    : '';

  return `<svg width="153" height="44" viewBox="0 0 153 44" xmlns="http://www.w3.org/2000/svg">
  <rect x="1" y="1" width="151" height="42" rx="5" fill="${bgFill}" stroke="${strokeColor}" stroke-width="1"/>
  ${imageEl}
  <text x="${textX}" y="18" font-family="system-ui,-apple-system,sans-serif" font-size="9" font-weight="500" fill="${labelFill}" opacity="0.8">FEATURED ON</text>
  <text x="${textX}" y="32" font-family="system-ui,-apple-system,sans-serif" font-size="13" font-weight="700" fill="${nameFill}">${siteName}</text>
</svg>`;
}

function main(): void {
  const siteIds = [defaultSiteConfig.id, ...Object.keys(siteConfigsById)];

  for (const siteId of siteIds) {
    const config = resolveCheckedInSiteConfig(siteId);
    const siteName = config.site?.name ?? siteId;
    const outputDir = join(REPO_ROOT, 'apps', config.build.appPackageName, 'public', 'badge');

    if (!existsSync(outputDir)) {
      mkdirSync(outputDir, { recursive: true });
    }

    const logoSource = config.branding?.logo;
    const logoBase64 =
      logoSource && logoSource.source === 'local-path'
        ? tryReadLogoBase64(logoSource.path)
        : null;

    for (const variant of ['light', 'dark'] as const) {
      const svg = buildSvg({ siteName, logoBase64, variant });
      const filename = `featured-on-${siteId}-${variant}.svg`;
      const outPath = join(outputDir, filename);
      writeFileSync(outPath, svg, 'utf-8');
      console.log(`  wrote ${config.build.appPackageName}/public/badge/${filename}`);
    }
  }

  console.log(`\nDone — generated ${siteIds.length * 2} badge SVG(s) in wrapper app public/badge directories.`);
}

main();
