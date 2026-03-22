/**
 * Generates an llms.txt URL from a website URL.
 */
export function generateLlmsUrl(websiteUrl: string): string {
  if (!websiteUrl) return ''

  try {
    const cleanedUrl = websiteUrl.trim().replace(/[\r\n\t]/g, '')
    const url = new URL(cleanedUrl)
    return `${url.origin}/llms.txt`
  } catch {
    return ''
  }
}

/**
 * Generates an llms-full.txt URL from a website URL.
 */
export function generateLlmsFullUrl(websiteUrl: string): string {
  if (!websiteUrl) return ''

  try {
    const cleanedUrl = websiteUrl.trim().replace(/[\r\n\t]/g, '')
    const url = new URL(cleanedUrl)
    return `${url.origin}/llms-full.txt`
  } catch {
    return ''
  }
}
