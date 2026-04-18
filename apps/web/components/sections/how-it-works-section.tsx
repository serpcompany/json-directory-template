import { Compass, Search, Send } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Section } from '@thedaviddias/web-core/layout/section'
import { siteCopy } from '@thedaviddias/web-core/site-copy'

/**
 * Renders a neutral starter explainer section
 */
export function HowItWorksSection() {
  return (
    <Section
      title="How It Works"
      description="Browse the directory, compare entries, and submit something new in three simple steps."
    >
      <div className="grid gap-4 sm:gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardContent className="p-2 text-center space-y-1.5">
            <div className="bg-primary/10 p-2 sm:p-2.5 rounded-full w-12 h-12 sm:w-14 sm:h-14 flex items-center justify-center mx-auto">
              <Compass className="h-6 w-6 sm:h-7 sm:w-7 text-primary" />
            </div>
            <h3 className="text-sm sm:text-base font-semibold">1. Explore the Directory</h3>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Browse curated {siteCopy.listingName.plural} by category, recent additions, and
              featured picks.
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-2 text-center space-y-1.5">
            <div className="bg-primary/10 p-2 sm:p-2.5 rounded-full w-12 h-12 sm:w-14 sm:h-14 flex items-center justify-center mx-auto">
              <Search className="h-6 w-6 sm:h-7 sm:w-7 text-primary" />
            </div>
            <h3 className="text-sm sm:text-base font-semibold">
              2. Compare Each {siteCopy.listingName.singularTitle}
            </h3>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Open detail pages to review descriptions, links, and the context that matters before
              you click through.
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-2 text-center space-y-1.5">
            <div className="bg-primary/10 p-2 sm:p-2.5 rounded-full w-12 h-12 sm:w-14 sm:h-14 flex items-center justify-center mx-auto">
              <Send className="h-6 w-6 sm:h-7 sm:w-7 text-primary" />
            </div>
            <h3 className="text-sm sm:text-base font-semibold">
              3. Submit New {siteCopy.listingName.pluralTitle}
            </h3>
            <p className="text-xs sm:text-sm text-muted-foreground">
              If something is missing, use {siteCopy.submitLabelSentence} to send it through the
              GitHub review flow.
            </p>
          </CardContent>
        </Card>
      </div>
    </Section>
  )
}
