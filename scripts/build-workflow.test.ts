import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

describe('build-and-deploy workflow defaults', () => {
  it('does not hardcode serpdownloaders.com as the fallback site id', () => {
    const workflow = readFileSync(
      resolve(process.cwd(), '.github/workflows/build-and-deploy.yml'),
      'utf8'
    )

    expect(workflow).not.toContain('serpdownloaders.com')
    expect(workflow).toContain('default')
  })
})
