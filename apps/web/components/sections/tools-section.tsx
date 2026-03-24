import { ExternalLink } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { Section } from '@/components/layout/section'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { getRoute } from '@/lib/routes'
import { tools } from '@/lib/tools'

interface ToolsSectionProps {
  layout?: 'default' | 'compact'
  showImages?: boolean
}

/**
 * Section component displaying popular development tools.
 * When showImages=false (e.g. on website detail pages), renders a single card
 * with a compact list of tools to match the page layout.
 */
export function ToolsSection({ layout = 'default', showImages = true }: ToolsSectionProps) {
  if (!tools.length) {
    return null
  }

  if (!showImages) {
    return (
      <Section
        title="Related Tools"
        description="Explore related tools and reference links configured for this site."
        viewAllHref={getRoute('category.page', { category: 'developer-tools' })}
        viewAllText="All tools"
        titleId="developer-tools"
      >
        <div className="rounded-2xl border border-border/50 bg-card/50 backdrop-blur-sm overflow-hidden">
          <ul className="divide-y divide-border/50">
            {tools.map(tool => (
              <li key={tool.url}>
                <Link
                  href={tool.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-start gap-4 px-6 py-4 transition-colors hover:bg-muted/30 focus-visible:bg-muted/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
                >
                  <span className="flex-1 min-w-0">
                    <span className="font-medium text-foreground group-hover:text-primary transition-colors block truncate">
                      {tool.name}
                    </span>
                    <span className="text-sm text-muted-foreground line-clamp-2 mt-0.5 block">
                      {tool.description}
                    </span>
                  </span>
                  <ExternalLink
                    className="size-4 shrink-0 text-muted-foreground group-hover:text-primary transition-colors mt-1"
                    aria-hidden
                  />
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </Section>
    )
  }

  return (
    <Section
      title="Related Tools"
      description="Explore related tools and reference links configured for this site."
      viewAllHref={getRoute('category.page', { category: 'developer-tools' })}
      viewAllText="All tools"
      titleId="developer-tools"
    >
      <div className="@container">
        <div className="grid gap-4 @[500px]:grid-cols-2 @[800px]:grid-cols-4">
          {tools.map(tool => (
            <Link
              key={tool.url}
              href={tool.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded-lg"
            >
              <Card className="h-full flex flex-col transition-all duration-200 hover:border-primary/50 hover:bg-muted/50 rounded-2xl border-border/50">
                <CardHeader className="p-2 sm:p-2.5 md:p-3 space-y-1">
                  <CardTitle className="flex items-center gap-2 leading-5 text-base sm:text-lg">
                    {tool.name}
                    <ExternalLink
                      className="size-4 opacity-0 transition-opacity group-hover:opacity-100 shrink-0"
                      aria-hidden
                    />
                  </CardTitle>
                  <CardDescription className="text-sm sm:text-base">
                    {tool.description}
                  </CardDescription>
                </CardHeader>
                {layout === 'default' && tool.imageSrc && tool.imageAlt && (
                  <CardContent className="p-2 sm:p-2.5 md:p-3 pt-0 mt-auto">
                    <div className="relative aspect-video overflow-hidden rounded-lg">
                      <Image
                        src={tool.imageSrc}
                        alt={tool.imageAlt}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      />
                    </div>
                  </CardContent>
                )}
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </Section>
  )
}
