import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import yaml from 'js-yaml';
import { describe, expect, it } from 'vitest';

interface WorkflowStep {
  name?: string;
  run?: string;
}

interface WorkflowJob {
  steps?: WorkflowStep[];
}

interface WorkflowDefinition {
  jobs: Record<string, WorkflowJob>;
}

function loadWorkflow(): WorkflowDefinition {
  const workflowPath = resolve(
    process.cwd(),
    '.github/workflows/pr-review.yml'
  );
  const raw = readFileSync(workflowPath, 'utf8');

  return yaml.load(raw) as WorkflowDefinition;
}

describe('pr-review workflow', () => {
  it('validates the active checked-in sites through the generic site-validation entrypoint', () => {
    const workflow = loadWorkflow();
    const validateJob = workflow.jobs.validate;
    const stepRuns = validateJob.steps?.map((step) => step.run).filter(Boolean);

    expect(stepRuns).toContain('pnpm validate:sites');
    expect(stepRuns).not.toContain('pnpm validate:site -- --site default');
    expect(stepRuns).not.toContain(
      'pnpm validate:site -- --site serpdownloaders.com'
    );
    expect(stepRuns).not.toContain('pnpm validate:site -- --site serp.software');
    expect(stepRuns).not.toContain('pnpm check:frontmatter');
  });
});
