import { readFileSync, readdirSync } from 'node:fs'
import path from 'node:path'

function readMdxDirectory(relativePathFromRepoRoot: string): string {
  const directory = path.resolve(__dirname, '../../../../', relativePathFromRepoRoot)

  return readdirSync(directory)
    .filter(fileName => fileName.endsWith('.mdx'))
    .map(fileName => readFileSync(path.join(directory, fileName), 'utf8'))
    .join('\n')
}

describe('public starter docs content', () => {
  it('does not ship llms-specific residue in public docs and resources', () => {
    const content = [
      readMdxDirectory('packages/content/data/docs'),
      readMdxDirectory('packages/content/data/resources')
    ].join('\n')

    expect(content).not.toMatch(/llmstxt-cli/i)
    expect(content).not.toMatch(/llms\.txt/i)
    expect(content).not.toMatch(/llms-full\.txt/i)
  })
})
