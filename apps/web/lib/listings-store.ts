import { readFileSync, writeFileSync } from 'fs'
import { join } from 'path'

const DATA_DIR = join(process.cwd(), '../../data')
const LISTINGS_PATH = join(DATA_DIR, 'listings.json')

export function readListings(): unknown[] {
  try { return JSON.parse(readFileSync(LISTINGS_PATH, 'utf-8')) } catch { return [] }
}

export function appendListing(listing: unknown): void {
  const listings = readListings()
  writeFileSync(LISTINGS_PATH, JSON.stringify([...listings, listing], null, 2))
}
