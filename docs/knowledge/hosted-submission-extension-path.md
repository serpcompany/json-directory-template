# Hosted Submission Extension Path

This doc defines the future hosted auth and submission direction without pulling runtime product concerns into the current static build pipeline.

## Decision summary

The project should support two modes over time:

- `static starter mode`
  the current default, with GitHub issue intake and checked-in data changes
- `optional hosted mode`
  a future additive layer for auth, submission, moderation, and ownership verification

The hosted mode should not become part of the core build contract.

## Ownership decision

Recommended ownership split:

- this repo remains the static build and deploy authority
- hosted auth, submissions, moderation, and abuse controls live in a separate control plane or companion service

That control plane can be implemented later in a separate repo or as a clearly isolated service boundary, but it should not reshape the static build pipeline or the target static site repos.

## What stays in this repo

This repo should continue to own:

- checked-in site config
- checked-in listing data and content
- validation rules
- build and deploy orchestration
- deterministic static artifacts

Approved public content should still become repo-owned, reviewable data before it becomes part of a build.

## What the hosted control plane would own

The future hosted layer should own transient workflow state such as:

- user accounts
- sessions
- ownership verification state
- submission drafts
- moderation queue state
- reviewer actions
- audit logs
- abuse and rate-limit decisions

Those are operational workflow concerns, not static build inputs.

## Canonical write target

Approved submissions should write back into versioned repo data, not publish directly from the hosted database.

Recommended write-back target:

1. hosted control plane receives and moderates the submission
2. approval creates a normalized change against checked-in source data
3. that change becomes a PR or equivalent repo-owned patch
4. the existing validate -> build -> deploy pipeline runs from the checked-in result

That keeps the durable source of truth reviewable and reproducible.

## Minimal future user flow

Recommended hosted flow:

1. submitter signs in to the hosted control plane
2. submitter creates a new listing or edit request
3. if needed, the control plane runs ownership verification
4. submission enters a moderation queue
5. reviewer approves, rejects, or requests changes
6. approval creates a repo-owned data update
7. the normal static pipeline validates and publishes the approved change

## Moderation model

Recommended moderation states:

- draft
- submitted
- needs-review
- changes-requested
- approved
- rejected
- published

Recommended moderation behavior:

- no direct publish from user input
- no database-first canonical listing store for the public site
- reviewer approval must happen before repo write-back
- all published content should still be traceable to a checked-in change

## Profile and account data

Profile or account data should remain optional and external to directory content.

That means:

- auth identities are for the hosted workflow only
- directory listings are not modeled as account-owned runtime records in the static pipeline
- if ownership metadata is needed, it should be carried as explicit listing fields or moderation metadata, not by coupling the build to user sessions

## Anti-spam and abuse expectations

The hosted layer should own:

- rate limiting
- CAPTCHA or equivalent bot friction
- duplicate detection
- domain verification when needed
- reviewer audit history
- submission throttling and reputation controls

None of those should be required to run a normal static build.

## Current bridge decision

The current GitHub issue submit flow is a bridge feature, not the long-term hosted architecture.

Keep it because it works for the static starter today:

- low operational overhead
- no auth requirement
- PR remains the reviewable write path

But future hosted mode should be able to replace or hide it per site without changing the build contract.

## Extension boundary

The future hosted layer should plug into the existing system at two points only:

- intake
  collect submissions and moderation decisions outside the build
- write-back
  produce repo-owned listing/content changes for the existing pipeline

Everything after write-back should remain the same:

- validate
- build
- deploy

## What not to do

Do not:

- add sessions or databases to the current static build contract
- make target static repos depend on runtime APIs
- make the final site require auth just to render public content
- treat hosted database rows as the only source of truth for published listings
- bypass repo review and auditability for approved content

## Practical implication for the repo today

The repo should keep:

- static-first defaults
- GitHub issue intake as the active submission path
- checked-in JSON and content as the durable publish source

And it should treat hosted auth/submission as a future optional product layer, not a blocker for the static starter.
