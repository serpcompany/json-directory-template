import { NextResponse } from 'next/server'

const DISABLED_MESSAGE =
  'Runtime submission lookup is disabled. Use the static GitHub issue submit flow.'

export function GET() {
  return NextResponse.json({ error: DISABLED_MESSAGE }, { status: 410 })
}
