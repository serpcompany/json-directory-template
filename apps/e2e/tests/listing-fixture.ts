import { existsSync, readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'

type RawListing = {
  name?: unknown
  slug?: unknown
}

function findRepositoryRoot(startDir = process.cwd()) {
  let currentDir = startDir

  while (true) {
    if (existsSync(resolve(currentDir, 'data/listings.json'))) {
      return currentDir
    }

    const parentDir = dirname(currentDir)
    if (parentDir === currentDir) {
      throw new Error('Unable to find data/listings.json from the E2E working directory')
    }

    currentDir = parentDir
  }
}

const listingsPath = resolve(findRepositoryRoot(), 'data/listings.json')
const rawListings = JSON.parse(readFileSync(listingsPath, 'utf8')) as RawListing[]
const currentListing = rawListings.find(
  (listing): listing is { name: string; slug: string } =>
    typeof listing.name === 'string' &&
    listing.name.length > 0 &&
    typeof listing.slug === 'string' &&
    listing.slug.length > 0
)

if (!currentListing) {
  throw new Error('data/listings.json must include at least one listing with a name and slug')
}

export const detailListing = {
  name: currentListing.name,
  namePattern: new RegExp(currentListing.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'),
  searchQuery: currentListing.slug.replace(/-downloader$/, '').replace(/-/g, ' '),
  slug: currentListing.slug
} as const
