import { resolveSiteCopy } from '@thedaviddias/web-core/site-copy'

describe('resolveSiteCopy', () => {
  it('derives listing-neutral anchor and placeholder copy from the configured plural name', () => {
    const copy = resolveSiteCopy()

    expect(copy.allAnchorId).toBe('all-listings')
    expect(copy.docsLabel).toBe('Docs')
    expect(copy.listingSearchPlaceholder).toBe('Search listings, categories, and descriptions...')
    expect(copy.networkLabel).toBe('Network')
    expect(copy.submitLabelSentence).toBe('submit a listing')
  })
})
