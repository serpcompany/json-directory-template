import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import yaml from 'js-yaml';
import { describe, expect, it } from 'vitest';

interface WorkflowTrigger {
  branches?: string[];
  paths?: string[];
}

interface WorkflowDefinition {
  concurrency?: {
    group?: string;
  };
  jobs: Record<
    string,
    {
      steps?: Array<{
        name?: string;
        run?: string;
      }>;
    }
  >;
  on: {
    pull_request?: WorkflowTrigger;
    push?: WorkflowTrigger;
    workflow_dispatch?: Record<string, never>;
  };
}

function loadWorkflow(): WorkflowDefinition {
  const workflowPath = resolve(
    process.cwd(),
    '.github/workflows/update-websites-json.yml'
  );
  const raw = readFileSync(workflowPath, 'utf8');

  return yaml.load(raw) as WorkflowDefinition;
}

describe('update-websites-json workflow', () => {
  it('validates listing data on pull requests as well as pushes to main', () => {
    const workflow = loadWorkflow();

    expect(workflow.on.pull_request).toMatchObject({
      branches: ['main'],
      paths: ['data/websites.json'],
    });
    expect(workflow.on.push).toMatchObject({
      branches: ['main'],
      paths: ['data/websites.json'],
    });
  });

  it('runs the checked-in listing data validator against data/websites.json', () => {
    const workflow = loadWorkflow();
    const validateJob = workflow.jobs['validate-listing-data'];
    const validateStep = validateJob.steps?.find(
      (step) => step.name === 'Validate data/websites.json'
    );

    expect(validateStep?.run).toBe(
      'pnpm tsx scripts/validate-data.ts data/websites.json'
    );
  });

  it('uses a concurrency key that separates pull requests from branch refs', () => {
    const workflow = loadWorkflow();

    expect(workflow.concurrency?.group).toContain(
      'github.event.pull_request.number'
    );
    expect(workflow.concurrency?.group).toContain('github.ref');
  });
});
