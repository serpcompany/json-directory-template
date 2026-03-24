import { ExternalLink } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { Section } from '@/components/layout/section'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { externalResources } from '@/lib/external-resources'

interface ExternalResourcesSectionProps {
  layout?: 'default' | 'compact'
  showImages?: boolean
}

/**
 * Section component displaying optional external resource links.
 * When showImages=false (e.g. on listing detail pages), renders a single card
 * with a compact list of links to match the page layout.
 */
export function ExternalResourcesSection({
  layout = 'default',
  showImages = true
}: ExternalResourcesSectionProps) {
  if (!externalResources.length) {
    return null
  }

  if (!showImages) {
    return (
      <Section
        title="Related Resources"
        description="Explore related external resources and reference links configured for this site."
        titleId="related-resources"
      >
        <div className="rounded-2xl border border-border/50 bg-card/50 backdrop-blur-sm overflow-hidden">
          <ul className="divide-y divide-border/50">
            {externalResources.map(resource => (
              <li key={resource.url}>
                <Link
                  href={resource.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-start gap-4 px-6 py-4 transition-colors hover:bg-muted/30 focus-visible:bg-muted/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
                >
                  <span className="flex-1 min-w-0">
                    <span className="font-medium text-foreground group-hover:text-primary transition-colors block truncate">
                      {resource.name}
                    </span>
                    <span className="text-sm text-muted-foreground line-clamp-2 mt-0.5 block">
                      {resource.description}
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
      title="Related Resources"
      description="Explore related external resources and reference links configured for this site."
      titleId="related-resources"
    >
      <div className="@container">
        <div className="grid gap-4 @[500px]:grid-cols-2 @[800px]:grid-cols-4">
          {externalResources.map(resource => (
            <Link
              key={resource.url}
              href={resource.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded-lg"
            >
              <Card className="h-full flex flex-col transition-all duration-200 hover:border-primary/50 hover:bg-muted/50 rounded-2xl border-border/50">
                <CardHeader className="p-2 sm:p-2.5 md:p-3 space-y-1">
                  <CardTitle className="flex items-center gap-2 leading-5 text-base sm:text-lg">
                    {resource.name}
                    <ExternalLink
                      className="size-4 opacity-0 transition-opacity group-hover:opacity-100 shrink-0"
                      aria-hidden
                    />
                  </CardTitle>
                  <CardDescription className="text-sm sm:text-base">
                    {resource.description}
                  </CardDescription>
                </CardHeader>
                {layout === 'default' && resource.imageSrc && resource.imageAlt && (
                  <CardContent className="p-2 sm:p-2.5 md:p-3 pt-0 mt-auto">
                    <div className="relative aspect-video overflow-hidden rounded-lg">
                      <Image
                        src={resource.imageSrc}
                        alt={resource.imageAlt}
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
