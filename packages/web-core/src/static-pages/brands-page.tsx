import { ExternalLink } from 'lucide-react'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getNetworkBrandsForGroup } from '../network-brands'
import { generateDisabledRouteMetadata } from '../route-feature-gates'
import { getRoute } from '../routes'
import { generateBaseMetadata } from '../seo-config'
import { siteConfig } from '../site-config'
import { siteCopy } from '../site-copy'
import { Card, CardContent } from '../ui/card'

export const dynamic = 'force-static'

export function generateMetadata(): Metadata {
  if (!siteConfig.features.showBrands) {
    return generateDisabledRouteMetadata()
  }

  return generateBaseMetadata({
    title: siteCopy.brandsLabel,
    description: `Browse sites and products in the ${siteConfig.name} network.`,
    path: getRoute('brands'),
    keywords: ['brands', 'network', siteConfig.name]
  })
}

export default function BrandsPage() {
  if (!siteConfig.features.showBrands) {
    notFound()
  }

  const brands = getNetworkBrandsForGroup(siteConfig.networkBrandGroup)

  return (
    <main className="container mx-auto py-8">
      <div className="space-y-10">
        <section className="space-y-3">
          <p className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
            Network
          </p>
          <h1 className="text-4xl font-bold tracking-tight">{siteCopy.brandsLabel}</h1>
          <p className="max-w-3xl text-lg text-muted-foreground">
            Browse sites and products in the {siteConfig.name} network.
          </p>
        </section>

        <section
          aria-label={siteCopy.brandsLabel}
          className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
        >
          {brands.map(brand => (
            <Card
              key={brand.slug}
              className="transition-all hover:border-primary hover:bg-muted/50"
            >
              <CardContent className="flex h-full flex-col justify-between gap-6 p-6">
                <div className="space-y-2">
                  <h2 className="text-lg font-semibold tracking-tight">
                    <a
                      className="inline-flex items-center gap-2 text-primary hover:underline"
                      href={brand.url}
                      rel="noopener noreferrer"
                      target="_blank"
                    >
                      {brand.name}
                      <ExternalLink className="size-4" aria-hidden="true" />
                    </a>
                  </h2>
                  <p className="break-words text-sm text-muted-foreground">{brand.hostname}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </section>
      </div>
    </main>
  )
}
