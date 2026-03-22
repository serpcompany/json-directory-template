import { Badge } from '@thedaviddias/design-system/badge'
import { Breadcrumb } from '@thedaviddias/design-system/breadcrumb'
import { Button } from '@thedaviddias/design-system/button'
import { ArrowRight, ExternalLink, Github, Hash, Plus } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { getRoute } from '@/lib/routes'
import { SITE_PUBLIC_URL, generateBaseMetadata } from '@/lib/seo/seo-config'
import { siteConfig } from '@/lib/site-config'

const GITHUB_RESOURCES = [
  {
    description: 'Browse repositories already tagged for the standard.',
    href: 'https://github.com/topics/llms-txt',
    icon: Hash,
    label: 'Topic',
    title: 'llms-txt topic'
  },
  {
    description: 'Catch alternate topic usage that still appears across GitHub.',
    href: 'https://github.com/topics/llmstxt',
    icon: Hash,
    label: 'Topic',
    title: 'llmstxt topic'
  },
  {
    description: 'See the directory source, starter structure, and contribution workflow.',
    href: siteConfig.githubRepoUrl,
    icon: Github,
    label: 'Repository',
    title: 'Starter repository'
  }
] as const

export const metadata: Metadata = generateBaseMetadata({
  title: 'Open Source Projects',
  description:
    'Browse GitHub topics and starter resources for open-source projects implementing the llms.txt standard.',
  path: '/projects',
  keywords: ['open source', 'GitHub projects', 'llms.txt tools', 'libraries', 'implementations']
})

export default function ProjectsPage() {
  return (
    <div className="container mx-auto py-8">
      <div className="space-y-12">
        <Breadcrumb items={[{ name: 'Projects', href: '/projects' }]} baseUrl={SITE_PUBLIC_URL} />

        <div className="space-y-2">
          <h1 className="text-4xl font-bold tracking-tight flex items-center gap-3">
            <span className="size-2 bg-primary rounded-full" />
            Open Source Projects
          </h1>
          <p className="text-lg text-muted-foreground max-w-3xl">
            This starter keeps the projects area static-friendly. Instead of calling the GitHub API
            at runtime, it points to the main public topic pages and contribution entry points.
          </p>
        </div>

        <Card className="transition-all hover:border-primary hover:bg-muted/50 relative overflow-hidden animate-fade-in-up">
          <CardContent className="p-6 sm:p-8">
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <Badge variant="secondary" className="bg-primary/10 text-primary">
                  Static-Friendly
                </Badge>
                <Github className="size-5 text-muted-foreground" />
              </div>

              <div className="space-y-3">
                <h2 className="text-xl sm:text-2xl font-bold tracking-tight">
                  Browse GitHub topics for live project discovery
                </h2>
                <p className="text-muted-foreground">
                  GitHub remains the discovery layer, while the site itself stays simple to export
                  and host. Use the topic pages below to see the wider ecosystem.
                </p>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <span className="text-sm font-medium text-primary flex items-center gap-1">
                  Explore resources
                  <ArrowRight className="size-4" />
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <section className="space-y-6">
          <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
            GitHub Resources ({GITHUB_RESOURCES.length})
          </h2>
          <div className="grid gap-4 sm:gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {GITHUB_RESOURCES.map(resource => (
              <Card
                key={resource.href}
                className="transition-all hover:border-primary hover:bg-muted/50"
              >
                <CardContent className="p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <Badge variant="outline">{resource.label}</Badge>
                    <resource.icon className="size-5 text-muted-foreground" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-lg font-semibold tracking-tight">{resource.title}</h3>
                    <p className="text-sm text-muted-foreground">{resource.description}</p>
                  </div>
                  <Button variant="outline" asChild className="rounded-none h-9 font-bold w-full">
                    <Link href={resource.href} target="_blank" rel="noopener noreferrer">
                      Open on GitHub
                      <ExternalLink className="ml-2 size-4" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <Card className="border-dashed">
          <CardContent className="p-8 text-center">
            <div className="mx-auto max-w-2xl space-y-4">
              <div className="size-12 rounded-full bg-muted flex items-center justify-center mx-auto">
                <Plus className="size-6 text-muted-foreground" />
              </div>
              <h2 className="text-2xl font-bold tracking-tight">Have a Project to Share?</h2>
              <p className="text-muted-foreground">
                Submit a website through GitHub issues and keep the directory transparent, reviewable,
                and easy to host anywhere.
              </p>
              <div className="flex justify-center gap-3 pt-2">
                <Button asChild className="rounded-none h-9 font-bold">
                  <Link href={getRoute('submit')}>Submit Website</Link>
                </Button>
                <Button variant="outline" asChild className="rounded-none h-9 font-bold">
                  <Link
                    href={siteConfig.githubRepoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    View Repository
                    <ExternalLink className="ml-2 size-4" />
                  </Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
