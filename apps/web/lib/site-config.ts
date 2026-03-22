export type SiteDrBadge = {
  href: string
  imageSrc: string
  alt: string
  width: number
  height: number
}

export type SiteConfig = {
  name: string
  domain: string
  description: string
  tagline: string
  githubUrl: string
  githubRepoUrl: string
  githubIssueOwner: string
  githubIssueRepo: string
  githubIssuesUrl: string
  githubIssueTemplate: string
  redditUrl: string
  twitterUrl: string
  drBadge: SiteDrBadge
}

export function getTwitterHandleFromUrl(url: string): string | null {
  try {
    const parsedUrl = new URL(url)
    const pathSegments = parsedUrl.pathname.split('/').filter(Boolean)
    const handle = pathSegments.at(-1)

    if (!handle) {
      return null
    }

    return `@${handle}`
  } catch {
    return null
  }
}

export const siteConfig: SiteConfig = {
  name: 'SERP',
  domain: 'serp.co',
  description:
    'The largest directory of websites implementing the llms.txt standard. Find AI-ready documentation, browse llms.txt examples, and learn how to create your own llms.txt file.',
  tagline: 'Discover AI-Ready Documentation',
  githubUrl: 'https://github.com/devinschumacher',
  githubRepoUrl: 'https://github.com/serpcompany/json-directory-template',
  githubIssueOwner: 'serpcompany',
  githubIssueRepo: 'json-directory-template',
  githubIssuesUrl: 'https://github.com/serpcompany/json-directory-template/issues/new/choose',
  githubIssueTemplate: 'submit-website.yml',
  redditUrl: 'https://www.reddit.com/user/devinschumacher/',
  twitterUrl: 'https://x.com/dvnschmchr',
  drBadge: {
    href: 'https://dr.serp.co/',
    imageSrc: 'https://dr.serp.co/badge/serp.co?style=serp-dr-v3',
    alt: 'Verified DR 78 for serp.co',
    width: 200,
    height: 50
  }
}
