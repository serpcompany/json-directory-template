import { logger } from '@thedaviddias/logging'
import { NextResponse } from 'next/server'
import { getResources, getWebsites } from '@/lib/content-loader'
import { siteCopy } from '@/lib/site-copy'
import { siteConfig } from '@/lib/site-config'

export const dynamic = 'force-static'

/**
 * GET /llms.txt - Generates a text export of directory listings and resources
 * @returns Text response with directory data and contribution links
 */
export async function GET() {
  try {
    const websites = getWebsites()
    const resources = getResources()

    // Generate the text content
    let content = `# ${siteConfig.name}

## Overview
This is an automatically generated text export of the current ${siteCopy.listingName.plural} and related resources.

## ${siteCopy.listingName.pluralTitle}
The following ${siteCopy.listingName.plural} are currently published:\n\n`

    // Add websites
    for (const website of websites) {
      content += `- [${website.name}](${website.website})${website.description ? `: ${website.description}` : ''}\n`
      if (website.llmsUrl) {
        content += `  - llms.txt: ${website.llmsUrl}\n`
      }
      if (website.llmsFullUrl) {
        content += `  - Full Documentation: ${website.llmsFullUrl}\n`
      }
    }

    // Add resources
    content += '\n## Resources\n'
    for (const resource of resources) {
      const link = resource.url || '#'
      const category = resource.category || 'general'
      content += `- [${resource.title}](${link})${resource.description ? `: ${resource.description}` : ''} [${category}]\n`
    }

    content += `\n## Contributing
- ${siteCopy.submitLabel}: ${siteConfig.githubIssuesUrl}
- Repository: ${siteConfig.githubRepoUrl}`

    return new NextResponse(content, {
      headers: {
        'Content-Type': 'text/plain'
      }
    })
  } catch (error) {
    logger.error('Error generating content:', { data: error, tags: { type: 'page' } })
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
