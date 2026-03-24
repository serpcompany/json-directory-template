import { ExternalLink, Link2 } from 'lucide-react';
import { WebsiteCliSection } from '@/components/website/website-cli-section';
import type { WebsiteMetadata } from '@/lib/content-loader';

interface WebsiteResourcesSectionProps {
  website: WebsiteMetadata;
}

export function WebsiteResourcesSection({
  website,
}: WebsiteResourcesSectionProps) {
  const resourceLinks = website.resourceLinks ?? [];

  return (
    <>
      <WebsiteCliSection website={website} />

      {resourceLinks.length > 0 ? (
        <section className="animate-fade-in-up opacity-0 stagger-3">
          <div className="rounded-2xl border border-border/50 bg-card/50 p-6 backdrop-blur-sm md:p-8">
            <div className="mb-6 flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10">
                <Link2 className="size-5 text-primary" aria-hidden />
              </div>
              <div>
                <h2
                  className="scroll-mt-20 text-xl font-bold text-pretty"
                  id="links"
                >
                  Links
                </h2>
                <p className="mt-0.5 text-sm text-muted-foreground">
                  Helpful links for this entry
                </p>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {resourceLinks.map((link) => (
                <a
                  key={`${link.label}-${link.url}`}
                  href={link.url}
                  target="_blank"
                  rel="noreferrer"
                  className="group flex items-center justify-between rounded-xl border border-border/50 bg-background/70 px-4 py-3 text-sm transition-colors hover:border-border hover:bg-background"
                >
                  <span className="font-medium text-foreground">
                    {link.label}
                  </span>
                  <ExternalLink
                    className="size-4 text-muted-foreground transition-colors group-hover:text-foreground"
                    aria-hidden
                  />
                </a>
              ))}
            </div>
          </div>
        </section>
      ) : null}
    </>
  );
}
