import { NextResponse } from 'next/server'

const DISABLED_MESSAGE = 'Badge verification is disabled. Use the static GitHub issue submit flow.'

export function POST() {
  return NextResponse.json({ message: DISABLED_MESSAGE, verified: false }, { status: 410 })
}
