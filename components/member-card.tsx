import Link from 'next/link'
import type { Member } from '@/lib/types'

interface MemberCardProps {
  member: Member
}

export function MemberCard({ member }: MemberCardProps) {
  const initials = member.name
    .split(' ')
    .map(part => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  return (
    <article className="rounded-2xl border border-border/50 bg-card/50 p-4 text-center backdrop-blur-sm transition-colors hover:bg-card">
      <div className="mx-auto flex size-16 items-center justify-center rounded-full border border-border/50 bg-muted text-lg font-semibold">
        {initials}
      </div>
      <div className="mt-4 space-y-1">
        <h3 className="font-semibold tracking-tight">{member.name}</h3>
        <p className="text-sm text-muted-foreground">{member.handle}</p>
      </div>
      <p className="mt-3 text-sm leading-7 text-muted-foreground">{member.headline}</p>
      <div className="mt-4 text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
        Joined {member.joinedMonth}
      </div>
      <Link href="/members/" className="mt-4 inline-block text-sm font-medium underline-offset-4 hover:underline">
        View members
      </Link>
    </article>
  )
}