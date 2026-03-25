import path from 'node:path'
import { resolveOperatorSourcePath } from '@/lib/operator-onboarding-server'

describe('resolveOperatorSourcePath', () => {
  it('resolves site source files from the app working directory', () => {
    const appCwd = path.join(process.cwd(), 'apps', 'web')

    const resolvedPath = resolveOperatorSourcePath(
      'sites/serpdownloaders.com/products.json',
      appCwd
    )

    expect(resolvedPath).toBe(
      path.resolve(process.cwd(), '..', '..', 'sites', 'serpdownloaders.com', 'products.json')
    )
  })
})
