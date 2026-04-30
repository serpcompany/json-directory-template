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

    expect(releaseWorkflow.concurrency?.group).toBe('main-ci-${{ github.ref }}');
    expect(buildWorkflow.concurrency?.group).toBe(releaseWorkflow.concurrency?.group);
    expect(releaseWorkflow.concurrency?.['cancel-in-progress']).toBe(false);
    expect(buildWorkflow.concurrency?.['cancel-in-progress']).toBe(false);
  });

  it('keeps the changesets action configured for release runs', () => {
    expect(existsSync(resolve(process.cwd(), '.changeset/config.json'))).toBe(
      true
    );
  });
});
