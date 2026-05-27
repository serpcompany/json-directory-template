import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import yaml from 'js-yaml';
import { describe, expect, it } from 'vitest';

interface InstallAction {
  runs: {
    steps: Array<{
      id?: string;
      uses?: string;
      with?: {
        dest?: string;
        key?: string;
        path?: string;
      };
    }>;
  };
}

interface WorkflowDefinition {
  concurrency?: {
    'cancel-in-progress'?: boolean;
    group?: string;
  };
}

function loadYamlFile<T>(path: string): T {
  return yaml.load(readFileSync(resolve(process.cwd(), path), 'utf8')) as T;
}

const githubExpression = (expression: string) => `$${expression}`;

describe('ci workflow install isolation', () => {
  it('installs pnpm into a job-scoped temp directory on self-hosted runners', () => {
    const action = loadYamlFile<InstallAction>('.github/actions/install/action.yml');
    const pnpmStep = action.runs.steps.find(
      (step) => step.uses === 'pnpm/action-setup@v4'
    );

    expect(pnpmStep?.with?.dest).toContain('runner.temp');
    expect(pnpmStep?.with?.dest).toContain('github.run_id');
    expect(pnpmStep?.with?.dest).toContain('github.job');
  });

  it('serializes release and build-deploy workflows on main instead of canceling either run', () => {
    const releaseWorkflow = loadYamlFile<WorkflowDefinition>(
      '.github/workflows/release.yml'
    );
    const buildWorkflow = loadYamlFile<WorkflowDefinition>(
      '.github/workflows/build-and-deploy.yml'
    );

    expect(releaseWorkflow.concurrency?.group).toBe(
      `main-ci-${githubExpression('{{ github.ref }}')}`
    );
    expect(buildWorkflow.concurrency?.group).toBe(releaseWorkflow.concurrency?.group);
    expect(releaseWorkflow.concurrency?.['cancel-in-progress']).toBe(false);
    expect(buildWorkflow.concurrency?.['cancel-in-progress']).toBe(false);
  });

  it('keeps the changesets action configured for release runs', () => {
    expect(existsSync(resolve(process.cwd(), '.changeset/config.json'))).toBe(
      true
    );
  });

  it('persists app-level Next caches without caching generated artifacts', () => {
    const action = loadYamlFile<InstallAction>('.github/actions/install/action.yml');
    const cacheStep = action.runs.steps.find(
      (step) => step.uses === 'actions/cache@v5'
    );
    const cachePath = cacheStep?.with?.path ?? '';

    expect(cachePath).toContain('~/.pnpm');
    expect(cachePath).toContain(
      `${githubExpression('{{ github.workspace }}')}/apps/*/.next/cache`
    );
    expect(cachePath).toContain(
      `${githubExpression('{{ github.workspace }}')}/.next/cache`
    );
    expect(cachePath).not.toContain('apps/*/out');
    expect(cachePath).not.toContain('dist/sites');
    expect(cachePath).not.toContain('.next/**');
    expect(cacheStep?.with?.key).toContain("hashFiles('**/pnpm-lock.yaml')");
    expect(cacheStep?.with?.key).toContain(
      "hashFiles('**/*.js', '**/*.jsx', '**/*.ts', '**/*.tsx')"
    );
  });
});
