export {
  default,
  generateMetadata,
} from '../../../categories/[category]/page';

const legacyLiveCategorySlugs = [
  'course-platforms',
  'image-downloader',
  'image-hosting',
  'livestream',
  'movies-tv',
  'social-media',
];

export async function generateStaticParams() {
  const source = await import('../../../categories/[category]/page');
  const params = await source.generateStaticParams();
  const seen = new Set(params.map(param => param.category));

  return [
    ...params,
    ...legacyLiveCategorySlugs
      .filter(category => !seen.has(category))
      .map(category => ({ category })),
  ];
}
