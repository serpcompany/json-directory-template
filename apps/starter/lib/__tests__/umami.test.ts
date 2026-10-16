import { resolveUmamiDomains } from '@thedaviddias/web-core/umami'

describe('resolveUmamiDomains', () => {
  it('returns the site domain and its www twin', () => {
    expect(resolveUmamiDomains({ domain: 'serp.ai' })).toEqual(['serp.ai', 'www.serp.ai'])
  })
})
