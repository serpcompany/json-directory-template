# Legacy MDX Authoring Flow

This folder preserves the old MDX-based community intake flow as reference-only material.

Archived here:

- PR-intake and PR-automerge workflows for the old MDX fast lane
- helper scripts that read or rewrite `packages/content/data/websites/**`
- repo-policy tests that only existed to protect that old flow

This folder is not part of the active starter contract.
The active maintainer flow now uses checked-in site config plus listing-entry sources such as:

- `data/listings.json`
- `sites/<site-id>/products.json`

Do not move these archived files back into active CI or package scripts unless the product direction explicitly returns to the MDX-entry model.
