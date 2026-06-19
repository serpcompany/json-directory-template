import { resolveGoogleTagManagerId } from '@thedaviddias/web-core/google-tag-manager'

describe('resolveGoogleTagManagerId', () => {
  it('returns the configured GTM id', () => {
    expect(
      resolveGoogleTagManagerId({
        gtmId: 'GTM-M82HC3SC'
      })
    ).toBe('GTM-M82HC3SC')
  })

  it('returns the configured GTM id for local site verification', () => {
    expect(
      resolveGoogleTagManagerId({
        gtmId: 'GTM-M82HC3SC'
      })
    ).toBe('GTM-M82HC3SC')
  })

  it('does not return a GTM id when the active site is not configured for it', () => {
    expect(resolveGoogleTagManagerId({})).toBeUndefined()
  })
})
