import { trimSlashes } from '@thedaviddias/site-contract/legacy-listing-slugs'
import { describe, expect, it } from 'vitest'
import { stripHtmlTags } from './websites-list-with-sort'

// These helpers replace regexes CodeQL flagged as js/polynomial-redos
// (`/^\/+|\/+$/g` and `/<[^>]*>/g`). The expected values are what those regexes returned, and the
// helpers must stay fast on adversarial input.

describe('trimSlashes', () => {
  it.each([
    ['', ''],
    ['/', ''],
    ['///', ''],
    ['products', 'products'],
    ['/products/', 'products'],
    ['//products/best//', 'products/best'],
    ['a/b/c', 'a/b/c'],
    ['/a//b/', 'a//b'],
    [' /x/ ', ' /x/ ']
  ])('trims %j to %j like the old slash-trim regex', (value, expected) => {
    expect(trimSlashes(value)).toBe(expected)
  })

  it('stays linear on long runs of slashes', () => {
    const adversarial = `${'/'.repeat(200_000)}x${'/'.repeat(200_000)}`
    const started = performance.now()

    expect(trimSlashes(adversarial)).toBe('x')
    expect(trimSlashes('/'.repeat(200_000))).toBe('')
    expect(performance.now() - started).toBeLessThan(200)
  })
})

describe('stripHtmlTags', () => {
  it.each([
    ['', ''],
    ['plain text', 'plain text'],
    ['<b>bold</b> text', 'bold text'],
    ['<>empty tag', 'empty tag'],
    ['a < b and c > d', 'a  d'],
    ['<<nested>> tags', '> tags'],
    ['unclosed <tag at end', 'unclosed <tag at end'],
    ['tail <b>x</b> and <open', 'tail x and <open'],
    ['  <p> spaced </p>  ', 'spaced'],
    ['><>><<', '>><<']
  ])('strips %j to %j like the old tag-strip regex', (value, expected) => {
    expect(stripHtmlTags(value)).toBe(expected)
  })

  it('returns an empty string for null and undefined', () => {
    expect(stripHtmlTags(null)).toBe('')
    expect(stripHtmlTags(undefined)).toBe('')
  })

  it('stays linear on long runs of unclosed tags', () => {
    const adversarial = `<${'<'.repeat(200_000)}`
    const started = performance.now()

    expect(stripHtmlTags(adversarial)).toBe(adversarial)
    expect(performance.now() - started).toBeLessThan(200)
  })
})
