import { type NextRequest, NextResponse } from 'next/server'
import { readSubmissions } from '@/lib/submissions-store'

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get('token')

  if (!token) {
    return NextResponse.json({ error: 'Missing token' }, { status: 400 })
  }

  const pending = await readSubmissions('pending')
  const submission = pending.find(entry => entry.token === token)

  if (!submission) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  return NextResponse.json({
    name: submission.name,
    website: submission.website,
  })
}
