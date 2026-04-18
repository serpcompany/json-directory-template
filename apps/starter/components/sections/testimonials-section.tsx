import { Card, CardContent } from '@/components/ui/card'
import { Section } from '@thedaviddias/web-core/layout/section'

const proofPoints = [
  {
    body: 'New submissions go through a visible review flow instead of a hidden admin panel.',
    title: 'Clear submission flow'
  },
  {
    body: 'Core directory wording can be retargeted site by site without rewriting the whole starter.',
    title: 'Reusable copy surface'
  },
  {
    body: 'Optional routes and content areas can be classified, pruned, or replaced as each site matures.',
    title: 'Flexible starter boundaries'
  }
]

export function TestimonialsSection() {
  return (
    <Section
      title="Why This Starter Works"
      description="The starter keeps the core directory workflow simple while leaving room to specialize later."
    >
      <div className="grid gap-6 md:grid-cols-3">
        {proofPoints.map(point => (
          <Card key={point.title}>
            <CardContent className="space-y-3 p-6">
              <h3 className="text-lg font-semibold">{point.title}</h3>
              <p className="text-sm text-muted-foreground">{point.body}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </Section>
  )
}
