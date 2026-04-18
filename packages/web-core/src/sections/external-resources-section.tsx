import { ExternalLink } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { externalResources } from '../external-resources';
import { Section } from '../layout/section';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../ui/card';

interface ExternalResourcesSectionProps {
  layout?: 'default' | 'compact';
  showImages?: boolean;
}

export function ExternalResourcesSection({
  layout = 'default',
  showImages = true,
}: ExternalResourcesSectionProps) {
  if (!externalResources.length) {
    return null;
  }

  if (!showImages) {
    return (
      <Section
        title="Related Resources"
        description="Explore related external resources and reference links configured for this site."
        titleId="related-resources"
      >
        <div className="overflow-hidden rounded-2xl border border-border/50 bg-card/50 backdrop-blur-sm">
          <ul className="divide-y divide-border/50">
            {externalResources.map((resource) => (
              <li key={resource.url}>
                <Link
                  href={resource.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-start gap-4 px-6 py-4 transition-colors hover:bg-muted/30 focus-visible:bg-muted/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
                >
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium text-foreground transition-colors group-hover:text-primary">
                      {resource.name}
                    </span>
                    <span className="mt-0.5 block line-clamp-2 text-sm text-muted-foreground">
                      {resource.description}
                    </span>
                  </span>
                  <ExternalLink
                    className="mt-1 size-4 shrink-0 text-muted-foreground transition-colors group-hover:text-primary"
                    aria-hidden
                  />
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </Section>
    );
  }

  return (
    <Section
      title="Related Resources"
      description="Explore related external resources and reference links configured for this site."
      titleId="related-resources"
    >
      <div className="@container">
        <div className="grid gap-4 @[500px]:grid-cols-2 @[800px]:grid-cols-4">
          {externalResources.map((resource) => (
            <Link
              key={resource.url}
              href={resource.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              <Card className="flex h-full flex-col rounded-2xl border-border/50 transition-all duration-200 hover:border-primary/50 hover:bg-muted/50">
                <CardHeader className="space-y-1 p-2 sm:p-2.5 md:p-3">
                  <CardTitle className="flex items-center gap-2 text-base leading-5 sm:text-lg">
                    {resource.name}
                    <ExternalLink
                      className="size-4 shrink-0 opacity-0 transition-opacity group-hover:opacity-100"
                      aria-hidden
                    />
                  </CardTitle>
                  <CardDescription className="text-sm sm:text-base">
                    {resource.description}
                  </CardDescription>
                </CardHeader>
                {layout === 'default' && resource.imageSrc && resource.imageAlt ? (
                  <CardContent className="mt-auto p-2 pt-0 sm:p-2.5 sm:pt-0 md:p-3 md:pt-0">
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
                ) : null}
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </Section>
  );
}
