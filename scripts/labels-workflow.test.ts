import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import yaml from 'js-yaml';
import { describe, expect, it } from 'vitest';

interface LabelerDefinition {
  [labelName: string]: Array<{
    'changed-files'?: Array<{
      'any-glob-to-any-file'?: string[];
    }>;
  }>;
}

function loadLabelsWorkflow(): string {
  return readFileSync(
    resolve(process.cwd(), '.github/workflows/labels.yml'),
    'utf8'
  );
}

function loadLabelerRules(): LabelerDefinition {
  return yaml.load(
    readFileSync(resolve(process.cwd(), '.github/labeler.yml'), 'utf8')
  ) as LabelerDefinition;
}

describe('labels workflow', () => {
  it('only manages the active content label for current listing-entry sources', () => {
    const workflow = loadLabelsWorkflow();

    expect(workflow).toContain("name: 'area:content'");
    expect(workflow).not.toContain("name: 'lane:mdx-fast'");
    expect(workflow).not.toContain("name: 'lane:standard'");
    expect(workflow).not.toContain("name: 'lane:blocked'");
    expect(workflow).not.toContain("name: 'status:blocked'");
    expect(workflow).not.toContain("name: 'generated:listings-json'");
    expect(workflow).not.toContain("name: 'needs:generated-file-review'");
    expect(workflow).not.toContain("name: 'automerge:candidate'");
  });

  it('labels active listing-entry sources instead of the legacy website mdx corpus', () => {
    const labelerRules = loadLabelerRules();
    const contentRules = labelerRules['area:content'];

    expect(contentRules).toBeDefined();

    const globs =
      contentRules
        ?.flatMap((rule) => rule['changed-files'] || [])
        .flatMap((rule) => rule['any-glob-to-any-file'] || []) || [];

    expect(globs).toContain('data/listings.json');
    expect(globs).toContain('sites/**/products.json');
    expect(globs).not.toContain('packages/content/data/websites/**');
    expect(labelerRules['generated:listings-json']).toBeUndefined();
  });
});
