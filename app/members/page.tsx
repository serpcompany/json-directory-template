import type { Metadata } from 'next'
import { MemberCard } from '@/components/member-card'
import { getMembers } from '@/lib/data'

export const metadata: Metadata = {
  title: 'Community Members',
  description:
    'Browse the members contributing to AI-ready documentation and llms.txt implementations.'
}

export default function MembersPage() {
  const members = getMembers()

  return (
    <div className="container mx-auto py-8">
      <div className="space-y-10">
        <header className="space-y-2">
          <h1 className="flex items-center gap-3 text-4xl font-bold tracking-tight">
            <span className="size-2 rounded-full bg-foreground" />
            Community Members
          </h1>
          <p className="text-lg text-muted-foreground">{members.length} members and growing.</p>
        </header>

        <section className="space-y-6">
          <h2 className="text-sm font-bold uppercase tracking-[0.18em] text-muted-foreground">
            All Members ({members.length})
          </h2>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
            {members.map(member => (
              <MemberCard key={member.slug} member={member} />
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}