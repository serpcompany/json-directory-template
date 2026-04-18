import { resolveCategoryDisplayName } from '@thedaviddias/web-core/category-display';

describe('resolveCategoryDisplayName', () => {
  it('falls back to the shared category label when no site override exists', () => {
    expect(resolveCategoryDisplayName('automation-workflow')).toBe(
      'Video Downloaders'
    );
  });

  it('uses a site-owned label override when one is configured', () => {
    expect(
      resolveCategoryDisplayName('automation-workflow', {
        'video-downloaders': 'Download Workflows',
      })
    ).toBe('Download Workflows');
  });
});
