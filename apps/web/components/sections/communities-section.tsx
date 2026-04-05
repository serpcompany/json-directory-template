import { SiGithub, SiReddit, SiX } from '@icons-pack/react-simple-icons'
import { Section } from '@/components/layout/section'
import { Card } from '@/components/ui/card'
import { siteCopy } from '@/lib/site-copy'
import { hasConfiguredPublicSocialLinks, siteConfig } from '@/lib/site-config'

const communities = [
  {
    name: 'Reddit',
    description:
      `Follow new ${siteCopy.listingName.plural}, questions, and feedback from the broader community.`,
    icon: SiReddit,
    url: siteConfig.redditUrl
  },
  {
    name: 'X',
    description: `Get quick updates, launches, and highlights from ${siteConfig.name}.`,
    icon: SiX,
    url: siteConfig.twitterUrl
  },
  {
    name: 'GitHub',
    description: 'Track submissions, starter changes, and review activity in the open.',
    icon: SiGithub,
    url: siteConfig.githubRepoUrl
  }
]

/**
 * Renders the starter community links section
 */
export function CommunitiesSection() {
  if (!hasConfiguredPublicSocialLinks(siteConfig)) {
    return null
  }

  return (
    <Section
      title="Follow The Project"
      description={`Stay close to ${siteConfig.name} across the channels where updates, submissions, and discussion already happen.`}
    >
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {communities.map(community => {
          const Icon = community.icon
          return (
            <a
              key={community.name}
              href={community.url}
              target="_blank"
              rel="noopener noreferrer"
              className="block"
            >
              <Card className="p-6 flex flex-col items-center text-center space-y-4 transition-all hover:border-primary hover:bg-muted/50">
                <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
                  <Icon className="size-6" />
                </div>
                <h3 className="text-lg font-semibold">{community.name}</h3>
                <p className="text-sm text-muted-foreground">{community.description}</p>
                <span className="text-sm font-medium text-primary">Open Link →</span>
              </Card>
            </a>
          )
        })}
      </div>
    </Section>
  )
}
