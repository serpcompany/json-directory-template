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
  tagline: string
  githubUrl: string
  redditUrl: string
  twitterUrl: string
  drBadge: SiteDrBadge
}

export const siteConfig: SiteConfig = {
  name: 'SERP',
  domain: 'serp.co',
  tagline: '',
  githubUrl: 'https://github.com/devinschumacher',
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
