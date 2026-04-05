# CCPM Pilot

This branch is the controlled CCPM pilot for the next planning lane.

## Guardrails

- Local pilot branch: `pilot/ccpm-issue-39`
- Main repo remains: `serpcompany/json-directory-template`
- Shadow repo for CCPM sync: `serpcompany/json-directory-template-ccpm-pilot`
- Original main-repo issue stays unchanged: `#39`
- Shadow pilot issue: `serpcompany/json-directory-template-ccpm-pilot#1`
- Do not use the main repo project board as CCPM state during the pilot.
- Do not let CCPM sync issues, labels, or task state into the main repo during the pilot.
- Keep CCPM local working artifacts in `.claude/`, which is gitignored here.

## Pilot purpose

Use CCPM to test whether the storage/runtime evaluation lane benefits from:

- PRD-first planning
- technical epic breakdown
- task decomposition
- GitHub issue sync in an isolated space
- standup/blocked/next reporting

## Success criteria

- CCPM artifacts stay isolated from the main repo workflow
- shadow issues are enough to evaluate whether CCPM is useful here
- rollback is trivial: stop using this branch and archive/delete the shadow repo

## Rollback

1. Stop using `pilot/ccpm-issue-39`.
2. Switch back to `main`.
3. Ignore or remove the local `.claude/` pilot files.
4. Archive or delete `serpcompany/json-directory-template-ccpm-pilot`.
5. Keep working from the main repo issue flow if CCPM is not a good fit.
