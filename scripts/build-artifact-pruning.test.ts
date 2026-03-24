import { mkdtempSync, mkdirSync, rmSync, writeFileSync, existsSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { pruneStaticArtifactDir } from './build-site.ts'

const tempDirs: string[] = []

function makeTempArtifactDir(): string {
  mkdirSync(resolve(process.cwd(), 'tmp'), { recursive: true })
  const dir = mkdtempSync(resolve(process.cwd(), 'tmp/build-artifact-pruning-'))
  tempDirs.push(dir)
  return dir
}

function writeFile(path: string, contents = 'test'): void {
  mkdirSync(dirname(path), { recursive: true })
  writeFileSync(path, contents)
}

afterEach(() => {
  tempDirs.splice(0).forEach(dir => {
    rmSync(dir, { force: true, recursive: true })
  })
})

describe('pruneStaticArtifactDir', () => {
  it('removes forbidden debug files and disabled default route surfaces', () => {
    const artifactDir = makeTempArtifactDir()

    writeFile(resolve(artifactDir, '_next/static/chunks/app.js.map'))
    writeFile(resolve(artifactDir, '__next._tree.txt'))
    writeFile(resolve(artifactDir, 'about/index.html'))
    writeFile(resolve(artifactDir, 'account/index.html'))
    writeFile(resolve(artifactDir, 'login/index.html'))
    writeFile(resolve(artifactDir, 'favorites/index.html'))
    writeFile(resolve(artifactDir, 'projects/index.html'))
    writeFile(resolve(artifactDir, 'docs/index.html'))
    writeFile(resolve(artifactDir, 'guides/index.html'))
    writeFile(resolve(artifactDir, '_not-found/index.html'))
    writeFile(resolve(artifactDir, '404/index.html'))
    writeFile(resolve(artifactDir, 'llms.txt'))

    pruneStaticArtifactDir(artifactDir, {
      showAuth: false,
      showDocs: false,
      showFavorites: false,
      showGuides: false,
      showProjects: false
    })

    expect(existsSync(resolve(artifactDir, '_next/static/chunks/app.js.map'))).toBe(false)
    expect(existsSync(resolve(artifactDir, '__next._tree.txt'))).toBe(false)
    expect(existsSync(resolve(artifactDir, 'account'))).toBe(false)
    expect(existsSync(resolve(artifactDir, 'login'))).toBe(false)
    expect(existsSync(resolve(artifactDir, 'favorites'))).toBe(false)
    expect(existsSync(resolve(artifactDir, 'projects'))).toBe(false)
    expect(existsSync(resolve(artifactDir, 'docs'))).toBe(false)
    expect(existsSync(resolve(artifactDir, 'guides'))).toBe(false)
    expect(existsSync(resolve(artifactDir, '_not-found'))).toBe(false)
    expect(existsSync(resolve(artifactDir, '404'))).toBe(false)
    expect(existsSync(resolve(artifactDir, 'about'))).toBe(true)
    expect(existsSync(resolve(artifactDir, 'llms.txt'))).toBe(true)
  })

  it('keeps explicitly enabled route surfaces', () => {
    const artifactDir = makeTempArtifactDir()

    writeFile(resolve(artifactDir, 'projects/index.html'))
    writeFile(resolve(artifactDir, 'docs/index.html'))
    writeFile(resolve(artifactDir, 'guides/index.html'))

    pruneStaticArtifactDir(artifactDir, {
      showAuth: false,
      showDocs: true,
      showFavorites: false,
      showGuides: true,
      showProjects: true
    })

    expect(existsSync(resolve(artifactDir, 'projects'))).toBe(true)
    expect(existsSync(resolve(artifactDir, 'docs'))).toBe(true)
    expect(existsSync(resolve(artifactDir, 'guides'))).toBe(true)
  })
})
