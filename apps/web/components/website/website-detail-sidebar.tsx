import registryData from '@cli-data/registry.json';
import { Calendar, Download, Hash } from 'lucide-react';
import Link from 'next/link';
import { getCategoryDisplayName } from '@/lib/category-display';
import type { WebsiteMetadata } from '@/lib/content-loader';
import { getRoute } from '@/lib/routes';

const webSlugToCliSlug = new Map<string, string>();
for (const entry of registryData as { slug: string; webSlug?: string }[]) {
  if (entry.webSlug) {
    webSlugToCliSlug.set(entry.webSlug, entry.slug);
  }
}

interface WebsiteDetailSidebarProps {
  website: WebsiteMetadata;
}

/**
 * Sidebar for website detail pages showing static metadata for the selected website.
 */
export function WebsiteDetailSidebar({ website }: WebsiteDetailSidebarProps) {
  const cliSlug = webSlugToCliSlug.get(website.slug);

  return (
    <aside className="space-y-6 lg:sticky lg:top-20 lg:self-start">
      <div className="rounded-2xl border border-border/50 bg-card/50 backdrop-blur-sm p-6 space-y-6">
        {cliSlug && (
          <div>
            <span className="text-xs font-mono uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Download className="size-3" aria-hidden />
              CLI Slug
            </span>
            <p className="mt-1 text-sm font-mono text-foreground">{cliSlug}</p>
          </div>
        )}

        {website.category && (
          <div>
            <span className="text-xs font-mono uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Hash className="size-3" aria-hidden />
              Category
            </span>
            <Link
              href={getRoute('category.page', { category: website.category })}
              className="mt-1 inline-block text-sm text-foreground hover:text-primary transition-colors capitalize"
            >
              {getCategoryDisplayName(website.category)}
            </Link>
          </div>
        )}

        {website.publishedAt && (
          <div>
            <span className="text-xs font-mono uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Calendar className="size-3" aria-hidden />
              Added
            </span>
            <p className="text-sm text-foreground mt-1">
              {new Date(website.publishedAt).toLocaleDateString('en-US', {
                month: 'long',
                day: 'numeric',
                year: 'numeric',
              })}
            </p>
          </div>
        )}
      </div>
    </aside>
  );
}
