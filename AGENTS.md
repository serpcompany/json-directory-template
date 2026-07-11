# AGENTS.md

- Ignore the `.devin/` folder in any project (if present)
- Never make guesses or assumptions. Always get fact-based data before making decisions: research it online, look it up in the codebase, and ask the user if necessary.

## Permissions

Databases:

- DO NOT run any commands directly against databases (local, staging, production or otherwise) unless the user gives explicit permission or instruction.
- Always work first from the project's code through the project's ORM's best practices.

Git:

- DO NOT run `git add`, `git commit` or `git push` commands unless the user gives explicit permission or instruction.
- You are allowed to run READ ONLY `git` commands.

User's Filesystem:

- DO NOT run any `rm` type commands that permanently delete things with no means of recovery unless the user gives explicit permission or instruction.
- Do NOT create files in `/tmp/*`; use a project-root `./tmp/` folder instead.
- Clean up all tmp files before finishing your task so you do not fill the user's disk space.

User's System Resources:

- Avoid launching many parallel searches/tasks at once, especially for very large searches, to avoid crashing VS Code.

## Project Workflow

- Read the docs before doing anything.
- Do not make things up.
- Do not take shortcuts.
- Do things properly.
- Deploy a subagent whose sole responsibility is to police decisions and make sure corners are not being cut.
- Treat `pnpm deploy`, `pnpm deploy:site`, target GitHub Pages repo syncs, and any command that pushes a generated site artifact as git push operations.
- Before opening, merging, or deploying a PR, inspect `git status --short` and account for every modified or untracked file. Do not call a change "unrelated" unless its diff proves it is outside the current request; if unsure, ask the user.
- Do not merge or deploy while known task-related files remain uncommitted, unstaged, untracked, or left for a vague follow-up. Put all related source, generated, media, docs, and test changes through the same gitflow, or explicitly confirm a separate follow-up PR with the user before deployment.
- Do not run a real deploy unless the user explicitly asks for that deploy and the source repo changes have already gone through gitflow: branch, commit, push, review/merge, then deploy from a clean branch synced with upstream or from GitHub Actions.
- When the source worktree has uncommitted, untracked, unpushed, behind, or diverged changes, only build, audit, report, or `--dry-run` deploy commands are allowed.
- If a merge or post-merge fast-forward is blocked by a dirty worktree, stop and resolve the dirty state through evidence-based categorization before claiming gitflow is complete or anything is live.
- Do not use deploy target overrides such as `DEPLOY_REPO_URL` or `DEPLOY_BRANCH` in normal deploys; deploy targets must come from checked-in site config unless the user gives explicit same-turn emergency bypass approval.

## Code Style and Structure

- Write concise, technical TypeScript code with accurate examples.
- Use functional and declarative programming patterns; avoid classes.
- Prefer iteration and modularization over code duplication.
- Use descriptive variable names with auxiliary verbs, such as `isLoading` and `hasError`.
- Structure files as exported component, subcomponents, helpers, static content, and types.

## Naming Conventions

- Use lowercase with dashes for directories, such as `components/auth-wizard`.
- Favor named exports for components.

## TypeScript Usage

- Use TypeScript for all code; prefer interfaces over types.
- Avoid enums; use maps instead.
- Use functional components with TypeScript interfaces.

## Syntax and Formatting

- Use the `function` keyword for pure functions.
- Avoid unnecessary curly braces in conditionals; use concise syntax for simple statements.
- Use declarative JSX.

## UI and Styling

- Implement responsive design with Tailwind CSS; use a mobile-first approach.

## Performance Optimization

- Minimize `use client`, `useEffect`, and `setState`; favor React Server Components.
- Wrap client components in Suspense with fallback.
- Use dynamic loading for non-critical components.
- Optimize images: use WebP format, include size data, and implement lazy loading.
- Optimize Web Vitals: LCP, CLS, and FID.
- Follow Next.js docs for data fetching, rendering, and routing.

## Shadcnblocks

- We have a lifetime full account to `https://www.shadcnblocks.com/docs`.
- The VS Code extension is installed with the API key.
- You can also use the API key in the `~/dev/repos/shadcnblocks/.env` file.
- Use their components, blocks, pages, and related assets.
- Do not roll your own items when existing ShadcnBlocks items are available.
- Make UI reusable.
- Use the API key, VS Code extension, and MCP server for ShadcnBlocks work.
