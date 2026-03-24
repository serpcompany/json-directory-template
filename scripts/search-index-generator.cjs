const fs = require('node:fs')
const path = require('node:path')

const inputPath = process.env.WEBSITE_DATA_PATH || 'data/websites.json'
const outputPath = process.env.SEARCH_INDEX_OUTPUT_PATH || 'apps/web/public/search/search-index.json'

if (!fs.existsSync(inputPath)) {
  console.error(`Website data file not found: ${inputPath}`)
  process.exit(1)
}

let parsed
try {
  parsed = JSON.parse(fs.readFileSync(inputPath, 'utf8'))
} catch (error) {
  console.error(`Failed to parse website data from ${inputPath}:`, error)
  process.exit(1)
}

if (!Array.isArray(parsed)) {
  console.error(`Expected an array in ${inputPath}`)
  process.exit(1)
}

const searchIndex = parsed
  .map(entry => {
    const slug = entry.slug || String(entry.name || '')
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/--+/g, '-')

    return {
      category: entry.category || '',
      content: entry.content || '',
      description: entry.description || '',
      llmsFullUrl: entry.llmsFullUrl || '',
      llmsUrl: entry.llmsUrl || entry.llmsTxtUrl || '',
      name: entry.name || '',
      slug,
      url: entry.url || `/websites/${slug}`,
      website: entry.website || entry.domain || ''
    }
  })
  .filter(entry => entry.name && entry.slug)
  .sort((left, right) => left.name.localeCompare(right.name))

const outputDir = path.dirname(outputPath)
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true })
}

fs.writeFileSync(outputPath, `${JSON.stringify(searchIndex, null, 2)}\n`)

console.log(`Search index generated with ${searchIndex.length} entries at ${outputPath}`)
