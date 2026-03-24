import { z } from 'zod'

export const SEARCH_INDEX_PUBLIC_PATH = '/search/search-index.json'

export const searchIndexEntrySchema = z.object({
  category: z.string(),
  content: z.string(),
  description: z.string(),
  llmsFullUrl: z.string(),
  llmsUrl: z.string(),
  name: z.string().min(1),
  slug: z.string().min(1),
  url: z.string().min(1),
  website: z.string()
})

export const searchIndexSchema = z.array(searchIndexEntrySchema)

export type SearchIndexEntry = z.infer<typeof searchIndexEntrySchema>
