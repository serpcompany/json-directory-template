import { NextResponse } from 'next/server'

const DISABLED_MESSAGE =
  'Runtime submissions are disabled. Use the static GitHub issue submit flow.'

export function POST() {
  return NextResponse.json({ error: DISABLED_MESSAGE }, { status: 410 })
}
