import fs from 'node:fs'
import path from 'node:path'

type WebPackageJson = {
  scripts: Record<string, string>
}

describe('web dev runtime config', () => {
  it('pins Turbopack to the repo root instead of inferring from parent lockfiles', () => {
    const nextConfigSource = fs.readFileSync(path.join(process.cwd(), 'next.config.ts'), 'utf8')

    expect(nextConfigSource).toContain("root: path.resolve(process.cwd(), '../..')")
  })

  it('keeps the Node inspector opt-in for normal local dev', () => {
    const packageJsonPath = path.join(process.cwd(), 'package.json')
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8')) as WebPackageJson

    expect(packageJson.scripts.dev).toBe('next dev --webpack --port 3005')
    expect(packageJson.scripts['dev:inspect']).toBe(
      "NODE_OPTIONS='--inspect' next dev --webpack --port 3005"
    )
  })
})
