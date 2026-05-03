import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const workspaceRoot = process.cwd()

const wrapperLayouts = [
  'apps/starter/app/layout.tsx',
  'apps/serpdownloaders.com/app/layout.tsx',
  'apps/pornvideodownloaders.com/app/layout.tsx',
] as const

describe('thin wrapper runtime boundaries', () => {
  it.each(wrapperLayouts)('%s does not own the design system provider', relativePath => {
    const source = readFileSync(resolve(workspaceRoot, relativePath), 'utf8')

    expect(source).not.toContain('DesignSystemProvider')
    expect(source).not.toContain('@thedaviddias/design-system/theme-provider')
  })
})
