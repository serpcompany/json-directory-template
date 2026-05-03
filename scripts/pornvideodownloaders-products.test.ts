import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const productsPath = resolve(
  process.cwd(),
  'sites/pornvideodownloaders.com/products.json'
);

const expectedAdultProductSlugs = [
  'alphaporno-downloader',
  'ashemaletube-downloader',
  'beeg-downloader',
  'bongacams-downloader',
  'boyfriendtv-downloader',
  'cam4-downloader',
  'camscom-downloader',
  'camsoda-downloader',
  'chaturbate-downloader',
  'coomer-downloader',
  'dreamcam-downloader',
  'dreamcam-vr-downloader',
  'eporner-downloader',
  'erome-downloader',
  'erothots-downloader',
  'fansly-live-downloader',
  'flirt4free-downloader',
  'hdzog-downloader',
  'hentaihaven-downloader',
  'justforfans-downloader',
  'livejasmin-downloader',
  'luxuretv-downloader',
  'manyvids-downloader',
  'motherless-downloader',
  'myfreecams-downloader',
  'nhentai-downloader',
  'onlyfans-bulk-downloader',
  'onlyfans-downloader',
  'pornhub-downloader',
  'porntrex-downloader',
  'redgifs-downloader',
  'redtube-downloader',
  'redtube-video-downloader',
  'sexchathu-downloader',
  'spankbang-downloader',
  'streamate-downloader',
  'stripchat-downloader',
  'stripchat-vr-downloader',
  'thisvid-downloader',
  'tnaflix-downloader',
  'txxx-downloader',
  'upornia-downloader',
  'xfantazy-downloader',
  'xhamster-downloader',
  'xhamsterlive-downloader',
  'xlovecam-downloader',
  'xnxx-downloader',
  'xnxx-video-downloader',
  'xvideos-downloader',
  'yespornplease-downloader',
  'youjizz-downloader',
  'youporn-downloader',
] as const;

const excludedGeneralProductSlugs = [
  'youtube-downloader',
  'tiktok-downloader',
  'dailymotion-downloader',
  'vimeo-downloader',
  'wistia-downloader',
  'udemy-downloader',
  'coursera-downloader',
  'getty-images-downloader',
  'unsplash-downloader',
] as const;

describe('pornvideodownloaders checked-in products', () => {
  it('contains only the explicit adult product subset copied from serpdownloaders', () => {
    const products = JSON.parse(readFileSync(productsPath, 'utf8')) as Record<
      string,
      {
        product?: {
          productPage?: string;
          slug?: string;
          tagline?: string;
          title?: string;
        };
        media?: {
          logo?: string;
        };
      }
    >;

    expect(Object.keys(products).sort()).toEqual([
      ...expectedAdultProductSlugs,
    ].sort());

    for (const slug of expectedAdultProductSlugs) {
      expect(products[slug]?.product).toMatchObject({
        productPage: expect.stringMatching(/^https:\/\/serp\.ly\/.+/),
        slug,
        tagline: expect.any(String),
        title: expect.any(String),
      });

      const logoPath = products[slug]?.media?.logo;
      if (logoPath) {
        expect(logoPath).toMatch(
          /^\/listing-logos\/pornvideodownloaders\.com\/.+\.png$/
        );
        expect(
          existsSync(
            resolve(process.cwd(), 'apps/pornvideodownloaders.com/public', logoPath.slice(1))
          )
        ).toBe(true);
      }
    }

    for (const slug of excludedGeneralProductSlugs) {
      expect(products[slug]).toBeUndefined();
    }
  });
});
