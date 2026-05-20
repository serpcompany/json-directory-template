import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

describe('deploy-to-repo.sh', () => {
  it('force-adds generated static artifacts so global ignore rules cannot drop URL paths', () => {
    const script = readFileSync(resolve(process.cwd(), 'scripts/deploy-to-repo.sh'), 'utf8')

    expect(script).toContain('git add -A -f')
  })
})
