  If you ever bring back lightweight user profiles, you could keep the extra profile
  info in a file inside the repo instead of a database.

  Example idea:

  - GitHub auth tells you who the person is
  - data/users.json stores extra public fields like:
      - bio
      - website
      - social links
      - featured status
      - custom display name
      - maybe “submitted tools”

  So instead of a full user system, you’d have:

  - identity from GitHub
  - public profile overrides from repo data

  Why “overrides”:
  because GitHub would provide the base profile, and data/users.json would only add or
  replace a few fields.

  Example shape:

  [
    {
      "githubLogin": "devinschumacher",
      "displayName": "Devin Schumacher",
      "bio": "Building directory starters and AI tools.",
      "website": "https://example.com",
      "x": "devin",
      "featured": true
    }
  ]

  This is good for:

  - public member pages
  - attribution
  - simple profile customization

  This is not good for:

  - live profile editing on-site
  - private settings
  - synced favorites
  - anything that needs instant user writes
